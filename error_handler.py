"""
Unified error handling and retry mechanism for QuantAgent system.
Provides robust error handling, retry strategies, and fallback mechanisms.
"""

import time
import logging
import functools
import traceback
from typing import Any, Callable, Dict, List, Optional, Union, Type
from enum import Enum
from dataclasses import dataclass
from datetime import datetime
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('quantagent.log'),
        logging.StreamHandler()
    ]
)

class ErrorType(Enum):
    """Classification of different error types for appropriate handling."""
    API_ERROR = "api_error"
    NETWORK_ERROR = "network_error"
    DATA_ERROR = "data_error"
    COMPUTATION_ERROR = "computation_error"
    VALIDATION_ERROR = "validation_error"
    TIMEOUT_ERROR = "timeout_error"
    RATE_LIMIT_ERROR = "rate_limit_error"
    AUTHENTICATION_ERROR = "authentication_error"
    UNKNOWN_ERROR = "unknown_error"

@dataclass
class ErrorInfo:
    """Structured error information."""
    error_type: ErrorType
    message: str
    original_exception: Optional[Exception] = None
    timestamp: datetime = None
    context: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()
        if self.context is None:
            self.context = {}

class RetryStrategy:
    """Configurable retry strategy."""
    
    def __init__(
        self,
        max_attempts: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True
    ):
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter
    
    def get_delay(self, attempt: int) -> float:
        """Calculate delay for the given attempt number."""
        if attempt <= 0:
            return 0
        
        delay = self.base_delay * (self.exponential_base ** (attempt - 1))
        delay = min(delay, self.max_delay)
        
        if self.jitter:
            import random
            delay *= (0.5 + random.random() * 0.5)  # Add 0-50% jitter
        
        return delay

class ErrorClassifier:
    """Classifies exceptions into error types for appropriate handling."""
    
    @staticmethod
    def classify_error(exception: Exception) -> ErrorType:
        """Classify an exception into an ErrorType."""
        error_msg = str(exception).lower()
        exception_type = type(exception).__name__.lower()
        
        # Rate limit errors
        if "rate limit" in error_msg or "429" in error_msg or "ratelimiterror" in exception_type:
            return ErrorType.RATE_LIMIT_ERROR
        
        # Authentication errors
        if any(keyword in error_msg for keyword in ["authentication", "invalid api key", "401", "unauthorized"]):
            return ErrorType.AUTHENTICATION_ERROR
        
        # Network errors
        if any(keyword in error_msg for keyword in ["network", "connection", "timeout", "dns", "socket"]):
            return ErrorType.NETWORK_ERROR
        
        # API errors
        if any(keyword in error_msg for keyword in ["api", "service", "server", "503", "502", "500"]):
            return ErrorType.API_ERROR
        
        # Data validation errors
        if any(keyword in exception_type for keyword in ["valueerror", "typeerror", "keyerror"]):
            return ErrorType.VALIDATION_ERROR
        
        # Computation errors
        if any(keyword in exception_type for keyword in ["zerodivisionerror", "overflowerror", "arithmeticerror"]):
            return ErrorType.COMPUTATION_ERROR
        
        # Timeout errors
        if "timeout" in error_msg or "timeouterror" in exception_type:
            return ErrorType.TIMEOUT_ERROR
        
        return ErrorType.UNKNOWN_ERROR

class FallbackManager:
    """Manages fallback strategies for different components."""
    
    def __init__(self):
        self.fallback_strategies = {}
        self.logger = logging.getLogger(__name__)
    
    def register_fallback(self, component: str, fallback_func: Callable):
        """Register a fallback function for a component."""
        self.fallback_strategies[component] = fallback_func
        self.logger.info(f"Registered fallback strategy for {component}")
    
    def execute_fallback(self, component: str, *args, **kwargs) -> Any:
        """Execute fallback strategy for a component."""
        if component in self.fallback_strategies:
            self.logger.warning(f"Executing fallback strategy for {component}")
            try:
                return self.fallback_strategies[component](*args, **kwargs)
            except Exception as e:
                self.logger.error(f"Fallback strategy failed for {component}: {e}")
                return None
        else:
            self.logger.error(f"No fallback strategy registered for {component}")
            return None

