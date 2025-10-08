import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  Typography,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  MonitorHeart,
  TrendingUp,
  Assessment,
  Timeline,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import { useAppStore } from '../../store/useStore';

const DRAWER_WIDTH = 280;

const menuItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/',
    description: 'Overview & Quick Analysis',
  },
  {
    text: 'Analysis',
    icon: <AnalyticsIcon />,
    path: '/analysis',
    description: 'Detailed Trading Analysis',
  },
  {
    text: 'System Status',
    icon: <MonitorHeart />,
    path: '/system-status',
    description: 'Health & Performance',
  },
  {
    text: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings',
    description: 'Configuration & Preferences',
  },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { systemStatus } = useAppStore();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TrendingUp sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                QuantAgent
              </Typography>
              <Typography variant="caption" color="text.secondary">
                AI Trading Analysis
              </Typography>
            </Box>
          </Box>
        </motion.div>

        {/* System Status Chip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Chip
            icon={<MonitorHeart />}
            label={systemStatus?.overall_health || 'Unknown'}
            color={
              systemStatus?.overall_health === 'healthy' ? 'success' :
              systemStatus?.overall_health === 'warning' ? 'warning' :
              systemStatus?.overall_health === 'error' ? 'error' :
              'default'
            }
            size="small"
            sx={{ mb: 2 }}
          />
        </motion.div>
      </Box>

      <Divider />

      <List sx={{ px: 2, py: 1 }}>
        {menuItems.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <ListItem disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  secondary={item.description}
                  primaryTypographyProps={{
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                    color: location.pathname === item.path ? 'inherit' : 'text.secondary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          </motion.div>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      {/* Quick Stats */}
      <Box sx={{ p: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Quick Stats
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                API Calls Today
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {systemStatus?.error_statistics?.total_errors || 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Uptime
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                99.9%
              </Typography>
            </Box>
          </Box>
        </motion.div>
      </Box>
    </Drawer>
  );
};

export default Sidebar;