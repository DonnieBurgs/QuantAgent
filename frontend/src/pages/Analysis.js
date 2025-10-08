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
  TextField,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Download,
  Share,
  ExpandMore,
  TrendingUp,
  Assessment,
  Timeline,
  Psychology,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from 'react-query';
import toast from 'react-hot-toast';

import { useAppStore, useTradingStore } from '../store/useStore';
import { apiService, queryKeys } from '../services/api';
import TradingChart from '../components/Charts/TradingChart';
import IndicatorPanel from '../components/Indicators/IndicatorPanel';
import MobileLayout from '../components/Mobile/MobileLayout';

const Analysis = () => {
  const {
    selectedAsset,
    selectedTimeframe,
    setSelectedAsset,
    setSelectedTimeframe,
    isAnalyzing,
    setAnalyzing,
    analysisResults,
    setAnalysisResults,
    startDate,
    endDate,
    setDateRange,
  } = useAppStore();

  const { watchlist, addAnalysis } = useTradingStore();
  const [activeStep, setActiveStep] = useState(0);
  const [useCurrentTime, setUseCurrentTime] = useState(true);

  // Fetch assets
  const { data: assetsData } = useQuery(queryKeys.assets, apiService.getAssets);

  // Analysis mutation
  const analysisMutation = useMutation(apiService.runAnalysis, {
    onMutate: () => {
      setAnalyzing(true);
      setActiveStep(1);
    },
    onSuccess: (response) => {
      setAnalysisResults(response.data);
      addAnalysis({
        id: Date.now(),
        asset: selectedAsset,
        timeframe: selectedTimeframe,
        timestamp: new Date(),
        results: response.data,
      });
      setActiveStep(2);
      toast.success('Analysis completed successfully!');
    },
    onError: (error) => {
      toast.error('Analysis failed. Please try again.');
      setActiveStep(0);
    },
    onSettled: () => {
      setAnalyzing(false);
    },
  });

  const handleRunAnalysis = () => {
    const analysisData = {
      data_source: 'live',
      asset: selectedAsset,
      timeframe: selectedTimeframe,
      start_date: startDate ? dayjs(startDate).format('YYYY-MM-DD') : dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
      start_time: startDate ? dayjs(startDate).format('HH:mm') : '00:00',
      end_date: endDate ? dayjs(endDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      end_time: useCurrentTime ? dayjs().format('HH:mm') : (endDate ? dayjs(endDate).format('HH:mm') : '23:59'),
      use_current_time: useCurrentTime,
    };

    analysisMutation.mutate(analysisData);
  };

  const handleStopAnalysis = () => {
    // In a real app, you would cancel the API request here
    setAnalyzing(false);
    setActiveStep(0);
    toast.info('Analysis stopped');
  };

  const steps = [
    {
      label: 'Configure Analysis',
      description: 'Set up your analysis parameters',
    },
    {
      label: 'Running Analysis',
      description: 'AI agents are analyzing the market data',
    },
    {
      label: 'Results Ready',
      description: 'Analysis complete, review your results',
    },
  ];

  const analysisSteps = [
    { name: 'Indicator Agent', status: 'completed', description: 'Technical indicators calculated' },
    { name: 'Pattern Agent', status: 'completed', description: 'Chart patterns identified' },
    { name: 'Trend Agent', status: 'running', description: 'Trend analysis in progress' },
    { name: 'Decision Agent', status: 'pending', description: 'Waiting for trend analysis' },
  ];

  return (
    <MobileLayout>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Market Analysis
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Run comprehensive AI-powered trading analysis
              </Typography>
            </Box>
          </motion.div>

          <Grid container spacing={3}>
            {/* Configuration Panel */}
            <Grid item xs={12} lg={4}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                      Analysis Configuration
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Asset</InputLabel>
                        <Select
                          value={selectedAsset}
                          label="Asset"
                          onChange={(e) => setSelectedAsset(e.target.value)}
                        >
                          {watchlist.map((asset) => (
                            <MenuItem key={asset} value={asset}>
                              {asset}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Timeframe</InputLabel>
                        <Select
                          value={selectedTimeframe}
                          label="Timeframe"
                          onChange={(e) => setSelectedTimeframe(e.target.value)}
                        >
                          <MenuItem value="1m">1 Minute</MenuItem>
                          <MenuItem value="5m">5 Minutes</MenuItem>
                          <MenuItem value="15m">15 Minutes</MenuItem>
                          <MenuItem value="1h">1 Hour</MenuItem>
                          <MenuItem value="4h">4 Hours</MenuItem>
                          <MenuItem value="1d">1 Day</MenuItem>
                        </Select>
                      </FormControl>

                      <DateTimePicker
                        label="Start Date & Time"
                        value={startDate}
                        onChange={(newValue) => setDateRange(newValue, endDate)}
                        renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
                      />

                      {!useCurrentTime && (
                        <DateTimePicker
                          label="End Date & Time"
                          value={endDate}
                          onChange={(newValue) => setDateRange(startDate, newValue)}
                          renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
                        />
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Chip
                          label={useCurrentTime ? 'Use Current Time' : 'Custom End Time'}
                          onClick={() => setUseCurrentTime(!useCurrentTime)}
                          color={useCurrentTime ? 'primary' : 'default'}
                          variant={useCurrentTime ? 'filled' : 'outlined'}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={isAnalyzing ? <Stop /> : <PlayArrow />}
                        onClick={isAnalyzing ? handleStopAnalysis : handleRunAnalysis}
                        disabled={analysisMutation.isLoading}
                        fullWidth
                        sx={{ py: 1.5 }}
                      >
                        {isAnalyzing ? 'Stop Analysis' : 'Run Analysis'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>

                {/* Analysis Progress */}
                {isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                          Analysis Progress
                        </Typography>
                        
                        {analysisSteps.map((step, index) => (
                          <Box key={step.name} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  backgroundColor:
                                    step.status === 'completed' ? 'success.main' :
                                    step.status === 'running' ? 'warning.main' :
                                    'grey.300',
                                  mr: 2,
                                }}
                              />
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {step.name}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 3 }}>
                              {step.description}
                            </Typography>
                            {step.status === 'running' && (
                              <LinearProgress sx={{ mt: 1, ml: 3, mr: 1 }} />
                            )}
                          </Box>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Indicator Panel */}
                <IndicatorPanel />
              </motion.div>
            </Grid>

            {/* Main Content */}
            <Grid item xs={12} lg={8}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {/* Chart */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedAsset} - {selectedTimeframe}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" startIcon={<Download />}>
                          Export
                        </Button>
                        <Button size="small" startIcon={<Share />}>
                          Share
                        </Button>
                      </Box>
                    </Box>
                    
                    <TradingChart
                      symbol={selectedAsset}
                      timeframe={selectedTimeframe}
                      height={500}
                    />
                  </CardContent>
                </Card>

                {/* Analysis Results */}
                {analysisResults && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                          Analysis Results
                        </Typography>

                        {/* Technical Indicators */}
                        <Accordion defaultExpanded>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Assessment sx={{ mr: 2, color: 'primary.main' }} />
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                Technical Indicators
                              </Typography>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {analysisResults.technical_indicators || 'No indicator data available'}
                            </Typography>
                          </AccordionDetails>
                        </Accordion>

                        {/* Pattern Analysis */}
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Timeline sx={{ mr: 2, color: 'secondary.main' }} />
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                Pattern Analysis
                              </Typography>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {analysisResults.pattern_analysis || 'No pattern data available'}
                            </Typography>
                          </AccordionDetails>
                        </Accordion>

                        {/* Trend Analysis */}
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <TrendingUp sx={{ mr: 2, color: 'info.main' }} />
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                Trend Analysis
                              </Typography>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {analysisResults.trend_analysis || 'No trend data available'}
                            </Typography>
                          </AccordionDetails>
                        </Accordion>

                        {/* Final Decision */}
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Psychology sx={{ mr: 2, color: 'success.main' }} />
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                Trading Decision
                              </Typography>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            {analysisResults.final_decision ? (
                              <Box>
                                <Alert 
                                  severity={
                                    analysisResults.final_decision.decision === 'LONG' ? 'success' :
                                    analysisResults.final_decision.decision === 'SHORT' ? 'error' :
                                    'info'
                                  }
                                  sx={{ mb: 2 }}
                                >
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    Recommendation: {analysisResults.final_decision.decision}
                                  </Typography>
                                </Alert>
                                
                                <Grid container spacing={2}>
                                  <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                      Risk/Reward Ratio
                                    </Typography>
                                    <Typography variant="h6">
                                      {analysisResults.final_decision.risk_reward_ratio}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                      Forecast Horizon
                                    </Typography>
                                    <Typography variant="h6">
                                      {analysisResults.final_decision.forecast_horizon}
                                    </Typography>
                                  </Grid>
                                </Grid>
                                
                                <Divider sx={{ my: 2 }} />
                                
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                  {analysisResults.final_decision.justification}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2">
                                No decision data available
                              </Typography>
                            )}
                          </AccordionDetails>
                        </Accordion>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            </Grid>
          </Grid>
        </Box>
      </LocalizationProvider>
    </MobileLayout>
  );
};

export default Analysis;