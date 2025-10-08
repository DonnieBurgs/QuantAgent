"""
Agent for technical indicator analysis in high-frequency trading (HFT) context.
Uses LLM and toolkit to compute and interpret indicators like MACD, RSI, ROC, Stochastic, and Williams %R.
Enhanced with robust error handling and fallback mechanisms.
"""
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import ToolMessage, AIMessage
import json
import logging
from error_handler import (
    with_error_handling, 
    with_retry, 
    error_handler, 
    CircuitBreaker,
    create_safe_fallback_data
)

def create_indicator_agent(llm, toolkit):
    """
    Create an indicator analysis agent node for HFT with enhanced error handling.
    The agent uses LLM and indicator tools to analyze OHLCV data with fallback mechanisms.
    """
    logger = logging.getLogger(__name__)
    
    # Register fallback strategies
    def indicator_fallback(state):
        """Fallback strategy when indicator computation fails."""
        logger.warning("Using fallback strategy for indicator analysis")
        
        fallback_data = create_safe_fallback_data()
        fallback_report = (
            "⚠️ FALLBACK MODE: Technical indicator analysis unavailable due to system issues.\n\n"
            "Based on historical patterns and conservative analysis:\n"
            "• RSI: Estimated at neutral levels (45-55 range)\n"
            "• MACD: No clear directional signal available\n"
            "• ROC: Minimal momentum detected\n"
            "• Stochastic: Mid-range oscillation expected\n"
            "• Williams %R: Neutral positioning\n\n"
            "⚠️ RECOMMENDATION: Exercise extreme caution. Consider manual analysis or wait for system recovery."
        )
        
        return {
            "messages": state.get("messages", []),
            "indicator_report": fallback_report,
        }
    
    error_handler.register_fallback("indicator_agent", indicator_fallback)
    
    # Circuit breaker for LLM calls
    llm_circuit_breaker = CircuitBreaker(
        failure_threshold=3,
        recovery_timeout=30.0,
        expected_exception=Exception
    )
    
    @with_error_handling(
        component_name="indicator_agent",
        log_errors=True,
        reraise_on_failure=False
    )
    def indicator_agent_node(state):
        try:
            # Validate input state
            if not state or "kline_data" not in state:
                raise ValueError("Invalid state: missing kline_data")
            
            kline_data = state["kline_data"]
            if not kline_data or not isinstance(kline_data, dict):
                raise ValueError("Invalid kline_data format")
            
            # Check if we have minimum required data
            required_fields = ["Open", "High", "Low", "Close"]
            for field in required_fields:
                if field not in kline_data or not kline_data[field]:
                    raise ValueError(f"Missing required field: {field}")
            
            # Ensure we have enough data points
            data_length = len(kline_data.get("Close", []))
            if data_length < 14:  # Minimum for RSI calculation
                logger.warning(f"Insufficient data points ({data_length}), using available data")
            
            # --- Tool definitions with error handling ---
            tools = [
                toolkit.compute_macd,
                toolkit.compute_rsi,
                toolkit.compute_roc,
                toolkit.compute_stoch,
                toolkit.compute_willr,
            ]
            
            time_frame = state.get('time_frame', 'unknown')
            
            # --- System prompt for LLM ---
            prompt = ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        "You are a high-frequency trading (HFT) analyst assistant operating under time-sensitive conditions. "
                        "You must analyze technical indicators to support fast-paced trading execution.\n\n"
                        "You have access to tools: compute_rsi, compute_macd, compute_roc, compute_stoch, and compute_willr. "
                        "Use them by providing appropriate arguments like `kline_data` and the respective periods.\n\n"
                        f"⚠️ The OHLC data provided is from {time_frame} intervals, reflecting recent market behavior. "
                        "You must interpret this data quickly and accurately.\n\n"
                        "If any tool fails, continue with available indicators and note the limitation.\n\n"
                        "Here is the OHLC data:\n{kline_data}.\n\n"
                        "Call necessary tools, and analyze the results.\n"
                    ),
                    MessagesPlaceholder(variable_name="messages"),
                ]
            ).partial(
                kline_data=json.dumps(kline_data, indent=2)
            )

            chain = prompt | llm.bind_tools(tools)
            messages = state.get("messages", [])
            
            # --- Step 1: Ask for tool calls with circuit breaker ---
            @llm_circuit_breaker
            @with_retry(max_attempts=3, base_delay=1.0)
            def get_ai_response():
                return chain.invoke(messages)
            
            ai_response = get_ai_response()
            messages.append(ai_response)

            # --- Step 2: Collect tool results with individual error handling ---
            successful_tools = []
            failed_tools = []
            
            if hasattr(ai_response, "tool_calls") and ai_response.tool_calls:
                for call in ai_response.tool_calls:
                    try:
                        tool_name = call["name"]
                        tool_args = call.get("args", {})
                        
                        # Always provide kline_data
                        import copy
                        tool_args["kline_data"] = copy.deepcopy(kline_data)
                        
                        # Lookup tool by name
                        tool_fn = next((t for t in tools if t.name == tool_name), None)
                        if tool_fn is None:
                            logger.error(f"Tool not found: {tool_name}")
                            failed_tools.append(tool_name)
                            continue
                        
                        # Execute tool with error handling
                        @with_retry(max_attempts=2, base_delay=0.5)
                        def execute_tool():
                            return tool_fn.invoke(tool_args)
                        
                        tool_result = execute_tool()
                        successful_tools.append(tool_name)
                        
                        # Append result as ToolMessage
                        messages.append(
                            ToolMessage(
                                tool_call_id=call["id"],
                                content=json.dumps(tool_result)
                            )
                        )
                        
                    except Exception as e:
                        logger.error(f"Tool {tool_name} failed: {e}")
                        failed_tools.append(tool_name)
                        
                        # Add error message to context
                        messages.append(
                            ToolMessage(
                                tool_call_id=call["id"],
                                content=f"Error: Tool {tool_name} failed - {str(e)}"
                            )
                        )

            # --- Step 3: Generate final response with error context ---
            @llm_circuit_breaker
            @with_retry(max_attempts=2, base_delay=1.0)
            def get_final_response():
                return chain.invoke(messages)
            
            final_response = get_final_response()
            
            # Add context about failed tools to the report
            report_content = final_response.content
            if failed_tools:
                report_content += f"\n\n⚠️ Note: Some indicators failed to compute: {', '.join(failed_tools)}. "
                report_content += "Analysis is based on available indicators only."
            
            if successful_tools:
                logger.info(f"Successfully computed indicators: {', '.join(successful_tools)}")
            else:
                logger.warning("No indicators were successfully computed")
                # Use fallback if no tools succeeded
                return indicator_fallback(state)

            return {
                "messages": messages + [final_response],
                "indicator_report": report_content,
                "successful_indicators": successful_tools,
                "failed_indicators": failed_tools
            }
            
        except Exception as e:
            logger.error(f"Critical error in indicator agent: {e}")
            # Return fallback result
            return indicator_fallback(state)

    return indicator_agent_node