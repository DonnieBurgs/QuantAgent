import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Chip,
} from '@mui/material';
import {
  Save,
  Key,
  Notifications,
  Speed,
  Palette,
  Security,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useMutation, useQuery } from 'react-query';
import toast from 'react-hot-toast';

import { useAppStore } from '../store/useStore';
import { apiService, queryKeys } from '../services/api';
import ThemeToggle from '../components/Theme/ThemeToggle';
import MobileLayout from '../components/Mobile/MobileLayout';

const Settings = () => {
  const { apiKey, setApiKey, settings, updateSettings } = useAppStore();
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localSettings, setLocalSettings] = useState(settings);

  // API key status query
  const { data: apiKeyStatus, refetch: refetchApiKeyStatus } = useQuery(
    queryKeys.apiKeyStatus,
    apiService.getApiKeyStatus
  );

  // API key update mutation
  const updateApiKeyMutation = useMutation(apiService.updateApiKey, {
    onSuccess: () => {
      setApiKey(localApiKey);
      toast.success('API key updated successfully');
      refetchApiKeyStatus();
    },
    onError: () => {
      toast.error('Failed to update API key');
    },
  });

  const handleSaveApiKey = () => {
    if (!localApiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }
    updateApiKeyMutation.mutate(localApiKey);
  };

  const handleSaveSettings = () => {
    updateSettings(localSettings);
    toast.success('Settings saved successfully');
  };

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const settingsCards = [
    {
      title: 'API Configuration',
      icon: <Key />,
      content: (
        <Box>
          <TextField
            label="OpenAI API Key"
            type="password"
            fullWidth
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            placeholder="sk-..."
            sx={{ mb: 2 }}
            helperText="Your API key is encrypted and stored securely"
          />
          
          {apiKeyStatus?.data?.has_key && (
            <Alert severity="success" sx={{ mb: 2 }}>
              API key is configured: {apiKeyStatus.data.masked_key}
            </Alert>
          )}
          
          <Button
            variant="contained"
            onClick={handleSaveApiKey}
            disabled={updateApiKeyMutation.isLoading}
            startIcon={<Save />}
          >
            {updateApiKeyMutation.isLoading ? 'Saving...' : 'Save API Key'}
          </Button>
        </Box>
      ),
    },
    {
      title: 'Theme & Appearance',
      icon: <Palette />,
      content: <ThemeToggle variant="card" />,
    },
    {
      title: 'Analysis Preferences',
      icon: <Speed />,
      content: (
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.autoRefresh}
                onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
              />
            }
            label="Auto-refresh market data"
            sx={{ mb: 2 }}
          />
          
          <TextField
            label="Refresh Interval (seconds)"
            type="number"
            value={localSettings.refreshInterval / 1000}
            onChange={(e) => handleSettingChange('refreshInterval', Number(e.target.value) * 1000)}
            disabled={!localSettings.autoRefresh}
            sx={{ mb: 2, width: '50%' }}
            inputProps={{ min: 5, max: 300 }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.showAdvancedMetrics}
                onChange={(e) => handleSettingChange('showAdvancedMetrics', e.target.checked)}
              />
            }
            label="Show advanced metrics"
            sx={{ mb: 2 }}
          />
          
          <Button
            variant="outlined"
            onClick={handleSaveSettings}
            startIcon={<Save />}
          >
            Save Preferences
          </Button>
        </Box>
      ),
    },
    {
      title: 'Notifications',
      icon: <Notifications />,
      content: (
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.notifications}
                onChange={(e) => handleSettingChange('notifications', e.target.checked)}
              />
            }
            label="Enable notifications"
            sx={{ mb: 2 }}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Get notified about analysis completion, system alerts, and market updates.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label="Analysis Complete" size="small" />
            <Chip label="System Alerts" size="small" />
            <Chip label="Market Updates" size="small" />
          </Box>
        </Box>
      ),
    },
    {
      title: 'Security & Privacy',
      icon: <Security />,
      content: (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            Your data is processed locally and securely. API keys are encrypted.
          </Alert>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            • All analysis data is processed in real-time
            • API keys are encrypted using industry-standard methods
            • No trading data is stored permanently
            • Session data is cleared on logout
          </Typography>
          
          <Button variant="outlined" color="error">
            Clear All Data
          </Button>
        </Box>
      ),
    },
  ];

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
              Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configure your QuantAgent experience
            </Typography>
          </Box>
        </motion.div>

        {/* Settings Cards */}
        <Grid container spacing={3}>
          {settingsCards.map((card, index) => (
            <Grid item xs={12} md={6} key={card.title}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Box sx={{ mr: 2, color: 'primary.main' }}>
                        {card.icon}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {card.title}
                      </Typography>
                    </Box>
                    
                    {card.content}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* System Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                System Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Version
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    v1.0.0
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Build
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    2024.01.15
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Environment
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Production
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Region
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    US-East
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </MobileLayout>
  );
};

export default Settings;