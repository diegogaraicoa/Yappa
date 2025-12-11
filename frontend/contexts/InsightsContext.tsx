import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

interface InsightsContextType {
  insightsCount: number;
  criticalCount: number;
  lowStockCount: number;
  debtCount: number;
  refreshInsights: () => Promise<void>;
  loading: boolean;
}

const InsightsContext = createContext<InsightsContextType>({
  insightsCount: 0,
  criticalCount: 0,
  lowStockCount: 0,
  debtCount: 0,
  refreshInsights: async () => {},
  loading: false,
});

export const useInsights = () => useContext(InsightsContext);

export const InsightsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [insightsCount, setInsightsCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [debtCount, setDebtCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshInsights = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/ai/all-insights');
      const insights = response.data.insights || [];
      
      // Contar por tipo
      let critical = 0;
      let lowStock = 0;
      let debt = 0;
      
      insights.forEach((insight: any) => {
        if (insight.type === 'critical_stock') {
          critical++;
        } else if (insight.type === 'low_stock') {
          lowStock++;
        } else if (insight.type === 'overdue_debt') {
          debt++;
        }
      });
      
      setCriticalCount(critical);
      setLowStockCount(lowStock);
      setDebtCount(debt);
      setInsightsCount(insights.length);
    } catch (error) {
      console.error('Error fetching insights count:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar al montar
  useEffect(() => {
    refreshInsights();
    
    // Refrescar cada 60 segundos
    const interval = setInterval(refreshInsights, 60000);
    return () => clearInterval(interval);
  }, [refreshInsights]);

  return (
    <InsightsContext.Provider
      value={{
        insightsCount,
        criticalCount,
        lowStockCount,
        debtCount,
        refreshInsights,
        loading,
      }}
    >
      {children}
    </InsightsContext.Provider>
  );
};
