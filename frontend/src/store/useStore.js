import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Main application store
export const useAppStore = create(
  persist(
    (set, get) => ({
      // Theme state
      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      // API key management
      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),
      
      // Analysis state
      isAnalyzing: false,
      setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
      
      // Current analysis results
      analysisResults: null,
      setAnalysisResults: (results) => set({ analysisResults: results }),
      
      // Selected asset and timeframe
      selectedAsset: 'BTC',
      selectedTimeframe: '4h',
      setSelectedAsset: (asset) => set({ selectedAsset: asset }),
      setSelectedTimeframe: (timeframe) => set({ selectedTimeframe: timeframe }),
      
      // Date range
      startDate: null,
      endDate: null,
      setDateRange: (start, end) => set({ startDate: start, endDate: end }),
      
      // System status
      systemStatus: null,
      setSystemStatus: (status) => set({ systemStatus: status }),
      
      // Error handling
      lastError: null,
      setError: (error) => set({ lastError: error }),
      clearError: () => set({ lastError: null }),
      
      // Settings
      settings: {
        autoRefresh: false,
        refreshInterval: 30000, // 30 seconds
        showAdvancedMetrics: false,
        notifications: true,
      },
      updateSettings: (newSettings) => 
        set((state) => ({ 
          settings: { ...state.settings, ...newSettings } 
        })),
      
      // Chart preferences
      chartPreferences: {
        showVolume: true,
        showIndicators: true,
        chartType: 'candlestick',
        timeframe: '4h',
      },
      updateChartPreferences: (prefs) =>
        set((state) => ({
          chartPreferences: { ...state.chartPreferences, ...prefs }
        })),
    }),
    {
      name: 'quantagent-store',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        apiKey: state.apiKey,
        selectedAsset: state.selectedAsset,
        selectedTimeframe: state.selectedTimeframe,
        settings: state.settings,
        chartPreferences: state.chartPreferences,
      }),
    }
  )
);

// Trading data store
export const useTradingStore = create((set, get) => ({
  // Market data
  marketData: {},
  setMarketData: (symbol, data) =>
    set((state) => ({
      marketData: { ...state.marketData, [symbol]: data }
    })),
  
  // Real-time updates
  isConnected: false,
  setConnected: (connected) => set({ isConnected: connected }),
  
  // Analysis history
  analysisHistory: [],
  addAnalysis: (analysis) =>
    set((state) => ({
      analysisHistory: [analysis, ...state.analysisHistory.slice(0, 49)] // Keep last 50
    })),
  
  // Watchlist
  watchlist: ['BTC', 'ETH', 'SPX', 'QQQ'],
  addToWatchlist: (symbol) =>
    set((state) => ({
      watchlist: state.watchlist.includes(symbol) 
        ? state.watchlist 
        : [...state.watchlist, symbol]
    })),
  removeFromWatchlist: (symbol) =>
    set((state) => ({
      watchlist: state.watchlist.filter(s => s !== symbol)
    })),
  
  // Technical indicators settings
  indicatorSettings: {
    rsi: { period: 14, overbought: 70, oversold: 30 },
    macd: { fast: 12, slow: 26, signal: 9 },
    bb: { period: 20, stdDev: 2 },
    sma: { periods: [20, 50, 200] },
  },
  updateIndicatorSettings: (indicator, settings) =>
    set((state) => ({
      indicatorSettings: {
        ...state.indicatorSettings,
        [indicator]: { ...state.indicatorSettings[indicator], ...settings }
      }
    })),
}));