"""
Agent for making final trade decisions in high-frequency trading (HFT) context.
Combines indicator, pattern, and trend reports to issue a LONG or SHORT order.
Enhanced with robust error handling and fallback mechanisms.
"""
import logging
from error_handler import (
    with_error_handling, 
    with_retry, 
    error_handler, 
    CircuitBreaker
)


def create_final_trade_decider(llm):
    """
    Create a trade decision agent node with enhanced error handling.
    The agent uses LLM to synthesize indicator, pattern, and trend reports
    and outputs a final trade decision (LONG or SHORT) with justification and risk-reward ratio.
    """
    logger = logging.getLogger(__name__)
    
    # Register fallback strategies
    def decision_fallback(state):
        """Fallback strategy when decision making fails."""
        logger.warning("Using fallback strategy for trade decision")
        
        fallback_decision = {
            "decision": "HOLD",
            "risk_reward_ratio": "N/A",
            "forecast_horizon": "N/A",
            "justification": (
                "⚠️ FALLBACK MODE: Automated decision making is currently unavailable due to system issues. "
                "HOLD position recommended until system recovery. "
                "Manual analysis strongly advised before taking any trading action."
            )
        }
        
        return {
            "final_trade_decision": str(fallback_decision),
        }
    
    error_handler.register_fallback("decision_agent", decision_fallback)
    
    # Circuit breaker for LLM calls
    llm_circuit_breaker = CircuitBreaker(
        failure_threshold=3,
        recovery_timeout=60.0,
        expected_exception=Exception
    )
    
    @with_error_handling(
        component_name="decision_agent",
        log_errors=True,
        reraise_on_failure=False
    )
    def trade_decision_node(state) -> dict:
        try:
            # Validate input state and reports
            required_reports = ["indicator_report", "pattern_report", "trend_report"]
            missing_reports = []
            
            for report_key in required_reports:
                if report_key not in state or not state[report_key]:
                    missing_reports.append(report_key)
            
            if missing_reports:
                logger.warning(f"Missing reports: {missing_reports}")
                # Use fallback for missing reports
                for report_key in missing_reports:
                    if report_key not in state:
                        state[report_key] = f"⚠️ {report_key.replace('_', ' ').title()} unavailable due to system issues."
            
            indicator_report = state.get("indicator_report", "No indicator analysis available")
            pattern_report = state.get("pattern_report", "No pattern analysis available")
            trend_report = state.get("trend_report", "No trend analysis available")
            time_frame = state.get('time_frame', 'unknown')
            stock_name = state.get('stock_name', 'Unknown Asset')

            # Check if all reports are fallback messages
            fallback_indicators = ["unavailable", "fallback mode", "system issues"]
            all_reports_failed = all(
                any(indicator in report.lower() for indicator in fallback_indicators)
                for report in [indicator_report, pattern_report, trend_report]
            )
            
            if all_reports_failed:
                logger.error("All analysis reports failed, using decision fallback")
                return decision_fallback(state)

            # --- Enhanced system prompt for LLM ---
            prompt = f"""You are a high-frequency quantitative trading (HFT) analyst operating on the current {time_frame} K-line chart for {stock_name}. Your task is to issue an **immediate execution order**: **LONG** or **SHORT**. ⚠️ HOLD is prohibited due to HFT constraints.

                Your decision should forecast the market move over the **next N candlesticks**, where:
                - For example: TIME_FRAME = 15min, N = 1 → Predict the next 15 minutes.
                - TIME_FRAME = 4hour, N = 1 → Predict the next 4 hours.

                ⚠️ **IMPORTANT**: Some analysis components may be unavailable due to system issues. Base your decision on available information and clearly state any limitations.

                Base your decision on the combined strength, alignment, and timing of the following three reports:

                ---

                ### 1. Technical Indicator Report:
                - Evaluate momentum (e.g., MACD, ROC) and oscillators (e.g., RSI, Stochastic, Williams %R).
                - Give **higher weight to strong directional signals** such as MACD crossovers, RSI divergence, extreme overbought/oversold levels.
                - **Ignore or down-weight neutral or mixed signals** unless they align across multiple indicators.
                - If indicators are unavailable, note this limitation in your analysis.

                ---

                ### 2. Pattern Report:
                - Only act on bullish or bearish patterns if:
                - The pattern is **clearly recognizable and mostly complete**, and
                - A **breakout or breakdown is already underway** or highly probable based on price and momentum (e.g., strong wick, volume spike, engulfing candle).
                - **Do NOT act** on early-stage or speculative patterns. Do not treat consolidating setups as tradable unless there is **breakout confirmation** from other reports.
                - If pattern analysis is unavailable, rely more heavily on other available reports.

                ---

                ### 3. Trend Report:
                - Analyze how price interacts with support and resistance:
                - An **upward sloping support line** suggests buying interest.
                - A **downward sloping resistance line** suggests selling pressure.
                - If price is compressing between trendlines:
                - Predict breakout **only when confluence exists with strong candles or indicator confirmation**.
                - **Do NOT assume breakout direction** from geometry alone.
                - If trend analysis is unavailable, be more conservative in your decision.

                ---

                ### ✅ Decision Strategy

                1. Only act on **confirmed** signals — avoid emerging, speculative, or conflicting signals.
                2. Prioritize decisions where **available reports** align in the same direction.
                3. Give more weight to:
                - Recent strong momentum (e.g., MACD crossover, RSI breakout)
                - Decisive price action (e.g., breakout candle, rejection wicks, support bounce)
                4. If reports disagree or are limited:
                - Choose the direction with **stronger and more recent confirmation**
                - Prefer **momentum-backed signals** over weak oscillator hints.
                - **Increase caution** when key analysis components are missing.
                5. ⚖️ If the market is in consolidation, reports are mixed, or analysis is limited:
                - Default to the **most defensible** position based on available data.
                - **Clearly state limitations** in your justification.
                6. Suggest a reasonable **risk-reward ratio** between **1.2 and 1.8**, based on current volatility and trend strength.
                7. **If analysis is severely limited, consider a more conservative approach**.

                ---
                ### 🧠 Output Format in json(for system parsing):

                ```
                {{
                "forecast_horizon": "Predicting next N candlesticks ({time_frame} timeframe)",
                "decision": "<LONG or SHORT>",
                "justification": "<Concise reasoning based on available reports, noting any limitations>",
                "risk_reward_ratio": "<float between 1.2 and 1.8>",
                "confidence_level": "<HIGH/MEDIUM/LOW based on data availability and signal strength>",
                "limitations": "<Any noted limitations in the analysis>"
                }}
                ```

                --------
                **Technical Indicator Report**  
                {indicator_report}

                **Pattern Report**  
                {pattern_report}

                **Trend Report**  
                {trend_report}

            """

            # --- Enhanced LLM call for decision with circuit breaker ---
            @llm_circuit_breaker
            @with_retry(max_attempts=3, base_delay=2.0)
            def make_decision():
                return llm.invoke(prompt)

            try:
                response = make_decision()
                logger.info("Successfully generated trading decision")
                
                return {
                    "final_trade_decision": response.content,
                    "messages": [response],
                    "decision_prompt": prompt,
                    "reports_used": {
                        "indicator_available": "unavailable" not in indicator_report.lower(),
                        "pattern_available": "unavailable" not in pattern_report.lower(),
                        "trend_available": "unavailable" not in trend_report.lower()
                    }
                }
                
            except Exception as e:
                logger.error(f"Decision generation failed: {e}")
                return decision_fallback(state)
            
        except Exception as e:
            logger.error(f"Critical error in decision agent: {e}")
            return decision_fallback(state)

    return trade_decision_node