class QuantAgentErrorHandler:
    """Main error handler for the QuantAgent system."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.error_history = []
        self.fallback_manager = FallbackManager()
        self.retry_strategies = {
            ErrorType.RATE_LIMIT_ERROR: RetryStrategy(max_attempts=5, base_delay=2.0, max_delay=120.0),
            ErrorType.NETWORK_ERROR: RetryStrategy(max_attempts=3, base_delay=1.0, max_delay=30.0),
            ErrorType.API_ERROR: RetryStrategy(max_attempts=3, base_delay=1.0, max_delay=30.0),
            ErrorType.TIMEOUT_ERROR: RetryStrategy(max_attempts=2, base_delay=2.0, max_delay=60.0),
            ErrorType.COMPUTATION_ERROR: RetryStrategy(max_attempts=1, base_delay=0.1, max_delay=1.0),
            ErrorType.UNKNOWN_ERROR: RetryStrategy(max_attempts=2, base_delay=1.0, max_delay=10.0),
        }
    
    def handle_error(self, exception: Exception, context: Dict[str, Any] = None) -> ErrorInfo:
        """Handle an exception and return structured error information."""
        error_type = ErrorClassifier.classify_error(exception)
        error_info = ErrorInfo(
            error_type=error_type,
            message=str(exception),
            original_exception=exception,
            context=context or {}
        )
        
        self.error_history.append(error_info)
        self.logger.error(f"Error handled: {error_type.value} - {error_info.message}")
        
        return error_info
    
    def should_retry(self, error_info: ErrorInfo, attempt: int) -> bool:
        """Determine if an operation should be retried based on error type and attempt count."""
        if error_info.error_type == ErrorType.AUTHENTICATION_ERROR:
            return False  # Don't retry auth errors
        
        if error_info.error_type == ErrorType.VALIDATION_ERROR:
            return False  # Don't retry validation errors
        
        strategy = self.retry_strategies.get(error_info.error_type)
        if strategy is None:
            return False
        
        return attempt < strategy.max_attempts
    
    def get_retry_delay(self, error_info: ErrorInfo, attempt: int) -> float:
        """Get the delay before retrying based on error type and attempt count."""
        strategy = self.retry_strategies.get(error_info.error_type)
        if strategy is None:
            return 0
        
        return strategy.get_delay(attempt)
    
    def register_fallback(self, component: str, fallback_func: Callable):
        """Register a fallback strategy for a component."""
        self.fallback_manager.register_fallback(component, fallback_func)
    
    def execute_fallback(self, component: str, *args, **kwargs) -> Any:
        """Execute fallback strategy for a component."""
        return self.fallback_manager.execute_fallback(component, *args, **kwargs)

# Global error handler instance
error_handler = QuantAgentErrorHandler()

def with_error_handling(
    component_name: str = None,
    fallback_result: Any = None,
    log_errors: bool = True,
    reraise_on_failure: bool = False
):
    """Decorator for adding error handling to functions."""
    
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            context = {
                'function': func.__name__,
                'component': component_name or func.__name__,
                'args_count': len(args),
                'kwargs_keys': list(kwargs.keys())
            }
            
            attempt = 0
            while True:
                attempt += 1
                try:
                    return func(*args, **kwargs)
                
                except Exception as e:
                    error_info = error_handler.handle_error(e, context)
                    
                    if log_errors:
                        error_handler.logger.error(
                            f"Error in {func.__name__} (attempt {attempt}): {error_info.message}"
                        )
                    
                    # Check if we should retry
                    if error_handler.should_retry(error_info, attempt):
                        delay = error_handler.get_retry_delay(error_info, attempt)
                        if delay > 0:
                            error_handler.logger.info(f"Retrying in {delay:.2f} seconds...")
                            time.sleep(delay)
                        continue
                    
                    # Try fallback if available
                    if component_name:
                        fallback_result_actual = error_handler.execute_fallback(
                            component_name, *args, **kwargs
                        )
                        if fallback_result_actual is not None:
                            return fallback_result_actual
                    
                    # Return fallback result or reraise
                    if reraise_on_failure:
                        raise
                    else:
                        return fallback_result
        
        return wrapper
    return decorator

def with_retry(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    retry_on: Union[Type[Exception], tuple] = Exception
):
    """Decorator for adding retry logic to functions."""
    
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            strategy = RetryStrategy(max_attempts, base_delay, max_delay, exponential_base)
            
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                
                except retry_on as e:
                    if attempt == max_attempts:
                        raise
                    
                    delay = strategy.get_delay(attempt)
                    logging.getLogger(__name__).warning(
                        f"Attempt {attempt} failed for {func.__name__}: {e}. "
                        f"Retrying in {delay:.2f} seconds..."
                    )
                    time.sleep(delay)
        
        return wrapper
    return decorator

class CircuitBreaker:
    """Circuit breaker pattern implementation for preventing cascading failures."""
    
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
        expected_exception: Type[Exception] = Exception
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN
        self.logger = logging.getLogger(__name__)
    
    def __call__(self, func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            if self.state == 'OPEN':
                if self._should_attempt_reset():
                    self.state = 'HALF_OPEN'
                    self.logger.info(f"Circuit breaker for {func.__name__} is now HALF_OPEN")
                else:
                    raise Exception(f"Circuit breaker is OPEN for {func.__name__}")
            
            try:
                result = func(*args, **kwargs)
                self._on_success()
                return result
            
            except self.expected_exception as e:
                self._on_failure()
                raise
        
        return wrapper
    
    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset."""
        if self.last_failure_time is None:
            return True
        
        return time.time() - self.last_failure_time >= self.recovery_timeout
    
    def _on_success(self):
        """Handle successful execution."""
        if self.state == 'HALF_OPEN':
            self.state = 'CLOSED'
            self.failure_count = 0
            self.logger.info("Circuit breaker reset to CLOSED state")
    
    def _on_failure(self):
        """Handle failed execution."""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = 'OPEN'
            self.logger.warning(f"Circuit breaker opened after {self.failure_count} failures")

