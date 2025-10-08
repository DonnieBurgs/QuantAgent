import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Chip,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow,
  TrendingUp,
  Assessment,
  Speed,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import { useAppStore } from '../../store/useStore';

const QuickAnalysis = () => {
  const { selectedAsset, selectedTimeframe, isAnalyzing } = useAppStore();
  const [quickResults, setQuickResults] = useState(null);

  const handleQuickAnalysis = () => {
    // Simulate quick analysis
    setTimeout(() => {
      setQuickResults({
        sentiment: 'Bullish',
        confidence: 78,
        keyLevels: {
          support: 42850,
          resistance: 44200,
        },
        signals: [
          { type: 'RSI', value: 'Oversold (28)', status: 'bullish' },
          { type: 'MACD', value: 'Bullish Crossover', status: 'bullish' },
          { type: 'Volume', value: 'Above Average', status: 'neutral' },
        ],
      });
    }, 2000);
  };

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
              Quick Analysis
            </Typography>
            <Button
              variant="outlined"
              startIcon={<PlayArrow />}
              onClick={handleQuickAnalysis}
              disabled={isAnalyzing}
              size="small"
            >
              Run Quick Scan
            </Button>
          </Box>

          {isAnalyzing && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Analyzing {selectedAsset} on {selectedTimeframe} timeframe...
              </Typography>
            </Box>
          )}

          {quickResults && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Alert
                severity={quickResults.sentiment === 'Bullish' ? 'success' : 'error'}
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Market Sentiment: {quickResults.sentiment}
                </Typography>
                <Typography variant="caption">
                  Confidence: {quickResults.confidence}%
                </Typography>
              </Alert>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Support
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                      ${quickResults.keyLevels.support.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Resistance
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                      ${quickResults.keyLevels.resistance.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Key Signals
              </Typography>
              
              {quickResults.signals.map((signal, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2">
                    {signal.type}: {signal.value}
                  </Typography>
                  <Chip
                    label={signal.status}
                    size="small"
                    color={
                      signal.status === 'bullish' ? 'success' :
                      signal.status === 'bearish' ? 'error' :
                      'default'
                    }
                  />
                </Box>
              ))}
            </motion.div>
          )}

          {!quickResults && !isAnalyzing && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Assessment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Run a quick analysis to get instant market insights
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QuickAnalysis;