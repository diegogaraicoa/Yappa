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
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

interface ReportMetrics {
  total_sales: number;
  total_expenses: number;
  net_balance: number;
  margin_percent: number;
  sales_change: number;
  total_debt: number;
}

interface Report {
  id: string;
  year: number;
  month: number;
  month_name: string;
  generated_at: string;
  ai_analysis: string;
  metrics: ReportMetrics;
}

export default function ReportDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchReport();
    }
  }, [id]);

  const fetchReport = async () => {
    try {
      const response = await api.get(`/api/ai/reports/${id}`);
      if (response.data.success) {
        setReport(response.data.report);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      Alert.alert('Error', 'No se pudo cargar el reporte');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  const handleRegenerate = async () => {
    Alert.alert(
      'Regenerar Reporte',
      '¿Deseas generar un nuevo análisis? Esto reemplazará el reporte actual.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Regenerar',
          onPress: async () => {
            setRegenerating(true);
            try {
              const response = await api.post(`/api/ai/reports/regenerate/${id}`);
              if (response.data.success) {
                setReport(response.data.report);
                Alert.alert('Éxito', 'El reporte ha sido regenerado');
              }
            } catch (error) {
              console.error('Error regenerating:', error);
              Alert.alert('Error', 'No se pudo regenerar el reporte');
            } finally {
              setRegenerating(false);
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!report) return;
    
    try {
      // Create a summary for sharing
      const summary = `📊 Reporte ${report.month_name} ${report.year}\n\n` +
        `💰 Ventas: $${report.metrics.total_sales.toFixed(2)}\n` +
        `💸 Gastos: $${report.metrics.total_expenses.toFixed(2)}\n` +
        `📈 Balance: $${report.metrics.net_balance.toFixed(2)}\n` +
        `📊 Margen: ${report.metrics.margin_percent.toFixed(1)}%\n\n` +
        `Generado por YAPPA IA`;
      
      await Share.share({
        message: summary,
        title: `Reporte ${report.month_name} ${report.year}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-EC', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Parse markdown-like content to styled sections
  const renderAnalysis = (text: string) => {
    if (!text) return null;
    
    const sections = text.split('\n\n');
    
    return sections.map((section, index) => {
      // Check if it's a header
      if (section.startsWith('## ')) {
        return (
          <Text key={index} style={styles.sectionHeader}>
            {section.replace('## ', '')}
          </Text>
        );
      }
      if (section.startsWith('# ')) {
        return (
          <Text key={index} style={styles.mainHeader}>
            {section.replace('# ', '')}
          </Text>
        );
      }
      if (section.startsWith('### ')) {
        return (
          <Text key={index} style={styles.subHeader}>
            {section.replace('### ', '')}
          </Text>
        );
      }
      
      // Regular paragraph
      return (
        <Text key={index} style={styles.paragraph}>
          {section}
        </Text>
      );
    });
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
          <Text style={styles.headerTitle}>Reporte IA</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A66BFF" />
          <Text style={styles.loadingText}>Cargando reporte...</Text>
        </View>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reporte IA</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#FF5252" />
          <Text style={styles.errorText}>No se encontró el reporte</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>{report.month_name} {report.year}</Text>
        <TouchableOpacity
          onPress={handleShare}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="share-outline" size={24} color="#A66BFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIconContainer}>
            <Ionicons name="analytics" size={32} color="#FFF" />
          </View>
          <Text style={styles.heroTitle}>Reporte Inteligente</Text>
          <Text style={styles.heroSubtitle}>
            {report.month_name} {report.year}
          </Text>
          <Text style={styles.heroDate}>
            Generado: {formatDate(report.generated_at)}
          </Text>
        </View>

        {/* Metrics Cards */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricRow}>
            <View style={[styles.metricCard, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.metricLabel}>Ventas</Text>
              <Text style={[styles.metricValue, { color: '#2E7D32' }]}>
                ${report.metrics.total_sales.toFixed(2)}
              </Text>
              {report.metrics.sales_change !== 0 && (
                <View style={styles.changeContainer}>
                  <Ionicons 
                    name={report.metrics.sales_change > 0 ? 'trending-up' : 'trending-down'} 
                    size={14} 
                    color={report.metrics.sales_change > 0 ? '#2E7D32' : '#C62828'} 
                  />
                  <Text style={[
                    styles.changeText,
                    { color: report.metrics.sales_change > 0 ? '#2E7D32' : '#C62828' }
                  ]}>
                    {report.metrics.sales_change > 0 ? '+' : ''}{report.metrics.sales_change.toFixed(1)}%
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.metricCard, { backgroundColor: '#FFEBEE' }]}>
              <Text style={styles.metricLabel}>Gastos</Text>
              <Text style={[styles.metricValue, { color: '#C62828' }]}>
                ${report.metrics.total_expenses.toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={styles.metricRow}>
            <View style={[styles.metricCard, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.metricLabel}>Balance Neto</Text>
              <Text style={[styles.metricValue, { color: report.metrics.net_balance >= 0 ? '#1565C0' : '#C62828' }]}>
                ${report.metrics.net_balance.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: '#F3E5F5' }]}>
              <Text style={styles.metricLabel}>Margen</Text>
              <Text style={[styles.metricValue, { color: '#7B1FA2' }]}>
                {report.metrics.margin_percent.toFixed(1)}%
              </Text>
            </View>
          </View>
          {report.metrics.total_debt > 0 && (
            <View style={[styles.debtCard]}>
              <Ionicons name="warning" size={20} color="#FF9800" />
              <Text style={styles.debtText}>
                Deudas pendientes: ${report.metrics.total_debt.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {/* AI Analysis */}
        <View style={styles.analysisContainer}>
          <View style={styles.analysisTitleRow}>
            <Ionicons name="sparkles" size={24} color="#A66BFF" />
            <Text style={styles.analysisTitle}>Análisis IA</Text>
          </View>
          <View style={styles.analysisContent}>
            {renderAnalysis(report.ai_analysis)}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.regenerateButton}
            onPress={handleRegenerate}
            disabled={regenerating}
          >
            {regenerating ? (
              <ActivityIndicator size="small" color="#A66BFF" />
            ) : (
              <Ionicons name="refresh" size={20} color="#A66BFF" />
            )}
            <Text style={styles.regenerateText}>
              {regenerating ? 'Regenerando...' : 'Regenerar Reporte'}
            </Text>
          </TouchableOpacity>
        </View>

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
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#A66BFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // Hero Banner
  heroBanner: {
    backgroundColor: '#A66BFF',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  heroDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  
  // Metrics
  metricsContainer: {
    padding: 16,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  debtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  debtText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
  },
  
  // Analysis
  analysisContainer: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  analysisTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  analysisContent: {
    gap: 8,
  },
  mainHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: '#212121',
    marginTop: 8,
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: '#A66BFF',
    marginTop: 16,
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#424242',
    marginTop: 12,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#424242',
    marginBottom: 8,
  },
  
  // Actions
  actionsContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#A66BFF',
    gap: 8,
  },
  regenerateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#A66BFF',
  },
});