def create_safe_fallback_data():
    """Create safe fallback data for analysis when real data is unavailable."""
    import pandas as pd
    import numpy as np
    
    # Generate synthetic OHLCV data
    dates = pd.date_range(start='2024-01-01', periods=50, freq='1H')
    np.random.seed(42)  # For reproducible fallback data
    
    base_price = 100.0
    prices = []
    
    for i in range(50):
        # Simple random walk with some trend
        change = np.random.normal(0, 0.02)  # 2% volatility
        base_price *= (1 + change)
        
        # Generate OHLC from base price
        high = base_price * (1 + abs(np.random.normal(0, 0.01)))
        low = base_price * (1 - abs(np.random.normal(0, 0.01)))
        open_price = base_price + np.random.normal(0, 0.005) * base_price
        close_price = base_price
        
        prices.append({
            'Datetime': dates[i].strftime('%Y-%m-%d %H:%M:%S'),
            'Open': round(open_price, 2),
            'High': round(high, 2),
            'Low': round(low, 2),
            'Close': round(close_price, 2)
        })
    
    return {
        'Datetime': [p['Datetime'] for p in prices],
        'Open': [p['Open'] for p in prices],
        'High': [p['High'] for p in prices],
        'Low': [p['Low'] for p in prices],
        'Close': [p['Close'] for p in prices]
    }

def get_error_statistics() -> Dict[str, Any]:
    """Get statistics about errors that have occurred."""
    if not error_handler.error_history:
        return {"total_errors": 0, "error_types": {}}
    
    error_counts = {}
    for error_info in error_handler.error_history:
        error_type = error_info.error_type.value
        error_counts[error_type] = error_counts.get(error_type, 0) + 1
    
    return {
        "total_errors": len(error_handler.error_history),
        "error_types": error_counts,
        "last_error": error_handler.error_history[-1].timestamp.isoformat() if error_handler.error_history else None
    }