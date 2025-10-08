"""
Agent for trend analysis in high-frequency trading (HFT) context.
Uses LLM and toolkit to generate and interpret trendline charts for short-term prediction.
Enhanced with robust error handling and fallback mechanisms.
"""
from langchain_core.messages import ToolMessage, HumanMessage, SystemMessage
import json
import time
import logging
from openai import RateLimitError
from error_handler import (
    with_error_handling, 
    with_retry, 
    error_handler, 
    CircuitBreaker,
    create_safe_fallback_data
)

# --- Enhanced retry wrapper for LLM invocation ---
@with_retry(max_attempts=3, base_delay=2.0, retry_on=(RateLimitError, Exception))
def invoke_with_retry(call_fn, *args, retries=3, wait_sec=4):
    """
    Retry a function call with exponential backoff for rate limits or errors.
    Enhanced with better error handling and logging.
    """
    logger = logging.getLogger(__name__)
    
    for attempt in range(retries):
        try:
            result = call_fn(*args)
            logger.info(f"Successfully executed function on attempt {attempt + 1}")
            return result
        except RateLimitError as e:
            logger.warning(f"Rate limit hit, retrying in {wait_sec}s (attempt {attempt + 1}/{retries})...")
            if attempt < retries - 1:
                time.sleep(wait_sec)
        except Exception as e:
            logger.error(f"Error: {e}, retrying in {wait_sec}s (attempt {attempt + 1}/{retries})...")
            if attempt < retries - 1:
                time.sleep(wait_sec)
    
    raise RuntimeError("Max retries exceeded")


