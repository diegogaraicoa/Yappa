import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { showAlert } from '../utils/showAlert';

export default function InsightsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [latestInsight, setLatestInsight] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyReports, setHistoryReports] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Date filter state
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  useEffect(() => {
    loadLatestInsight();
    loadLowStockProducts();
  }, [startDate, endDate]);

  const loadLatestInsight = async () => {
    try {
      const response = await api.get('/api/insights/latest');
      setLatestInsight(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setLatestInsight(null);
      } else {
        console.error('Error loading insights:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadLowStockProducts = async () => {
    try {
      const response = await api.get('/api/alerts/low-stock');
      setLowStockProducts(response.data);
    } catch (error) {
      console.error('Error loading low stock:', error);
    }
  };

  const generateNewInsight = async () => {
    setGenerating(true);
    try {
      const response = await api.post(
        '/api/insights/generate',
        {},
        {
          timeout: 60000,
        }
      );
      setLatestInsight(response.data);
      
      // MENSAJE DE CONFIRMACIÓN
      showAlert(
        '✅ Éxito',
        'Reporte generado exitosamente',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error generating insight:', error);
      showAlert(
        '❌ Error',
        'No se pudo generar el reporte',
        [{ text: 'OK' }]
      );
    } finally {
      setGenerating(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await api.get('/api/insights/history?limit=10');
      setHistoryReports(response.data);
    } catch (error: any) {
      console.error('Error loading history:', error);
      showAlert('Error', 'No se pudo cargar el historial');
    } finally {
      setLoadingHistory(false);
    }
  };

  const openHistory = () => {
    setShowHistory(true);
    loadHistory();
  };

  const viewHistoricalReport = (report: any) => {
    setLatestInsight(report);
    setShowHistory(false);
    showAlert(
      'Reporte Histórico',
      `Viendo reporte del ${formatDate(report.generated_at)}`
    );
  };

  const sendToWhatsApp = async () => {
    if (!latestInsight) {
      showAlert('Error', 'No hay reporte disponible para enviar');
      return;
    }
    
    setSending(true);
    
    setTimeout(async () => {
      try {
        console.log('Sending report to WhatsApp...');
        const response = await api.post(
          '/api/insights/send-whatsapp',
          {},
          {
            timeout: 30000,
          }
        );
        
        console.log('WhatsApp send response:', response.data);
        
        // Esperar un frame antes de mostrar el Alert
        requestAnimationFrame(() => {
          showAlert(
            'Enviado',
            'Tu reporte fue enviado exitosamente a WhatsApp',
            [{ text: 'OK' }]
          );
        });
      } catch (error: any) {
        console.error('Error sending to WhatsApp:', error);
        requestAnimationFrame(() => {
          showAlert(
            'Error',
            'No se pudo enviar el reporte por WhatsApp',
            [{ text: 'OK' }]
          );
        });
      } finally {
        setSending(false);
      }
    }, 50);
  };

  const navigateToInventory = () => {
    router.push('/(tabs)/inventory');
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLatestInsight();
    loadLowStockProducts();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-EC', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const renderMetrics = () => {
    if (!latestInsight?.metrics) return null;

    const metrics = latestInsight.metrics;
    const lowStockCount = lowStockProducts.length;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>RESUMEN DE NÚMEROS</Text>

        <View style={styles.metricsGrid}>
          {/* Ventas */}
          <View style={styles.metricCard}>
            <View
              style={[
                styles.metricIconContainer,
                { backgroundColor: '#E8F5E9' },
              ]}
            >
              <Ionicons name="trending-up" size={24} color="#00D2FF" />
            </View>
            <Text style={styles.metricValue}>
              {formatCurrency(metrics.total_sales || 0)}
            </Text>
            <Text style={styles.metricLabel}>Ventas</Text>
          </View>

          {/* Gastos */}
          <View style={styles.metricCard}>
            <View
              style={[
                styles.metricIconContainer,
                { backgroundColor: '#FFEBEE' },
              ]}
            >
              <Ionicons name="trending-down" size={24} color="#F44336" />
            </View>
            <Text style={styles.metricValue}>
              {formatCurrency(metrics.total_expenses || 0)}
            </Text>
            <Text style={styles.metricLabel}>Gastos</Text>
          </View>

          {/* Balance */}
          <View style={styles.metricCard}>
            <View
              style={[
                styles.metricIconContainer,
                { backgroundColor: '#E3F2FD' },
              ]}
            >
              <Ionicons name="wallet" size={24} color="#2196F3" />
            </View>
            <Text style={styles.metricValue}>
              {formatCurrency(metrics.balance || 0)}
            </Text>
            <Text style={styles.metricLabel}>Balance</Text>
          </View>

          {/* Margen */}
          <View style={styles.metricCard}>
            <View
              style={[
                styles.metricIconContainer,
                { backgroundColor: '#FFF3E0' },
              ]}
            >
              <Ionicons name="pulse" size={24} color="#FF9800" />
            </View>
            <Text style={styles.metricValue}>
              {(metrics.margin || 0).toFixed(1)}%
            </Text>
            <Text style={styles.metricLabel}>Margen</Text>
          </View>
        </View>

        {/* Top Products */}
        {metrics.top_products && metrics.top_products.length > 0 && (
          <View style={styles.topProductsContainer}>
            <Text style={styles.subsectionLabel}>PRODUCTOS ESTRELLA</Text>
            {metrics.top_products.slice(0, 3).map((product: any, index: number) => (
              <View key={index} style={styles.topProductCard}>
                <View
                  style={[
                    styles.rankBadge,
                    {
                      backgroundColor:
                        index === 0
                          ? '#FFD700'
                          : index === 1
                          ? '#C0C0C0'
                          : '#CD7F32',
                    },
                  ]}
                >
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.topProductInfo}>
                  <Text style={styles.topProductName}>{product.name}</Text>
                  <Text style={styles.topProductStats}>
                    {product.quantity} vendidos • {formatCurrency(product.revenue || 0)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Low Stock Alert - CLICKEABLE */}
        {lowStockCount > 0 && (
          <TouchableOpacity
            style={styles.alertBox}
            onPress={navigateToInventory}
            activeOpacity={0.7}
          >
            <Ionicons name="warning" size={20} color="#FF9800" />
            <Text style={styles.alertText}>
              {lowStockCount} producto{lowStockCount !== 1 ? 's' : ''} con stock bajo
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#FF9800" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderInsights = () => {
    if (!latestInsight?.insights) return null;

    const insightsText = latestInsight.insights;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ANÁLISIS INTELIGENTE</Text>
        <View style={styles.insightsCard}>
          <View style={styles.insightsHeader}>
            <Ionicons name="sparkles" size={20} color="#9C27B0" />
            <Text style={styles.insightsHeaderText}>IA de Negocio</Text>
          </View>
          <Text style={styles.insightsText}>{insightsText}</Text>
        </View>
      </View>
    );
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
          <ActivityIndicator size="large" color="#9C27B0" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
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
          onPress={openHistory}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="time-outline" size={24} color="#212121" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#9C27B0"
            colors={['#9C27B0']}
          />
        }
      >
        {/* Date Filter */}
        <View style={styles.dateFilterContainer}>
          <Text style={styles.dateFilterLabel}>PERÍODO</Text>
          <View style={styles.dateFilterRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={16} color="#757575" />
              <Text style={styles.dateButtonText}>{formatShortDate(startDate)}</Text>
            </TouchableOpacity>

            <View style={styles.dateSeparator}>
              <Ionicons name="arrow-forward" size={16} color="#BDBDBD" />
            </View>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={16} color="#757575" />
              <Text style={styles.dateButtonText}>{formatShortDate(endDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!latestInsight ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="analytics-outline" size={64} color="#9E9E9E" />
            </View>
            <Text style={styles.emptyTitle}>No hay reportes aún</Text>
            <Text style={styles.emptyText}>
              Genera tu primer análisis inteligente del negocio y descubre cómo
              mejorar tus ventas
            </Text>
          </View>
        ) : (
          <>
            {/* Date Badge */}
            <View style={styles.dateBadge}>
              <Ionicons name="calendar" size={16} color="#757575" />
              <Text style={styles.dateText}>
                {formatDate(latestInsight.generated_at)}
              </Text>
            </View>

            {renderMetrics()}
            {renderInsights()}
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.generateButton,
              generating && styles.buttonDisabled,
            ]}
            onPress={generateNewInsight}
            disabled={generating}
            activeOpacity={0.8}
          >
            {generating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>
                  {latestInsight ? 'Generar Nuevo Reporte' : 'Generar Reporte'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {latestInsight && (
            <TouchableOpacity
              style={[styles.whatsappButton, sending && styles.buttonDisabled]}
              onPress={sendToWhatsApp}
              disabled={sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
                  <Text style={styles.whatsappButtonText}>
                    Enviar por WhatsApp
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}

      {/* History Modal */}
      <Modal visible={showHistory} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Historial de Reportes</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            {loadingHistory ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#9C27B0" />
              </View>
            ) : (
              <ScrollView style={styles.historyList}>
                {historyReports.map((report, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.historyItem}
                    onPress={() => viewHistoricalReport(report)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.historyItemIcon}>
                      <Ionicons name="document-text" size={24} color="#9C27B0" />
                    </View>
                    <View style={styles.historyItemInfo}>
                      <Text style={styles.historyItemDate}>
                        {formatDate(report.generated_at)}
                      </Text>
                      <Text style={styles.historyItemStats}>
                        Ventas: {formatCurrency(report.metrics?.total_sales || 0)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9E9E9E',
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },

  // Date Filter
  dateFilterContainer: {
    marginBottom: 20,
  },
  dateFilterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  dateSeparator: {
    paddingHorizontal: 4,
  },

  // Date Badge
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#757575',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#757575',
  },

  // Top Products
  topProductsContainer: {
    marginTop: 8,
  },
  subsectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9E9E9E',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  topProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topProductInfo: {
    flex: 1,
  },
  topProductName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  topProductStats: {
    fontSize: 13,
    fontWeight: '400',
    color: '#757575',
  },

  // Alert Box - CLICKEABLE
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#E65100',
  },

  // Insights
  insightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  insightsHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9C27B0',
  },
  insightsText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#424242',
    lineHeight: 24,
  },

  // Empty State
  emptyState: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },

  // Buttons
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9C27B0',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  whatsappButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  modalLoading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  historyList: {
    paddingHorizontal: 24,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  historyItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyItemInfo: {
    flex: 1,
  },
  historyItemDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  historyItemStats: {
    fontSize: 13,
    fontWeight: '400',
    color: '#757575',
  },
});
