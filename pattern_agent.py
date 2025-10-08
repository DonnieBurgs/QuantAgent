from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import ToolMessage, HumanMessage, SystemMessage
import json
import time
import copy
import logging
from openai import RateLimitError
from error_handler import (
    with_error_handling, 
    with_retry, 
    error_handler, 
    CircuitBreaker,
    create_safe_fallback_data
)

@with_retry(max_attempts=3, base_delay=2.0, retry_on=(RuntimeError, ValueError))
def invoke_tool_with_retry(tool_fn, tool_args, retries=3, wait_sec=4):
    """
    Invoke a tool function with retries if the result is missing an image.
    Enhanced with better error handling and logging.
    """
    logger = logging.getLogger(__name__)
    
    for attempt in range(retries):
        try:
            result = tool_fn.invoke(tool_args)
            img_b64 = result.get("pattern_image")
            if img_b64:
                logger.info(f"Successfully generated pattern image on attempt {attempt + 1}")
                return result
            
            logger.warning(f"Tool returned no image, retrying in {wait_sec}s (attempt {attempt + 1}/{retries})...")
            if attempt < retries - 1:  # Don't sleep on last attempt
                time.sleep(wait_sec)
                
        except Exception as e:
            logger.error(f"Tool execution failed on attempt {attempt + 1}: {e}")
            if attempt == retries - 1:  # Last attempt
                raise RuntimeError(f"Tool failed to generate image after {retries} retries: {e}")
            time.sleep(wait_sec)
    
    raise RuntimeError("Tool failed to generate image after multiple retries")


def create_pattern_agent(tool_llm, graph_llm, toolkit):
    """
    Create a pattern recognition agent node for candlestick pattern analysis.
    Enhanced with robust error handling and fallback mechanisms.
    """
    logger = logging.getLogger(__name__)
    
    # Register fallback strategies
    def pattern_fallback(state):
        """Fallback strategy when pattern analysis fails."""
        logger.warning("Using fallback strategy for pattern analysis")
        
        fallback_report = (
            "⚠️ FALLBACK MODE: Pattern recognition analysis unavailable due to system issues.\n\n"
            "Based on general market structure analysis:\n"
            "• Chart pattern analysis is currently unavailable\n"
            "• Consider manual chart review for pattern identification\n"
            "• Look for basic support/resistance levels\n"
            "• Monitor for breakout/breakdown signals\n"
            "• Exercise caution without visual pattern confirmation\n\n"
            "⚠️ RECOMMENDATION: Use additional technical analysis methods or wait for system recovery."
        )
        
        return {
            "messages": state.get("messages", []),
            "pattern_report": fallback_report,
        }
    
    error_handler.register_fallback("pattern_agent", pattern_fallback)
    
    # Circuit breaker for LLM calls
    llm_circuit_breaker = CircuitBreaker(
        failure_threshold=3,
        recovery_timeout=45.0,
        expected_exception=Exception
    )
    
    @with_error_handling(
        component_name="pattern_agent",
        log_errors=True,
        reraise_on_failure=False
    )
    def pattern_agent_node(state):
        try:
            # Validate input state
            if not state or "kline_data" not in state:
                raise ValueError("Invalid state: missing kline_data")
            
            kline_data = state["kline_data"]
            if not kline_data or not isinstance(kline_data, dict):
                raise ValueError("Invalid kline_data format")
            
            # --- Tool and pattern definitions ---
            tools = [toolkit.generate_kline_image]
            time_frame = state.get('time_frame', 'unknown')
            pattern_text = """
            Please refer to the following classic candlestick patterns:

            1. Inverse Head and Shoulders: Three lows with the middle one being the lowest, symmetrical structure, typically indicates an upcoming upward trend.
            2. Double Bottom: Two similar low points with a rebound in between, forming a 'W' shape.
            3. Rounded Bottom: Gradual price decline followed by a gradual rise, forming a 'U' shape.
            4. Hidden Base: Horizontal consolidation followed by a sudden upward breakout.
            5. Falling Wedge: Price narrows downward, usually breaks out upward.
            6. Rising Wedge: Price rises slowly but converges, often breaks down.
            7. Ascending Triangle: Rising support line with a flat resistance on top, breakout often occurs upward.
            8. Descending Triangle: Falling resistance line with flat support at the bottom, typically breaks down.
            9. Bullish Flag: After a sharp rise, price consolidates downward briefly before continuing upward.
            10. Bearish Flag: After a sharp drop, price consolidates upward briefly before continuing downward.
            11. Rectangle: Price fluctuates between horizontal support and resistance.
            12. Island Reversal: Two price gaps in opposite directions forming an isolated price island.
            13. V-shaped Reversal: Sharp decline followed by sharp recovery, or vice versa.
            14. Rounded Top / Rounded Bottom: Gradual peaking or bottoming, forming an arc-shaped pattern.
            15. Expanding Triangle: Highs and lows increasingly wider, indicating volatile swings.
            16. Symmetrical Triangle: Highs and lows converge toward the apex, usually followed by a breakout.
            """

            # --- Check for precomputed image in state ---
            pattern_image_b64 = state.get("pattern_image")
            
            # --- Enhanced retry wrapper for LLM invocation ---
            @llm_circuit_breaker
            @with_retry(max_attempts=3, base_delay=2.0, retry_on=(RateLimitError, Exception))
            def invoke_with_retry(call_fn, *args):
                return call_fn(*args)

            messages = state.get("messages", [])
            image_generation_failed = False
            
            # --- If no precomputed image, fall back to tool generation ---
            if not pattern_image_b64:
                logger.info("No precomputed pattern image found in state, generating with tool...")
                
                try:
                    # --- System prompt setup for tool generation ---
                    prompt = ChatPromptTemplate.from_messages(
                        [
                            (
                                "system",
                                "You are a trading pattern recognition assistant tasked with identifying classical high-frequency trading patterns. "
                                "You have access to tool: generate_kline_image. "
                                "Use it by providing appropriate arguments like `kline_data`\n\n"
                                "Once the chart is generated, compare it to classical pattern descriptions and determine if any known pattern is present. "
                                "If image generation fails, provide analysis based on the raw data."
                            ),
                            MessagesPlaceholder(variable_name="messages"),
                        ]
                    ).partial(
                        kline_data=json.dumps(kline_data, indent=2)
                    )

                    chain = prompt | tool_llm.bind_tools(tools)
                    
                    # --- Step 1: First LLM call to determine tool usage ---
                    ai_response = invoke_with_retry(chain.invoke, messages)
                    messages.append(ai_response)

                    # --- Step 2: Handle tool call (generate_kline_image) ---
                    if hasattr(ai_response, "tool_calls") and ai_response.tool_calls:
                        for call in ai_response.tool_calls:
                            try:
                                tool_name = call["name"]
                                tool_args = call.get("args", {})
                                # Always provide kline_data
                                tool_args["kline_data"] = copy.deepcopy(kline_data)
                                
                                tool_fn = next((t for t in tools if t.name == tool_name), None)
                                if tool_fn is None:
                                    logger.error(f"Tool not found: {tool_name}")
                                    continue
                                
                                tool_result = invoke_tool_with_retry(tool_fn, tool_args)
                                pattern_image_b64 = tool_result.get("pattern_image")
                                
                                if pattern_image_b64:
                                    logger.info("Successfully generated pattern image")
                                else:
                                    logger.warning("Tool returned empty image")
                                    image_generation_failed = True
                                
                                messages.append(
                                    ToolMessage(
                                        tool_call_id=call["id"],
                                        content=json.dumps(tool_result)
                                    )
                                )
                                
                            except Exception as e:
                                logger.error(f"Tool execution failed: {e}")
                                image_generation_failed = True
                                messages.append(
                                    ToolMessage(
                                        tool_call_id=call["id"],
                                        content=f"Error: Image generation failed - {str(e)}"
                                    )
                                )
                
                except Exception as e:
                    logger.error(f"Pattern image generation process failed: {e}")
                    image_generation_failed = True
            else:
                logger.info("Using precomputed pattern image from state")

            # --- Step 3: Vision analysis with image (precomputed or generated) ---
            final_response = None
            
            if pattern_image_b64 and not image_generation_failed:
                try:
                    image_prompt = [
                        {
                            "type": "text",
                            "text": (
                                f"This is a {time_frame} candlestick chart generated from recent OHLC market data.\n\n"
                                f"{pattern_text}\n\n"
                                "Determine whether the chart matches any of the patterns listed. "
                                "Clearly name the matched pattern(s), and explain your reasoning based on structure, trend, and symmetry. "
                                "If no clear pattern is visible, state that explicitly."
                            )
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{pattern_image_b64}"
                            }
                        }
                    ]

                    final_response = invoke_with_retry(graph_llm.invoke, [
                        SystemMessage(content="You are a trading pattern recognition assistant tasked with analyzing candlestick charts."),
                        HumanMessage(content=image_prompt)
                    ])
                    
                except Exception as e:
                    logger.error(f"Vision analysis failed: {e}")
                    final_response = None

            # --- Fallback to text-based analysis if image analysis failed ---
            if final_response is None:
                logger.warning("Falling back to text-based pattern analysis")
                try:
                    # Create a text-based analysis prompt
                    text_prompt = ChatPromptTemplate.from_messages([
                        (
                            "system",
                            f"You are a trading pattern recognition assistant. Analyze the following {time_frame} OHLC data "
                            "and identify potential patterns based on price movements, highs, lows, and trends.\n\n"
                            f"{pattern_text}\n\n"
                            "Based on the raw data, identify any potential patterns and provide your analysis. "
                            "Note that this analysis is based on data only, without visual confirmation."
                        ),
                        (
                            "human",
                            f"Analyze this OHLC data for patterns:\n{json.dumps(kline_data, indent=2)}"
                        )
                    ])
                    
                    final_response = invoke_with_retry(graph_llm.invoke, text_prompt.format_messages())
                    
                except Exception as e:
                    logger.error(f"Text-based analysis also failed: {e}")
                    return pattern_fallback(state)

            # Add context about analysis limitations
            report_content = final_response.content if final_response else ""
            if image_generation_failed:
                report_content += "\n\n⚠️ Note: Visual chart analysis was unavailable. Analysis is based on raw data only."

            return {
                "messages": messages + ([final_response] if final_response else []),
                "pattern_report": report_content,
                "pattern_image_generated": pattern_image_b64 is not None and not image_generation_failed
            }
            
        except Exception as e:
            logger.error(f"Critical error in pattern agent: {e}")
            return pattern_fallback(state)

    return pattern_agent_node
