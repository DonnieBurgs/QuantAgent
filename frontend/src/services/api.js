import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
    
    // Add API key if available
    const apiKey = localStorage.getItem('quantagent-api-key');
    if (apiKey) {
      config.headers['X-API-Key'] = apiKey;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      toast.error('Invalid API key. Please check your settings.');
    } else if (error.response?.status === 429) {
      toast.error('Rate limit exceeded. Please wait a moment.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please try again.');
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// API service methods
export const apiService = {
  // System status
  getSystemStatus: () => api.get('/system-status'),
  
  // Assets
  getAssets: () => api.get('/assets'),
  getCustomAssets: () => api.get('/custom-assets'),
  saveCustomAsset: (symbol) => api.post('/save-custom-asset', { symbol }),
  
  // Market data
  getTimeframeLimits: (timeframe) => api.get(`/timeframe-limits/${timeframe}`),
  validateDateRange: (data) => api.post('/validate-date-range', data),
  
  // Analysis
  runAnalysis: (data) => api.post('/analyze', data),
  
  // API key management
  updateApiKey: (apiKey) => api.post('/update-api-key', { api_key: apiKey }),
  getApiKeyStatus: () => api.get('/get-api-key-status'),
  validateApiKey: () => api.post('/validate-api-key'),
  
  // Images
  getImage: (imageType) => api.get(`/images/${imageType}`, { responseType: 'blob' }),
};

// Real-time WebSocket connection
export class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 1000;
    this.listeners = new Map();
  }

  connect() {
    try {
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connected', true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.type, data.payload);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.emit('connected', false);
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.reconnect();
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
        this.connect();
      }, this.reconnectInterval * this.reconnectAttempts);
    }
  }

  send(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }
}

// Create singleton WebSocket instance
export const wsService = new WebSocketService();

// React Query hooks for data fetching
export const queryKeys = {
  systemStatus: ['systemStatus'],
  assets: ['assets'],
  customAssets: ['customAssets'],
  apiKeyStatus: ['apiKeyStatus'],
  analysis: (params) => ['analysis', params],
  timeframeLimits: (timeframe) => ['timeframeLimits', timeframe],
};

// Utility functions
export const downloadFile = (data, filename, type = 'application/json') => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const formatError = (error) => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default api;