import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
  const [refreshing, setRefreshing] = useState(false);
  const [latestInsight, setLatestInsight] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Date range for filtering
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    fetchLatestInsight();
  }, []);

  const fetchLatestInsight = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/insights/latest');
      if (response.data.report) {
        setLatestInsight(response.data.report);
      }
    } catch (error: any) {
      console.error('Error fetching latest insight:', error);
      if (error.response?.status === 404) {
        // No hay reporte todavía
        setLatestInsight(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLatestInsight();
    setRefreshing(false);
  };

  const generateNewInsight = async () => {
    setGenerating(true);
    try {
      const response = await api.post(
        '/api/insights/generate',
        {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        },
        {
          timeout: 60000,
        }
      );
      
      const report = response.data;
      if (!report || !report.id) {
        throw new Error('Invalid report received');
      }
      
      showAlert(
        'Reporte Generado',
        'Tu reporte con IA ha sido generado exitosamente'
      );
      
      setLatestInsight(report);
    } catch (error: any) {
      console.error('Error generating insight:', error);
      const errorMessage = error.response?.status === 400 
        ? 'No hay suficientes datos para generar el reporte'
        : 'No se pudo generar el reporte. Intenta nuevamente.';
      
      showAlert('Error', errorMessage);
    } finally {
      setGenerating(false);
    }
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
        await api.post(
          '/api/insights/send-whatsapp',
          {},
          {
            timeout: 30000,
          }
        );
        
        console.log('WhatsApp send successful');
        showAlert('Enviado', 'Tu reporte fue enviado exitosamente a WhatsApp');
      } catch (error: any) {
        console.error('Error sending to WhatsApp:', error);
        showAlert('Error', 'No se pudo enviar el reporte por WhatsApp');
      } finally {
        setSending(false);
      }
    }, 50);
  };

  const navigateToInventory = () => {
    router.push('/products');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-EC', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await api.get('/api/insights/history?limit=10');
      setHistory(response.data.reports || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      showAlert('Error', 'No se pudo cargar el historial');
    } finally {
      setLoadingHistory(false);
    }
  };

  const openHistory = () => {
    fetchHistory();
    setHistoryVisible(true);
  };

  const viewHistoryReport = (report: any) => {
    setLatestInsight(report);
    setHistoryVisible(false);
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
          <ActivityIndicator size="large" color="#00D2FF" />
          <Text style={styles.loadingText}>Cargando reporte...</Text>
        </View>
      </View>
    );
  }

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
        <TouchableOpacity
          onPress={openHistory}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="time-outline" size={24} color="#212121" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00D2FF']} />
        }
      >
        {latestInsight ? (
          <View style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Ionicons name="analytics" size={32} color="#00D2FF" />
              <View style={styles.reportHeaderText}>
                <Text style={styles.reportTitle}>Reporte con IA</Text>
                <Text style={styles.reportDate}>
                  {formatDate(latestInsight.created_at)}
                </Text>
              </View>
            </View>

            <View style={styles.reportContent}>
              <Text style={styles.reportText}>{latestInsight.report_text}</Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.whatsappButton]}
                onPress={sendToWhatsApp}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="logo-whatsapp" size={20} color="#FFF" />
                    <Text style={styles.actionButtonText}>Enviar por WhatsApp</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={64} color="#BDBDBD" />
            <Text style={styles.emptyText}>No hay reportes disponibles</Text>
            <Text style={styles.emptySubtext}>
              Genera tu primer reporte con IA
            </Text>
          </View>
        )}

        <View style={styles.dateRangeCard}>
          <Text style={styles.sectionTitle}>Generar Nuevo Reporte</Text>
          <Text style={styles.sectionSubtitle}>
            Selecciona el rango de fechas para analizar
          </Text>

          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Desde:</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {startDate.toLocaleDateString('es-EC')}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#00D2FF" />
              </TouchableOpacity>
            </View>

            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Hasta:</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {endDate.toLocaleDateString('es-EC')}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#00D2FF" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.generateButton,
              generating && styles.generateButtonDisabled,
            ]}
            onPress={generateNewInsight}
            disabled={generating}
          >
            {generating ? (
              <>
                <ActivityIndicator color="#FFF" size="small" />
                <Text style={styles.generateButtonText}>Generando...</Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#FFF" />
                <Text style={styles.generateButtonText}>Generar con IA</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

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
      </ScrollView>

      <Modal
        visible={historyVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHistoryVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Historial de Reportes</Text>
              <TouchableOpacity onPress={() => setHistoryVisible(false)}>
                <Ionicons name="close" size={28} color="#212121" />
              </TouchableOpacity>
            </View>

            {loadingHistory ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00D2FF" />
              </View>
            ) : history.length > 0 ? (
              <ScrollView style={styles.historyList}>
                {history.map((report, index) => (
                  <TouchableOpacity
                    key={report.id || index}
                    style={styles.historyItem}
                    onPress={() => viewHistoryReport(report)}
                  >
                    <Ionicons name="document-text" size={24} color="#00D2FF" />
                    <View style={styles.historyItemContent}>
                      <Text style={styles.historyItemDate}>
                        {formatDate(report.created_at)}
                      </Text>
                      <Text style={styles.historyItemText} numberOfLines={2}>
                        {report.report_text}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No hay reportes en el historial</Text>
              </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#757575',
  },
  reportCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  reportDate: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  reportContent: {
    marginBottom: 16,
  },
  reportText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#424242',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#757575',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 8,
  },
  dateRangeCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '500',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D2FF',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  historyItemText: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
});
