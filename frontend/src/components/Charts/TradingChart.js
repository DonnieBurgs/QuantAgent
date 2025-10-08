import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { Box, Paper, IconButton, Tooltip, Menu, MenuItem } from '@mui/material';
import { 
  Fullscreen, 
  Settings, 
  TrendingUp, 
  ShowChart,
  BarChart,
  Timeline 
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import { useAppStore } from '../../store/useStore';

const TradingChart = ({ symbol, timeframe, height = 400 }) => {
  const chartContainerRef = useRef();
  const chart = useRef();
  const candlestickSeries = useRef();
  const volumeSeries = useRef();
  
  const { isDarkMode, chartPreferences, updateChartPreferences } = useAppStore();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sample data - in real app, this would come from API
  const generateSampleData = () => {
    const data = [];
    const volumeData = [];
    let basePrice = 50000;
    
    for (let i = 0; i < 100; i++) {
      const time = Math.floor(Date.now() / 1000) - (100 - i) * 3600;
      const change = (Math.random() - 0.5) * 1000;
      basePrice += change;
      
      const open = basePrice;
      const close = basePrice + (Math.random() - 0.5) * 500;
      const high = Math.max(open, close) + Math.random() * 200;
      const low = Math.min(open, close) - Math.random() * 200;
      
      data.push({
        time,
        open,
        high,
        low,
        close,
      });
      
      volumeData.push({
        time,
        value: Math.random() * 1000000,
        color: close > open ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)',
      });
    }
    
    return { priceData: data, volumeData };
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Chart configuration
    const chartOptions = {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: isDarkMode ? '#ffffff' : '#333333',
      },
      grid: {
        vertLines: { color: isDarkMode ? '#2B2B43' : '#E1E1E1' },
        horzLines: { color: isDarkMode ? '#2B2B43' : '#E1E1E1' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: isDarkMode ? '#2B2B43' : '#E1E1E1',
      },
      timeScale: {
        borderColor: isDarkMode ? '#2B2B43' : '#E1E1E1',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    };

    // Create chart
    chart.current = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height: height,
    });

    // Add candlestick series
    candlestickSeries.current = chart.current.addCandlestickSeries({
      upColor: '#4CAF50',
      downColor: '#F44336',
      borderDownColor: '#F44336',
      borderUpColor: '#4CAF50',
      wickDownColor: '#F44336',
      wickUpColor: '#4CAF50',
    });

    // Add volume series if enabled
    if (chartPreferences.showVolume) {
      volumeSeries.current = chart.current.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      });
      
      chart.current.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
    }

    // Load sample data
    const { priceData, volumeData } = generateSampleData();
    candlestickSeries.current.setData(priceData);
    
    if (volumeSeries.current) {
      volumeSeries.current.setData(volumeData);
    }

    // Handle resize
    const handleResize = () => {
      if (chart.current && chartContainerRef.current) {
        chart.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart.current) {
        chart.current.remove();
      }
    };
  }, [isDarkMode, height, chartPreferences.showVolume]);

  const handleSettingsClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setAnchorEl(null);
  };

  const toggleVolume = () => {
    updateChartPreferences({ showVolume: !chartPreferences.showVolume });
    handleSettingsClose();
  };

  const changeChartType = (type) => {
    updateChartPreferences({ chartType: type });
    handleSettingsClose();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Paper 
        elevation={0}
        sx={{ 
          position: 'relative',
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Chart Controls */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
            display: 'flex',
            gap: 1,
          }}
        >
          <Tooltip title="Chart Settings">
            <IconButton
              size="small"
              onClick={handleSettingsClick}
              sx={{
                backgroundColor: 'background.paper',
                boxShadow: 1,
                '&:hover': { backgroundColor: 'action.hover' },
              }}
            >
              <Settings fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Fullscreen">
            <IconButton
              size="small"
              onClick={toggleFullscreen}
              sx={{
                backgroundColor: 'background.paper',
                boxShadow: 1,
                '&:hover': { backgroundColor: 'action.hover' },
              }}
            >
              <Fullscreen fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Chart Container */}
        <Box
          ref={chartContainerRef}
          sx={{
            width: '100%',
            height: height,
            cursor: 'crosshair',
          }}
        />

        {/* Settings Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleSettingsClose}
        >
          <MenuItem onClick={toggleVolume}>
            <BarChart sx={{ mr: 1 }} />
            {chartPreferences.showVolume ? 'Hide Volume' : 'Show Volume'}
          </MenuItem>
          <MenuItem onClick={() => changeChartType('candlestick')}>
            <TrendingUp sx={{ mr: 1 }} />
            Candlestick
          </MenuItem>
          <MenuItem onClick={() => changeChartType('line')}>
            <ShowChart sx={{ mr: 1 }} />
            Line Chart
          </MenuItem>
          <MenuItem onClick={() => changeChartType('area')}>
            <Timeline sx={{ mr: 1 }} />
            Area Chart
          </MenuItem>
        </Menu>
      </Paper>
    </motion.div>
  );
};

export default TradingChart;