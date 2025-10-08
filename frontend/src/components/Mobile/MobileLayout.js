import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  BottomNavigation,
  BottomNavigationAction,
  useMediaQuery,
  useTheme,
  Fab,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Analytics,
  Settings,
  TrendingUp,
  Add,
  Notifications,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useAppStore } from '../../store/useStore';

const MobileLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bottomNavValue, setBottomNavValue] = useState(location.pathname);
  
  const { isDarkMode, toggleDarkMode } = useAppStore();

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/' },
    { text: 'Analysis', icon: <Analytics />, path: '/analysis' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setBottomNavValue(path);
    setDrawerOpen(false);
  };

  if (!isMobile) {
    return children;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Mobile App Bar */}
      <AppBar position="fixed" elevation={0}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <TrendingUp sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              QuantAgent
            </Typography>
          </Box>

          <IconButton color="inherit">
            <Notifications />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
      >
        <Box sx={{ width: 280, pt: 2 }}>
          <Box sx={{ px: 2, pb: 2 }}>
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
          </Box>

          <List>
            {menuItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    mx: 1,
                    borderRadius: 2,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 8, // Account for AppBar
          pb: 8, // Account for BottomNavigation
          px: 2,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          zIndex: 1000,
        }}
        onClick={() => navigate('/analysis')}
      >
        <Add />
      </Fab>

      {/* Bottom Navigation */}
      <BottomNavigation
        value={bottomNavValue}
        onChange={(event, newValue) => {
          setBottomNavValue(newValue);
          navigate(newValue);
        }}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: 1,
          borderColor: 'divider',
          zIndex: 1000,
        }}
      >
        <BottomNavigationAction
          label="Dashboard"
          value="/"
          icon={<Dashboard />}
        />
        <BottomNavigationAction
          label="Analysis"
          value="/analysis"
          icon={<Analytics />}
        />
        <BottomNavigationAction
          label="Settings"
          value="/settings"
          icon={<Settings />}
        />
      </BottomNavigation>
    </Box>
  );
};

export default MobileLayout;