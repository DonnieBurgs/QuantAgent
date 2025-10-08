import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import { useTradingStore } from '../../store/useStore';

const MarketOverview = () => {
  const { watchlist } = useTradingStore();

  // Mock market data - in real app, this would come from API
  const marketData = [
    { symbol: 'BTC', price: 43250.50, change: 2.34, changePercent: 5.73 },
    { symbol: 'ETH', price: 2650.75, change: -15.25, changePercent: -0.57 },
    { symbol: 'SPX', price: 4185.25, change: 12.50, changePercent: 0.30 },
    { symbol: 'QQQ', price: 365.80, change: 3.20, changePercent: 0.88 },
  ];

  const getTrendIcon = (change) => {
    if (change > 0) return <TrendingUp sx={{ color: 'success.main' }} />;
    if (change < 0) return <TrendingDown sx={{ color: 'error.main' }} />;
    return <TrendingFlat sx={{ color: 'text.secondary' }} />;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'success.main';
    if (change < 0) return 'error.main';
    return 'text.secondary';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Market Overview
          </Typography>
          
          <List disablePadding>
            {marketData.map((item, index) => (
              <motion.div
                key={item.symbol}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <ListItem
                  disablePadding
                  sx={{
                    py: 1,
                    borderBottom: index < marketData.length - 1 ? 1 : 0,
                    borderColor: 'divider',
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getTrendIcon(item.change)}
                          <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 600 }}>
                            {item.symbol}
                          </Typography>
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          ${item.price.toLocaleString()}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                        <Typography
                          variant="caption"
                          sx={{ color: getChangeColor(item.change) }}
                        >
                          {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}
                        </Typography>
                        <Chip
                          label={`${item.changePercent > 0 ? '+' : ''}${item.changePercent.toFixed(2)}%`}
                          size="small"
                          color={item.changePercent > 0 ? 'success' : item.changePercent < 0 ? 'error' : 'default'}
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              </motion.div>
            ))}
          </List>

          <Box sx={{ mt: 2, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              📊 Market data updates every 5 seconds
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MarketOverview;