import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

interface Insight {
  id: string;
  type: string;
  category: string;
  icon: string;
  color: string;
  title: string;
  message: string;
  cta_text: string;
  cta_action: string;
  cta_data: any;
  priority: number;
  timestamp: string;
}

interface Report {
  id: string;
  year: number;
  month: number;
  month_name: string;
  generated_at: string;
  metrics?: {
    total_sales: number;
    total_expenses: number;
    net_balance: number;
    margin_percent: number;
  };
}

export default function InsightsScreen() {
  const router = useRouter();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch insights and reports in parallel
      const [insightsRes, reportsRes] = await Promise.all([
        api.get('/api/ai/all-insights').catch(() => ({ data: { insights: [] } })),
        api.get('/api/ai/reports/history').catch(() => ({ data: { reports: [] } })),
      ]);
      
      setInsights(insightsRes.data.insights || []);
      setReports(reportsRes.data.reports || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setInsights([]);
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const now = new Date();
      const response = await api.post(`/api/ai/reports/generate?year=${now.getFullYear()}&month=${now.getMonth() + 1}`);
      
      if (response.data.success) {
        // Navigate to report detail
        router.push(`/report-detail?id=${response.data.report.id}`);
        // Refresh list
        fetchData();
      } else {
        Alert.alert('Error', response.data.error || 'No se pudo generar el reporte');
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'No se pudo generar el reporte. Intenta de nuevo.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleAction = (insight: Insight) => {
    try {
      switch (insight.cta_action) {
        case 'navigate_to_product':
        case 'navigate_to_inventory':
          router.push('/(tabs)/inventory?from=insights');
          break;
        case 'navigate_to_customers':
        case 'send_payment_reminder':
          router.push('/customers?from=insights');
          break;
        case 'navigate_to_balance':
          router.push('/(tabs)/balance');
          break;
        case 'navigate_to_insights':
          break;
        case 'view_insight_details':
          console.log('Insight details:', insight);
          break;
        default:
          console.log('Acción no reconocida:', insight.cta_action);
      }
    } catch (error) {
      console.error('Error en navegación:', error);
    }
  };

  const groupedInsights = insights.reduce((acc, insight) => {
    if (!acc[insight.category]) {
      acc[insight.category] = [];
    }
    acc[insight.category].push(insight);
    return acc;
  }, {} as Record<string, Insight[]>);

  const getCurrentMonthName = () => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[new Date().getMonth()];
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Datos de mi Negocio</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A66BFF" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Datos de mi Negocio</Text>
        <TouchableOpacity
          onPress={() => router.push('/insights-timeline')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.historyButton}
        >
          <Ionicons name="time-outline" size={22} color="#A66BFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons name="sparkles" size={32} color="#A66BFF" />
          </View>
          <Text style={styles.heroTitle}>Tu Asistente IA</Text>
          <Text style={styles.heroSubtitle}>
            {insights.length === 0
              ? '¡Todo está perfecto! No hay alertas por ahora.'
              : `${insights.length} recomendaciones para tu negocio`}
          </Text>
        </View>

        {/* AI Reports Section */}
        <View style={styles.reportsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📊 Reportes Inteligentes</Text>
          </View>
          
          {/* Generate Report Button */}
          <TouchableOpacity
            style={styles.generateReportCard}
            onPress={handleGenerateReport}
            disabled={generatingReport}
            activeOpacity={0.8}
          >
            <View style={styles.generateReportIcon}>
              {generatingReport ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="document-text" size={28} color="#FFF" />
              )}
            </View>
            <View style={styles.generateReportContent}>
              <Text style={styles.generateReportTitle}>
                {generatingReport ? 'Generando...' : `Reporte de ${getCurrentMonthName()}`}
              </Text>
              <Text style={styles.generateReportSubtitle}>
                {generatingReport 
                  ? 'La IA está analizando tus datos' 
                  : 'Análisis completo con IA de tu negocio'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </TouchableOpacity>

          {/* Report History */}
          {reports.length > 0 && (
            <View style={styles.reportHistoryContainer}>
              <Text style={styles.reportHistoryTitle}>📅 Reportes Anteriores</Text>
              {reports.slice(0, 3).map((report) => (
                <TouchableOpacity
                  key={report.id}
                  style={styles.reportHistoryItem}
                  onPress={() => router.push(`/report-detail?id=${report.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.reportHistoryIcon}>
                    <Ionicons name="document" size={20} color="#A66BFF" />
                  </View>
                  <View style={styles.reportHistoryContent}>
                    <Text style={styles.reportHistoryName}>
                      {report.month_name} {report.year}
                    </Text>
                    {report.metrics && (
                      <Text style={styles.reportHistoryMetric}>
                        Ventas: ${report.metrics.total_sales?.toFixed(2) || '0.00'}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Insights Section */}
        {insights.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyTitle}>Todo Bien</Text>
            <Text style={styles.emptyText}>
              No tienes alertas ni recomendaciones urgentes. Genera un reporte para ver el análisis completo de tu negocio.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.insightsSectionHeader}>
              <Text style={styles.sectionTitle}>⚡ Alertas y Sugerencias</Text>
            </View>
            {Object.entries(groupedInsights).map(([category, categoryInsights]) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {categoryInsights.map((insight) => (
                  <TouchableOpacity
                    key={insight.id}
                    style={[styles.insightCard, { borderLeftColor: insight.color }]}
                    onPress={() => handleAction(insight)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardHeader}>
                      <View
                        style={[
                          styles.cardIcon,
                          { backgroundColor: `${insight.color}20` },
                        ]}
                      >
                        <Text style={styles.iconEmoji}>{insight.icon}</Text>
                      </View>
                      <View style={styles.cardHeaderText}>
                        <Text style={styles.cardTitle}>{insight.title}</Text>
                        <Text style={styles.cardMessage}>{insight.message}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.ctaButton, { backgroundColor: insight.color }]}
                      onPress={() => handleAction(insight)}
                    >
                      <Text style={styles.ctaText}>{insight.cta_text}</Text>
                      <Ionicons name="arrow-forward" size={14} color="#FFF" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  historyButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#757575',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#757575',
    textAlign: 'center',
  },
  
  // Reports Section
  reportsSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  generateReportCard: {
    backgroundColor: '#A66BFF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#A66BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateReportIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  generateReportContent: {
    flex: 1,
  },
  generateReportTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  generateReportSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  
  // Report History
  reportHistoryContainer: {
    marginTop: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
  },
  reportHistoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  reportHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  reportHistoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportHistoryContent: {
    flex: 1,
  },
  reportHistoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  reportHistoryMetric: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
  },
  
  // Divider
  divider: {
    height: 8,
    backgroundColor: '#F5F5F5',
    marginVertical: 8,
  },
  
  // Insights Section
  insightsSectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    marginBottom: 12,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Category
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 10,
    marginHorizontal: 20,
  },
  
  // Insight Card
  insightCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 22,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 3,
  },
  cardMessage: {
    fontSize: 13,
    color: '#424242',
    lineHeight: 18,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
});
