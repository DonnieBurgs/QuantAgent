import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error,
  Memory,
  Speed,
  Storage,
  NetworkCheck,
  Psychology,
  Timeline,
  Assessment,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';

import { apiService, queryKeys } from '../services/api';
import MobileLayout from '../components/Mobile/MobileLayout';

const SystemStatus = () => {
  // System status query
  const { data: systemStatus, isLoading } = useQuery(
    queryKeys.systemStatus,
    apiService.getSystemStatus,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'warning': return <Warning sx={{ color: 'warning.main' }} />;
      case 'error': return <Error sx={{ color: 'error.main' }} />;
      default: return <CheckCircle sx={{ color: 'grey.400' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const components = [
    { name: 'Indicator Agent', icon: <Assessment />, key: 'indicator_agent' },
    { name: 'Pattern Agent', icon: <Timeline />, key: 'pattern_agent' },
    { name: 'Trend Agent', icon: <Timeline />, key: 'trend_agent' },
    { name: 'Decision Agent', icon: <Psychology />, key: 'decision_agent' },
    { name: 'Web Interface', icon: <NetworkCheck />, key: 'web_interface' },
  ];

  // Mock performance data if not available
  const performanceMetrics = systemStatus?.data?.performance || {
    cpu_usage: 45.2,
    memory_usage: 62.8,
    disk_usage: 34.1,
    api_calls_per_minute: 23,
    average_response_time: 1.2,
  };

  return (
    <MobileLayout>
      <Box>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              System Status
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor system health and performance metrics
            </Typography>
          </Box>
        </motion.div>

        {/* Overall Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Alert
            severity={getStatusColor(systemStatus?.data?.overall_health || 'healthy')}
            sx={{ mb: 3 }}
            icon={getStatusIcon(systemStatus?.data?.overall_health || 'healthy')}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              System Status: {systemStatus?.data?.overall_health || 'Healthy'}
            </Typography>
            <Typography variant="body2">
              All systems are operational and running smoothly
            </Typography>
          </Alert>
        </motion.div>

        <Grid container spacing={3}>
          {/* Performance Metrics */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Performance Metrics
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Memory sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="subtitle2">
                            CPU Usage: {performanceMetrics.cpu_usage}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={performanceMetrics.cpu_usage}
                          color={performanceMetrics.cpu_usage > 80 ? 'error' : performanceMetrics.cpu_usage > 60 ? 'warning' : 'success'}
                        />
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Memory sx={{ mr: 1, color: 'secondary.main' }} />
                          <Typography variant="subtitle2">
                            Memory Usage: {performanceMetrics.memory_usage}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={performanceMetrics.memory_usage}
                          color={performanceMetrics.memory_usage > 80 ? 'error' : performanceMetrics.memory_usage > 60 ? 'warning' : 'success'}
                        />
                      </Box>
                      
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Storage sx={{ mr: 1, color: 'info.main' }} />
                          <Typography variant="subtitle2">
                            Disk Usage: {performanceMetrics.disk_usage}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={performanceMetrics.disk_usage}
                          color={performanceMetrics.disk_usage > 80 ? 'error' : performanceMetrics.disk_usage > 60 ? 'warning' : 'success'}
                        />
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                          <Speed sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {performanceMetrics.average_response_time}s
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Avg Response Time
                          </Typography>
                        </Box>
                        
                        <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                          <NetworkCheck sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {performanceMetrics.api_calls_per_minute}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            API Calls/Min
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>

            {/* Error Statistics */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Error Statistics
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Total Errors
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {systemStatus?.data?.error_statistics?.total_errors || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Success Rate
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                        99.2%
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Last Error
                      </Typography>
                      <Typography variant="body2">
                        {systemStatus?.data?.error_statistics?.last_error ? 
                          new Date(systemStatus.data.error_statistics.last_error).toLocaleString() : 
                          'None'
                        }
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Uptime
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                        99.9%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Component Status */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Component Health
                  </Typography>
                  
                  <List disablePadding>
                    {components.map((component, index) => {
                      const status = systemStatus?.data?.component_health?.[component.key]?.status || 'healthy';
                      
                      return (
                        <motion.div
                          key={component.key}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <ListItem disablePadding sx={{ py: 1 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              {component.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={component.name}
                              secondary={
                                <Chip
                                  label={status}
                                  size="small"
                                  color={getStatusColor(status)}
                                  sx={{ fontSize: '0.7rem', height: 20, mt: 0.5 }}
                                />
                              }
                            />
                            {getStatusIcon(status)}
                          </ListItem>
                          {index < components.length - 1 && <Divider />}
                        </motion.div>
                      );
                    })}
                  </List>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Box>
    </MobileLayout>
  );
};

export default SystemStatus;