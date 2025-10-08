import React from 'react';
import {
  IconButton,
  Tooltip,
  Box,
  Switch,
  FormControlLabel,
  Typography,
  Card,
  CardContent,
  Grid,
  useTheme,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Palette,
  DarkMode,
  LightMode,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import { useAppStore } from '../../store/useStore';

const ThemeToggle = ({ variant = 'icon' }) => {
  const { isDarkMode, toggleDarkMode } = useAppStore();
  const theme = useTheme();

  if (variant === 'icon') {
    return (
      <Tooltip title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}>
        <IconButton onClick={toggleDarkMode} color="inherit">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: isDarkMode ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isDarkMode ? <Brightness7 /> : <Brightness4 />}
          </motion.div>
        </IconButton>
      </Tooltip>
    );
  }

  if (variant === 'switch') {
    return (
      <FormControlLabel
        control={
          <Switch
            checked={isDarkMode}
            onChange={toggleDarkMode}
            color="primary"
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isDarkMode ? <DarkMode sx={{ mr: 1 }} /> : <LightMode sx={{ mr: 1 }} />}
            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
          </Box>
        }
      />
    );
  }

  if (variant === 'card') {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Palette sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Theme Preferences
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Box
                  onClick={() => !isDarkMode || toggleDarkMode()}
                  sx={{
                    p: 2,
                    border: 2,
                    borderColor: !isDarkMode ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    cursor: 'pointer',
                    textAlign: 'center',
                    backgroundColor: !isDarkMode ? 'primary.main' : 'transparent',
                    color: !isDarkMode ? 'primary.contrastText' : 'text.primary',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: !isDarkMode ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  <LightMode sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Light Mode
                  </Typography>
                  <Typography variant="caption" color="inherit">
                    Clean and bright interface
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
            
            <Grid item xs={6}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Box
                  onClick={() => isDarkMode || toggleDarkMode()}
                  sx={{
                    p: 2,
                    border: 2,
                    borderColor: isDarkMode ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    cursor: 'pointer',
                    textAlign: 'center',
                    backgroundColor: isDarkMode ? 'primary.main' : 'transparent',
                    color: isDarkMode ? 'primary.contrastText' : 'text.primary',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: isDarkMode ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  <DarkMode sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Dark Mode
                  </Typography>
                  <Typography variant="caption" color="inherit">
                    Easy on the eyes
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              💡 Tip: Your theme preference is automatically saved and will persist across sessions.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default ThemeToggle;