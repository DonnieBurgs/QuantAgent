"""
System monitoring and health check utilities for QuantAgent.
Provides real-time monitoring of system components and performance metrics.
"""

import time
import psutil
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from threading import Thread, Event
import json
from pathlib import Path

@dataclass
class PerformanceMetrics:
    """System performance metrics."""
    timestamp: datetime
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    api_calls_per_minute: int
    average_response_time: float
    active_connections: int

@dataclass
class ComponentHealth:
    """Health status of a system component."""
    name: str
    status: str  # healthy, warning, error, offline
    last_check: datetime
    error_count: int
    success_rate: float
    average_response_time: float
    details: Dict[str, Any]

class SystemMonitor:
    """Monitors system health and performance metrics."""
    
    def __init__(self, check_interval: int = 60):
        self.check_interval = check_interval
        self.is_running = False
        self.stop_event = Event()
        self.logger = logging.getLogger(__name__)
        
        # Metrics storage
        self.performance_history: List[PerformanceMetrics] = []
        self.component_health: Dict[str, ComponentHealth] = {}
        self.api_call_times: List[float] = []
        self.api_call_timestamps: List[datetime] = []
        
        # Thresholds
        self.cpu_threshold = 80.0
        self.memory_threshold = 85.0
        self.disk_threshold = 90.0
        self.error_rate_threshold = 0.1  # 10%
        
        # Initialize component health
        self._initialize_components()
    
    def _initialize_components(self):
        """Initialize component health tracking."""
        components = [
            "indicator_agent",
            "pattern_agent", 
            "trend_agent",
            "decision_agent",
            "web_interface",
            "data_fetcher",
            "llm_service"
        ]
        
        for component in components:
            self.component_health[component] = ComponentHealth(
                name=component,
                status="unknown",
                last_check=datetime.now(),
                error_count=0,
                success_rate=1.0,
                average_response_time=0.0,
                details={}
            )
    
    def start_monitoring(self):
        """Start the monitoring thread."""
        if self.is_running:
            return
        
        self.is_running = True
        self.stop_event.clear()
        
        monitor_thread = Thread(target=self._monitoring_loop, daemon=True)
        monitor_thread.start()
        
        self.logger.info("System monitoring started")
    
    def stop_monitoring(self):
        """Stop the monitoring thread."""
        self.is_running = False
        self.stop_event.set()
        self.logger.info("System monitoring stopped")
    
    def _monitoring_loop(self):
        """Main monitoring loop."""
        while self.is_running and not self.stop_event.wait(self.check_interval):
            try:
                self._collect_performance_metrics()
                self._check_component_health()
                self._cleanup_old_data()
                
            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {e}")
    
    def _collect_performance_metrics(self):
        """Collect system performance metrics."""
        try:
            # CPU and memory usage
            cpu_usage = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # API metrics
            now = datetime.now()
            recent_calls = [
                ts for ts in self.api_call_timestamps 
                if now - ts < timedelta(minutes=1)
            ]
            
            recent_times = self.api_call_times[-len(recent_calls):] if recent_calls else []
            avg_response_time = sum(recent_times) / len(recent_times) if recent_times else 0.0
            
            metrics = PerformanceMetrics(
                timestamp=now,
                cpu_usage=cpu_usage,
                memory_usage=memory.percent,
                disk_usage=disk.percent,
                api_calls_per_minute=len(recent_calls),
                average_response_time=avg_response_time,
                active_connections=len(psutil.net_connections())
            )
            
            self.performance_history.append(metrics)
            
            # Log warnings for high resource usage
            if cpu_usage > self.cpu_threshold:
                self.logger.warning(f"High CPU usage: {cpu_usage:.1f}%")
            
            if memory.percent > self.memory_threshold:
                self.logger.warning(f"High memory usage: {memory.percent:.1f}%")
            
            if disk.percent > self.disk_threshold:
                self.logger.warning(f"High disk usage: {disk.percent:.1f}%")
                
        except Exception as e:
            self.logger.error(f"Error collecting performance metrics: {e}")
    
    def _check_component_health(self):
        """Check health of system components."""
        from error_handler import error_handler
        
        # Get error statistics
        error_stats = error_handler.error_history
        
        # Analyze errors by component
        component_errors = {}
        for error_info in error_stats[-100:]:  # Last 100 errors
            context = error_info.context or {}
            component = context.get('component', 'unknown')
            
            if component not in component_errors:
                component_errors[component] = []
            component_errors[component].append(error_info)
        
        # Update component health
        for component_name, health in self.component_health.items():
            errors = component_errors.get(component_name, [])
            recent_errors = [
                e for e in errors 
                if datetime.now() - e.timestamp < timedelta(hours=1)
            ]
            
            health.last_check = datetime.now()
            health.error_count = len(recent_errors)
            
            # Calculate success rate (simplified)
            total_operations = max(10, len(recent_errors) * 10)  # Estimate
            health.success_rate = max(0.0, 1.0 - len(recent_errors) / total_operations)
            
            # Determine status
            if len(recent_errors) == 0:
                health.status = "healthy"
            elif health.success_rate > 0.9:
                health.status = "warning"
            else:
                health.status = "error"
            
            health.details = {
                "recent_errors": len(recent_errors),
                "last_error": recent_errors[-1].message if recent_errors else None
            }
    
    def _cleanup_old_data(self):
        """Clean up old monitoring data."""
        cutoff_time = datetime.now() - timedelta(hours=24)
        
        # Clean performance history
        self.performance_history = [
            m for m in self.performance_history 
            if m.timestamp > cutoff_time
        ]
        
        # Clean API call data
        self.api_call_timestamps = [
            ts for ts in self.api_call_timestamps 
            if ts > cutoff_time
        ]
        
        # Keep corresponding response times
        if len(self.api_call_times) > len(self.api_call_timestamps):
            excess = len(self.api_call_times) - len(self.api_call_timestamps)
            self.api_call_times = self.api_call_times[excess:]
    
    def record_api_call(self, response_time: float):
        """Record an API call for monitoring."""
        self.api_call_timestamps.append(datetime.now())
        self.api_call_times.append(response_time)
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get current system status."""
        latest_metrics = self.performance_history[-1] if self.performance_history else None
        
        # Determine overall health
        component_statuses = [h.status for h in self.component_health.values()]
        if "error" in component_statuses:
            overall_health = "error"
        elif "warning" in component_statuses:
            overall_health = "warning"
        else:
            overall_health = "healthy"
        
        return {
            "overall_health": overall_health,
            "timestamp": datetime.now().isoformat(),
            "performance": asdict(latest_metrics) if latest_metrics else None,
            "components": {
                name: asdict(health) 
                for name, health in self.component_health.items()
            },
            "uptime": self._get_uptime(),
            "alerts": self._get_active_alerts()
        }
    
    def _get_uptime(self) -> str:
        """Get system uptime."""
        try:
            boot_time = datetime.fromtimestamp(psutil.boot_time())
            uptime = datetime.now() - boot_time
            
            days = uptime.days
            hours, remainder = divmod(uptime.seconds, 3600)
            minutes, _ = divmod(remainder, 60)
            
            return f"{days}d {hours}h {minutes}m"
        except:
            return "unknown"
    
    def _get_active_alerts(self) -> List[Dict[str, Any]]:
        """Get active system alerts."""
        alerts = []
        
        if self.performance_history:
            latest = self.performance_history[-1]
            
            if latest.cpu_usage > self.cpu_threshold:
                alerts.append({
                    "type": "performance",
                    "severity": "warning",
                    "message": f"High CPU usage: {latest.cpu_usage:.1f}%",
                    "timestamp": latest.timestamp.isoformat()
                })
            
            if latest.memory_usage > self.memory_threshold:
                alerts.append({
                    "type": "performance", 
                    "severity": "warning",
                    "message": f"High memory usage: {latest.memory_usage:.1f}%",
                    "timestamp": latest.timestamp.isoformat()
                })
        
        # Component alerts
        for name, health in self.component_health.items():
            if health.status == "error":
                alerts.append({
                    "type": "component",
                    "severity": "error",
                    "message": f"Component {name} is in error state",
                    "timestamp": health.last_check.isoformat()
                })
            elif health.status == "warning":
                alerts.append({
                    "type": "component",
                    "severity": "warning", 
                    "message": f"Component {name} has issues",
                    "timestamp": health.last_check.isoformat()
                })
        
        return alerts
    
    def export_metrics(self, filepath: str):
        """Export metrics to JSON file."""
        try:
            data = {
                "export_time": datetime.now().isoformat(),
                "performance_history": [asdict(m) for m in self.performance_history],
                "component_health": {
                    name: asdict(health) 
                    for name, health in self.component_health.items()
                },
                "system_status": self.get_system_status()
            }
            
            # Convert datetime objects to strings for JSON serialization
            def datetime_converter(obj):
                if isinstance(obj, datetime):
                    return obj.isoformat()
                raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
            
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2, default=datetime_converter)
            
            self.logger.info(f"Metrics exported to {filepath}")
            
        except Exception as e:
            self.logger.error(f"Error exporting metrics: {e}")

# Global monitor instance
system_monitor = SystemMonitor()

def start_system_monitoring():
    """Start system monitoring."""
    system_monitor.start_monitoring()

def stop_system_monitoring():
    """Stop system monitoring."""
    system_monitor.stop_monitoring()

def get_system_health() -> Dict[str, Any]:
    """Get current system health status."""
    return system_monitor.get_system_status()

def record_api_call_time(response_time: float):
    """Record an API call response time."""
    system_monitor.record_api_call(response_time)