def create_trend_agent(tool_llm, graph_llm, toolkit):
    """
    Create a trend analysis agent node for HFT with enhanced error handling.
    The agent uses precomputed images from state or falls back to tool generation.
    """
    logger = logging.getLogger(__name__)
    
    # Register fallback strategies
    def trend_fallback(state):
        """Fallback strategy when trend analysis fails."""
        logger.warning("Using fallback strategy for trend analysis")
        
        fallback_report = (
            "⚠️ FALLBACK MODE: Trend analysis unavailable due to system issues.\n\n"
            "Based on general market structure principles:\n"
            "• Trend line analysis is currently unavailable\n"
            "• Consider basic price action analysis\n"
            "• Look for higher highs/higher lows (uptrend) or lower highs/lower lows (downtrend)\n"
            "• Monitor key support and resistance levels\n"
            "• Exercise caution without visual trend confirmation\n\n"
            "⚠️ RECOMMENDATION: Use additional analysis methods or wait for system recovery."
        )
        
        return {
            "messages": state.get("messages", []),
            "trend_report": fallback_report,
        }
    
    error_handler.register_fallback("trend_agent", trend_fallback)
    
    # Circuit breaker for LLM calls
    llm_circuit_breaker = CircuitBreaker(
        failure_threshold=3,
        recovery_timeout=45.0,
        expected_exception=Exception
    )
    
    @with_error_handling(
        component_name="trend_agent",
        log_errors=True,
        reraise_on_failure=False
    )
    def trend_agent_node(state):
        try:
            # Validate input state
            if not state or "kline_data" not in state:
                raise ValueError("Invalid state: missing kline_data")
            
            kline_data = state["kline_data"]
            if not kline_data or not isinstance(kline_data, dict):
                raise ValueError("Invalid kline_data format")
            
            # --- Tool definitions ---
            tools = [toolkit.generate_trend_image]
            time_frame = state.get('time_frame', 'unknown')

            # --- Check for precomputed image in state ---
            trend_image_b64 = state.get("trend_image")
            
            messages = []
            image_generation_failed = False
            
            # --- Enhanced retry wrapper for LLM invocation ---
            @llm_circuit_breaker
            @with_retry(max_attempts=3, base_delay=2.0, retry_on=(RateLimitError, Exception))
            def enhanced_invoke_with_retry(call_fn, *args):
                return call_fn(*args)
            
            # --- If no precomputed image, fall back to tool generation ---
            if not trend_image_b64:
                logger.info("No precomputed trend image found in state, generating with tool...")
                
                try:
                    # --- System prompt for LLM ---
                    system_prompt = (
                        "You are a K-line trend pattern recognition assistant operating in a high-frequency trading context. "
                        "You must first call the tool `generate_trend_image` using the provided `kline_data`. "
                        "Once the chart is generated, analyze the image for support/resistance trendlines and known candlestick patterns. "
                        "If image generation fails, provide analysis based on the raw data. "
                        "Only then should you proceed to make a prediction about the short-term trend (upward, downward, or sideways)."
                    )

                    # --- Compose messages for the first round ---
                    messages = [
                        SystemMessage(content=system_prompt),
                        HumanMessage(content=f"Here is the recent kline data:\n{json.dumps(kline_data, indent=2)}")
                    ]

                    # --- Prepare tool chain ---
                    chain = tool_llm.bind_tools(tools)

                    # --- Step 1: Let LLM decide if it wants to call generate_trend_image ---
                    ai_response = enhanced_invoke_with_retry(chain.invoke, messages)
                    messages.append(ai_response)

                    # --- Step 2: Handle tool call (generate_trend_image) ---
                    if hasattr(ai_response, "tool_calls") and ai_response.tool_calls:
                        for call in ai_response.tool_calls:
                            try:
                                tool_name = call["name"]
                                tool_args = call.get("args", {})
                                # Always provide kline_data
                                import copy
                                tool_args["kline_data"] = copy.deepcopy(kline_data)
                                
                                tool_fn = next((t for t in tools if t.name == tool_name), None)
                                if tool_fn is None:
                                    logger.error(f"Tool not found: {tool_name}")
                                    continue
                                
                                # Execute tool with retry
                                @with_retry(max_attempts=2, base_delay=1.0)
                                def execute_trend_tool():
                                    return tool_fn.invoke(tool_args)
                                
                                tool_result = execute_trend_tool()
                                trend_image_b64 = tool_result.get("trend_image")
                                
                                if trend_image_b64:
                                    logger.info("Successfully generated trend image")
                                else:
                                    logger.warning("Tool returned empty trend image")
                                    image_generation_failed = True
                                
                                messages.append(
                                    ToolMessage(
                                        tool_call_id=call["id"],
                                        content=json.dumps(tool_result)
                                    )
                                )
                                
                            except Exception as e:
                                logger.error(f"Trend tool execution failed: {e}")
                                image_generation_failed = True
                                messages.append(
                                    ToolMessage(
                                        tool_call_id=call["id"],
                                        content=f"Error: Trend image generation failed - {str(e)}"
                                    )
                                )
                
                except Exception as e:
                    logger.error(f"Trend image generation process failed: {e}")
                    image_generation_failed = True
            else:
                logger.info("Using precomputed trend image from state")

            # --- Step 3: Vision analysis with image (precomputed or generated) ---
            final_response = None
            
            if trend_image_b64 and not image_generation_failed:
                try:
                    image_prompt = [
                        {
                            "type": "text",
                            "text": (
                                f"This candlestick ({time_frame} K-line) chart includes automated trendlines: the **blue line** is support, and the **red line** is resistance, both derived from recent closing prices.\n\n"
                                "Analyze how price interacts with these lines — are candles bouncing off, breaking through, or compressing between them?\n\n"
                                "Based on trendline slope, spacing, and recent K-line behavior, predict the likely short-term trend: **upward**, **downward**, or **sideways**. "
                                "Support your prediction with respect to prediction, reasoning, signals. "
                                "If the chart is unclear, state that explicitly."
                            )
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{trend_image_b64}"
                            }
                        }
                    ]

                    final_response = enhanced_invoke_with_retry(graph_llm.invoke, [
                        SystemMessage(content="You are a K-line trend pattern recognition assistant operating in a high-frequency trading context. "
                        "Your task is to analyze candlestick charts annotated with support and resistance trendlines."),
                        HumanMessage(content=image_prompt)
                    ])
                    
                except Exception as e:
                    logger.error(f"Vision-based trend analysis failed: {e}")
                    final_response = None

            # --- Fallback to text-based analysis if image analysis failed ---
            if final_response is None:
                logger.warning("Falling back to text-based trend analysis")
                try:
                    # Create a text-based analysis prompt
                    from langchain_core.prompts import ChatPromptTemplate
                    
                    text_prompt = ChatPromptTemplate.from_messages([
                        (
                            "system",
                            f"You are a trend analysis assistant. Analyze the following {time_frame} OHLC data "
                            "and identify trend direction based on price movements, highs, lows, and overall direction.\n\n"
                            "Look for:\n"
                            "- Higher highs and higher lows (uptrend)\n"
                            "- Lower highs and lower lows (downtrend)\n"
                            "- Sideways movement (consolidation)\n"
                            "- Support and resistance levels\n\n"
                            "Provide your trend analysis and prediction. "
                            "Note that this analysis is based on data only, without visual confirmation."
                        ),
                        (
                            "human",
                            f"Analyze this OHLC data for trend:\n{json.dumps(kline_data, indent=2)}"
                        )
                    ])
                    
                    final_response = enhanced_invoke_with_retry(graph_llm.invoke, text_prompt.format_messages())
                    
                except Exception as e:
                    logger.error(f"Text-based trend analysis also failed: {e}")
                    return trend_fallback(state)

            # Add context about analysis limitations
            report_content = final_response.content if final_response else ""
            if image_generation_failed:
                report_content += "\n\n⚠️ Note: Visual trend analysis was unavailable. Analysis is based on raw data only."

            return {
                "messages": messages + ([final_response] if final_response else []),
                "trend_report": report_content,
                "trend_image": trend_image_b64,
                "trend_image_filename": "trend_graph.png" if trend_image_b64 else None,
                "trend_image_description": "Trend-enhanced candlestick chart with support/resistance lines" if trend_image_b64 and not image_generation_failed else None,
                "trend_image_generated": trend_image_b64 is not None and not image_generation_failed
            }
            
        except Exception as e:
            logger.error(f"Critical error in trend agent: {e}")
            return trend_fallback(state)

    return trend_agent_node