import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
  Avatar,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Notifications,
  Settings as SettingsIcon,
  TrendingUp,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import { useAppStore } from '../../store/useStore';

const Navbar = () => {
  const { isDarkMode, toggleDarkMode, systemStatus } = useAppStore();

  const getStatusColor = () => {
    if (!systemStatus) return 'default';
    switch (systemStatus.overall_health) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                QuantAgent
              </Typography>
            </Box>
          </motion.div>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* System Status Indicator */}
          <Tooltip title={`System Status: ${systemStatus?.overall_health || 'Unknown'}`}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: 
                  systemStatus?.overall_health === 'healthy' ? 'success.main' :
                  systemStatus?.overall_health === 'warning' ? 'warning.main' :
                  systemStatus?.overall_health === 'error' ? 'error.main' :
                  'grey.400',
                mr: 2,
              }}
            />
          </Tooltip>

          {/* Dark Mode Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={isDarkMode}
                onChange={toggleDarkMode}
                size="small"
              />
            }
            label={
              <IconButton size="small" sx={{ p: 0 }}>
                {isDarkMode ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            }
            sx={{ mr: 1 }}
          />

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton size="small">
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Settings */}
          <Tooltip title="Settings">
            <IconButton size="small">
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          {/* User Avatar */}
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32, 
              bgcolor: 'primary.main',
              ml: 1,
            }}
          >
            Q
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;