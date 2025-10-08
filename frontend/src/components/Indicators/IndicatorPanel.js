import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  TextField,
  Button,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  TrendingUp,
  ShowChart,
  Timeline,
  Speed,
  Refresh,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import { useTradingStore } from '../../store/useStore';

const IndicatorPanel = ({ onIndicatorChange }) => {
  const { indicatorSettings, updateIndicatorSettings } = useTradingStore();
  const [activeIndicators, setActiveIndicators] = useState({
    rsi: true,
    macd: true,
    bb: false,
    sma: true,
  });

  const handleIndicatorToggle = (indicator) => {
    const newState = { ...activeIndicators, [indicator]: !activeIndicators[indicator] };
    setActiveIndicators(newState);
    if (onIndicatorChange) {
      onIndicatorChange(newState);
    }
  };

  const handleSettingChange = (indicator, setting, value) => {
    updateIndicatorSettings(indicator, { [setting]: value });
    if (onIndicatorChange) {
      onIndicatorChange(activeIndicators);
    }
  };

  const resetToDefaults = () => {
    const defaults = {
      rsi: { period: 14, overbought: 70, oversold: 30 },
      macd: { fast: 12, slow: 26, signal: 9 },
      bb: { period: 20, stdDev: 2 },
      sma: { periods: [20, 50, 200] },
    };
    
    Object.keys(defaults).forEach(indicator => {
      updateIndicatorSettings(indicator, defaults[indicator]);
    });
  };

  const indicators = [
    {
      key: 'rsi',
      name: 'RSI (Relative Strength Index)',
      icon: <Speed />,
      description: 'Momentum oscillator measuring speed and magnitude of price changes',
      color: 'primary',
    },
    {
      key: 'macd',
      name: 'MACD (Moving Average Convergence Divergence)',
      icon: <ShowChart />,
      description: 'Trend-following momentum indicator',
      color: 'secondary',
    },
    {
      key: 'bb',
      name: 'Bollinger Bands',
      icon: <Timeline />,
      description: 'Volatility bands around moving average',
      color: 'info',
    },
    {
      key: 'sma',
      name: 'Simple Moving Averages',
      icon: <TrendingUp />,
      description: 'Trend identification using moving averages',
      color: 'success',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Technical Indicators
            </Typography>
            <Button
              startIcon={<Refresh />}
              size="small"
              onClick={resetToDefaults}
              variant="outlined"
            >
              Reset
            </Button>
          </Box>

          {indicators.map((indicator, index) => (
            <motion.div
              key={indicator.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Accordion
                expanded={activeIndicators[indicator.key]}
                onChange={() => handleIndicatorToggle(indicator.key)}
                sx={{ mb: 1, '&:before': { display: 'none' } }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box sx={{ mr: 2, color: `${indicator.color}.main` }}>
                      {indicator.icon}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {indicator.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {indicator.description}
                      </Typography>
                    </Box>
                    <Chip
                      label={activeIndicators[indicator.key] ? 'ON' : 'OFF'}
                      color={activeIndicators[indicator.key] ? indicator.color : 'default'}
                      size="small"
                    />
                  </Box>
                </AccordionSummary>
                
                <AccordionDetails>
                  {indicator.key === 'rsi' && (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Period: {indicatorSettings.rsi.period}
                        </Typography>
                        <Slider
                          value={indicatorSettings.rsi.period}
                          onChange={(_, value) => handleSettingChange('rsi', 'period', value)}
                          min={5}
                          max={30}
                          step={1}
                          marks={[
                            { value: 5, label: '5' },
                            { value: 14, label: '14' },
                            { value: 30, label: '30' },
                          ]}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Overbought"
                          type="number"
                          size="small"
                          fullWidth
                          value={indicatorSettings.rsi.overbought}
                          onChange={(e) => handleSettingChange('rsi', 'overbought', Number(e.target.value))}
                          inputProps={{ min: 50, max: 90 }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Oversold"
                          type="number"
                          size="small"
                          fullWidth
                          value={indicatorSettings.rsi.oversold}
                          onChange={(e) => handleSettingChange('rsi', 'oversold', Number(e.target.value))}
                          inputProps={{ min: 10, max: 50 }}
                        />
                      </Grid>
                    </Grid>
                  )}

                  {indicator.key === 'macd' && (
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <TextField
                          label="Fast Period"
                          type="number"
                          size="small"
                          fullWidth
                          value={indicatorSettings.macd.fast}
                          onChange={(e) => handleSettingChange('macd', 'fast', Number(e.target.value))}
                          inputProps={{ min: 5, max: 20 }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Slow Period"
                          type="number"
                          size="small"
                          fullWidth
                          value={indicatorSettings.macd.slow}
                          onChange={(e) => handleSettingChange('macd', 'slow', Number(e.target.value))}
                          inputProps={{ min: 20, max: 50 }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Signal Period"
                          type="number"
                          size="small"
                          fullWidth
                          value={indicatorSettings.macd.signal}
                          onChange={(e) => handleSettingChange('macd', 'signal', Number(e.target.value))}
                          inputProps={{ min: 5, max: 15 }}
                        />
                      </Grid>
                    </Grid>
                  )}

                  {indicator.key === 'bb' && (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          label="Period"
                          type="number"
                          size="small"
                          fullWidth
                          value={indicatorSettings.bb.period}
                          onChange={(e) => handleSettingChange('bb', 'period', Number(e.target.value))}
                          inputProps={{ min: 10, max: 50 }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Standard Deviation"
                          type="number"
                          size="small"
                          fullWidth
                          value={indicatorSettings.bb.stdDev}
                          onChange={(e) => handleSettingChange('bb', 'stdDev', Number(e.target.value))}
                          inputProps={{ min: 1, max: 3, step: 0.1 }}
                        />
                      </Grid>
                    </Grid>
                  )}

                  {indicator.key === 'sma' && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Moving Average Periods
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {indicatorSettings.sma.periods.map((period, idx) => (
                          <Chip
                            key={idx}
                            label={`${period} SMA`}
                            variant="outlined"
                            size="small"
                            onDelete={() => {
                              const newPeriods = indicatorSettings.sma.periods.filter((_, i) => i !== idx);
                              handleSettingChange('sma', 'periods', newPeriods);
                            }}
                          />
                        ))}
                      </Box>
                      <TextField
                        label="Add Period"
                        type="number"
                        size="small"
                        sx={{ mt: 2 }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const value = Number(e.target.value);
                            if (value > 0 && !indicatorSettings.sma.periods.includes(value)) {
                              const newPeriods = [...indicatorSettings.sma.periods, value].sort((a, b) => a - b);
                              handleSettingChange('sma', 'periods', newPeriods);
                              e.target.value = '';
                            }
                          }
                        }}
                      />
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            </motion.div>
          ))}

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="caption" color="text.secondary">
            Adjust indicator parameters to customize your analysis. Changes apply in real-time.
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default IndicatorPanel;