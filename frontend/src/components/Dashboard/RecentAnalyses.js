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
  IconButton,
  Avatar,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  MoreVert,
  AccessTime,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import { useTradingStore } from '../../store/useStore';

const RecentAnalyses = () => {
  const { analysisHistory } = useTradingStore();

  // Mock recent analyses if none exist
  const mockAnalyses = [
    {
      id: 1,
      asset: 'BTC',
      timeframe: '4h',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      decision: 'LONG',
      confidence: 85,
    },
    {
      id: 2,
      asset: 'ETH',
      timeframe: '1h',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      decision: 'SHORT',
      confidence: 72,
    },
    {
      id: 3,
      asset: 'SPX',
      timeframe: '1d',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      decision: 'LONG',
      confidence: 91,
    },
  ];

  const analyses = analysisHistory.length > 0 ? analysisHistory : mockAnalyses;

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getDecisionColor = (decision) => {
    switch (decision) {
      case 'LONG': return 'success';
      case 'SHORT': return 'error';
      default: return 'default';
    }
  };

  const getDecisionIcon = (decision) => {
    switch (decision) {
      case 'LONG': return <TrendingUp />;
      case 'SHORT': return <TrendingDown />;
      default: return <AccessTime />;
    }
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
            Recent Analyses
          </Typography>
          
          <List disablePadding>
            {analyses.slice(0, 5).map((analysis, index) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <ListItem
                  disablePadding
                  sx={{
                    py: 1.5,
                    borderBottom: index < analyses.length - 1 ? 1 : 0,
                    borderColor: 'divider',
                  }}
                  secondaryAction={
                    <IconButton size="small">
                      <MoreVert />
                    </IconButton>
                  }
                >
                  <Avatar
                    sx={{
                      mr: 2,
                      bgcolor: `${getDecisionColor(analysis.decision)}.main`,
                      width: 32,
                      height: 32,
                    }}
                  >
                    {getDecisionIcon(analysis.decision)}
                  </Avatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {analysis.asset} • {analysis.timeframe}
                        </Typography>
                        <Chip
                          label={analysis.decision}
                          size="small"
                          color={getDecisionColor(analysis.decision)}
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Confidence: {analysis.confidence}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimeAgo(analysis.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </motion.div>
            ))}
          </List>

          {analyses.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <AccessTime sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                No recent analyses found
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecentAnalyses;