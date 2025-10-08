import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Analytics,
  Speed,
  Timeline,
  Assessment,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import { useAppStore, useTradingStore } from '../store/useStore';
import TradingChart from '../components/Charts/TradingChart';
import MarketOverview from '../components/Dashboard/MarketOverview';
import QuickAnalysis from '../components/Dashboard/QuickAnalysis';
import RecentAnalyses from '../components/Dashboard/RecentAnalyses';

const Dashboard = () => {
  const { 
    selectedAsset, 
    selectedTimeframe, 
    setSelectedAsset, 
    setSelectedTimeframe,
    isAnalyzing,
    analysisResults 
  } = useAppStore();
  
  const { watchlist, marketData } = useTradingStore();
  const [quickStats, setQuickStats] = useState({
    totalAnalyses: 0,
    successRate: 0,
    avgResponseTime: 0,
    systemHealth: 'healthy'
  });

  useEffect(() => {
    // Simulate loading quick stats
    const timer = setTimeout(() => {
      setQuickStats({
        totalAnalyses: 1247,
        successRate: 94.2,
        avgResponseTime: 2.3,
        systemHealth: 'healthy'
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleAssetChange = (event) => {
    setSelectedAsset(event.target.value);
  };

  const handleTimeframeChange = (event) => {
    setSelectedTimeframe(event.target.value);
  };

  const statCards = [
    {
      title: 'Total Analyses',
      value: quickStats.totalAnalyses.toLocaleString(),
      icon: <Analytics sx={{ fontSize: 32, color: 'primary.main' }} />,
      color: 'primary',
      change: '+12.5%',
      changeType: 'positive'
    },
    {
      title: 'Success Rate',
      value: `${quickStats.successRate}%`,
      icon: <TrendingUp sx={{ fontSize: 32, color: 'success.main' }} />,
      color: 'success',
      change: '+2.1%',
      changeType: 'positive'
    },
    {
      title: 'Avg Response Time',
      value: `${quickStats.avgResponseTime}s`,
      icon: <Speed sx={{ fontSize: 32, color: 'info.main' }} />,
      color: 'info',
      change: '-0.3s',
      changeType: 'positive'
    },
    {
      title: 'System Health',
      value: quickStats.systemHealth,
      icon: <Assessment sx={{ fontSize: 32, color: 'success.main' }} />,
      color: 'success',
      change: 'Stable',
      changeType: 'neutral'
    }
  ];

  return (
    <Box>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Trading Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            AI-powered market analysis and trading insights
          </Typography>
        </Box>
      </motion.div>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {stat.icon}
                    <Box sx={{ ml: 2, flexGrow: 1 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.title}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip
                      label={stat.change}
                      size="small"
                      color={stat.changeType === 'positive' ? 'success' : 'default'}
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Chart and Analysis */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Market Analysis
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Asset</InputLabel>
                      <Select
                        value={selectedAsset}
                        label="Asset"
                        onChange={handleAssetChange}
                      >
                        {watchlist.map((asset) => (
                          <MenuItem key={asset} value={asset}>
                            {asset}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <InputLabel>Timeframe</InputLabel>
                      <Select
                        value={selectedTimeframe}
                        label="Timeframe"
                        onChange={handleTimeframeChange}
                      >
                        <MenuItem value="1m">1m</MenuItem>
                        <MenuItem value="5m">5m</MenuItem>
                        <MenuItem value="15m">15m</MenuItem>
                        <MenuItem value="1h">1h</MenuItem>
                        <MenuItem value="4h">4h</MenuItem>
                        <MenuItem value="1d">1d</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
                
                {isAnalyzing && (
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Analyzing market data...
                    </Typography>
                  </Box>
                )}
                
                <TradingChart 
                  symbol={selectedAsset}
                  timeframe={selectedTimeframe}
                  height={400}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Analysis */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <QuickAnalysis />
          </motion.div>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <MarketOverview />
              <RecentAnalyses />
            </Box>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;