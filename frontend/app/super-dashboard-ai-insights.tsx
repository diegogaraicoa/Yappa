import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../utils/api';

interface Insight {
  id: string;
  category: string;
  icon: string;
  color: string;
  title: string;
  this_week: number;
  last_week?: number;
  total?: number;
  change_percent: number;
  trend: string;
  insight: string;
}

interface Recommendation {
  type: string;
  icon: string;
  title: string;
  message: string;
}

interface TopFeature {
  name: string;
  count: number;
}

interface InsightsData {
  generated_at: string;
  period: {
    this_week: { start: string; end: string };
    last_week: { start: string; end: string };
  };
  insights: Insight[];
  top_features: TopFeature[];
  recommendations: Recommendation[];
}

export default function AIInsightsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<InsightsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const response = await api.get('/api/ai/super-insights');
      setData(response.data);
    } catch (err: any) {
      console.error('Error loading AI insights:', err);
      setError(err.response?.data?.detail || 'Error al cargar insights');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return { name: 'trending-up', color: '#4CAF50' };
      case 'down':
        return { name: 'trending-down', color: '#F44336' };
      case 'warning':
        return { name: 'warning', color: '#FF9800' };
      case 'ok':
        return { name: 'checkmark-circle', color: '#4CAF50' };
      default:
        return { name: 'remove', color: '#999' };
    }
  };

  const getRecommendationStyle = (type: string) => {
    switch (type) {
      case 'success':
        return { bg: '#E8F5E9', border: '#4CAF50', text: '#2E7D32' };
      case 'warning':
        return { bg: '#FFF3E0', border: '#FF9800', text: '#E65100' };
      case 'alert':
        return { bg: '#FFEBEE', border: '#F44336', text: '#C62828' };
      default:
        return { bg: '#E3F2FD', border: '#2196F3', text: '#1565C0' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9C27B0" />
          <Text style={styles.loadingText}>Analizando datos con IA...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Explore Data</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>✨ Explore Data</Text>
          <Text style={styles.headerSubtitle}>AI-Powered Insights</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#9C27B0" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Period Info */}
        <View style={styles.periodCard}>
          <Ionicons name="calendar-outline" size={20} color="#666" />
          <Text style={styles.periodText}>
            Comparando: {formatDate(data?.period.this_week.start || '')} - {formatDate(data?.period.this_week.end || '')}
          </Text>
          <Text style={styles.periodVsText}>vs semana anterior</Text>
        </View>

        {/* AI Recommendations */}
        {data?.recommendations && data.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🤖 Recomendaciones AI</Text>
            {data.recommendations.map((rec, index) => {
              const style = getRecommendationStyle(rec.type);
              return (
                <View
                  key={index}
                  style={[
                    styles.recommendationCard,
                    { backgroundColor: style.bg, borderLeftColor: style.border }
                  ]}
                >
                  <Text style={styles.recommendationIcon}>{rec.icon}</Text>
                  <View style={styles.recommendationContent}>
                    <Text style={[styles.recommendationTitle, { color: style.text }]}>
                      {rec.title}
                    </Text>
                    <Text style={styles.recommendationMessage}>{rec.message}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Weekly Comparison Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Comparación Semanal</Text>
          {data?.insights.map((insight) => {
            const trendIcon = getTrendIcon(insight.trend);
            return (
              <View key={insight.id} style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightEmoji}>{insight.icon}</Text>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Ionicons
                    name={trendIcon.name as any}
                    size={24}
                    color={trendIcon.color}
                  />
                </View>

                <View style={styles.insightMetrics}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Esta semana</Text>
                    <Text style={[styles.metricValue, { color: insight.color }]}>
                      {insight.this_week.toLocaleString()}
                    </Text>
                  </View>
                  
                  {insight.last_week !== undefined && (
                    <View style={styles.metricBox}>
                      <Text style={styles.metricLabel}>Semana pasada</Text>
                      <Text style={styles.metricValueSecondary}>
                        {insight.last_week.toLocaleString()}
                      </Text>
                    </View>
                  )}
                  
                  {insight.total !== undefined && (
                    <View style={styles.metricBox}>
                      <Text style={styles.metricLabel}>Total</Text>
                      <Text style={styles.metricValueSecondary}>
                        {insight.total.toLocaleString()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Cambio</Text>
                    <Text
                      style={[
                        styles.metricChange,
                        { color: insight.change_percent >= 0 ? '#4CAF50' : '#F44336' }
                      ]}
                    >
                      {insight.change_percent >= 0 ? '+' : ''}
                      {insight.change_percent}%
                    </Text>
                  </View>
                </View>

                <Text style={styles.insightText}>{insight.insight}</Text>
              </View>
            );
          })}
        </View>

        {/* Top Features */}
        {data?.top_features && data.top_features.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 Funcionalidades Más Usadas</Text>
            <View style={styles.featuresContainer}>
              {data.top_features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureRank}>
                    <Text style={styles.featureRankText}>#{index + 1}</Text>
                  </View>
                  <Text style={styles.featureName}>{feature.name || 'Sin nombre'}</Text>
                  <Text style={styles.featureCount}>{feature.count.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Generated timestamp */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generado: {data?.generated_at ? new Date(data.generated_at).toLocaleString('es-ES') : 'N/A'}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { marginTop: 16, fontSize: 16, color: '#666', textAlign: 'center' },
  retryButton: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#9C27B0', borderRadius: 8 },
  retryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 16, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E0E0E0' 
  },
  backButton: { padding: 8 },
  headerTextContainer: { flex: 1, marginLeft: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#9C27B0', marginTop: 2 },
  refreshButton: { padding: 8 },
  
  scrollView: { flex: 1 },
  
  periodCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 16, 
    marginHorizontal: 16, 
    marginTop: 16, 
    borderRadius: 12,
    gap: 8,
    flexWrap: 'wrap'
  },
  periodText: { fontSize: 14, color: '#333', fontWeight: '500' },
  periodVsText: { fontSize: 12, color: '#666' },
  
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  
  recommendationCard: { 
    flexDirection: 'row', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12,
    borderLeftWidth: 4,
    alignItems: 'flex-start'
  },
  recommendationIcon: { fontSize: 24, marginRight: 12 },
  recommendationContent: { flex: 1 },
  recommendationTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  recommendationMessage: { fontSize: 14, color: '#666', lineHeight: 20 },
  
  insightCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  insightEmoji: { fontSize: 24, marginRight: 10 },
  insightTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#333' },
  
  insightMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  metricBox: { minWidth: 80 },
  metricLabel: { fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 4 },
  metricValue: { fontSize: 20, fontWeight: 'bold' },
  metricValueSecondary: { fontSize: 16, fontWeight: '600', color: '#666' },
  metricChange: { fontSize: 16, fontWeight: 'bold' },
  
  insightText: { fontSize: 13, color: '#666', fontStyle: 'italic', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  
  featuresContainer: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden' },
  featureItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0' 
  },
  featureRank: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#9C27B0', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  featureRankText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  featureName: { flex: 1, fontSize: 15, color: '#333' },
  featureCount: { fontSize: 15, fontWeight: '600', color: '#9C27B0' },
  
  footer: { paddingHorizontal: 16, paddingVertical: 20, alignItems: 'center' },
  footerText: { fontSize: 12, color: '#999' },
});
