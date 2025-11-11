import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

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

  useEffect(() => {
    loadLatestInsight();
  }, []);

  const loadLatestInsight = async () => {
    try {
      const response = await api.get('/api/insights/latest');
      setLatestInsight(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No insights yet
        setLatestInsight(null);
      } else {
        console.error('Error loading insights:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateNewInsight = async () => {
    setGenerating(true);
    try {
      const response = await api.post('/api/insights/generate');
      setLatestInsight(response.data);
      Alert.alert(
        '✅ Reporte Generado',
        'Tu análisis de negocio está listo. Revisa los datos abajo.'
      );
    } catch (error: any) {
      console.error('Error generating insight:', error);
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'No se pudo generar el reporte. Intenta de nuevo.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const sendToWhatsApp = async () => {
    setSending(true);
    try {
      // Aumentar timeout para WhatsApp (puede tardar varios segundos)
      const response = await api.post('/api/insights/send-whatsapp', {}, {
        timeout: 30000 // 30 segundos
      });
      
      Alert.alert(
        '✅ Enviado a WhatsApp',
        `Tu reporte fue enviado exitosamente a ${response.data.whatsapp_number}. Lo recibirás en unos segundos.`
      );
    } catch (error: any) {
      console.error('Error sending to WhatsApp:', error);
      
      // Si es timeout, el mensaje probablemente se envió de todos modos
      if (error.code === 'ECONNABORTED') {
        Alert.alert(
          '⏱️ Enviando...',
          'El mensaje está siendo enviado. Si no lo recibes en 1 minuto, intenta de nuevo.'
        );
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.detail || 'No se pudo enviar a WhatsApp. Verifica que tengas tu número configurado.'
        );
      }
    } finally {
      setSending(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLatestInsight();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-EC', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderMetrics = () => {
    if (!latestInsight?.metrics) return null;

    const metrics = latestInsight.metrics;

    return (
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>📊 Resumen de Números</Text>
        
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="trending-up" size={32} color="#4CAF50" />
            <Text style={styles.metricValue}>${metrics.total_sales?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.metricLabel}>Ventas Totales</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: '#FFEBEE' }]}>
            <Ionicons name="trending-down" size={32} color="#f44336" />
            <Text style={styles.metricValue}>${metrics.total_expenses?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.metricLabel}>Gastos Totales</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="wallet" size={32} color="#2196F3" />
            <Text style={styles.metricValue}>${metrics.balance?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.metricLabel}>Balance</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="pulse" size={32} color="#FF9800" />
            <Text style={styles.metricValue}>{metrics.margin?.toFixed(1) || '0'}%</Text>
            <Text style={styles.metricLabel}>Margen</Text>
          </View>
        </View>

        {metrics.top_products && metrics.top_products.length > 0 && (
          <View style={styles.topProductsSection}>
            <Text style={styles.subsectionTitle}>🏆 Productos Estrella</Text>
            {metrics.top_products.slice(0, 3).map((product: any, index: number) => (
              <View key={index} style={styles.topProductCard}>
                <View style={styles.topProductRank}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.topProductInfo}>
                  <Text style={styles.topProductName}>{product.name}</Text>
                  <Text style={styles.topProductStats}>
                    {product.quantity} vendidos • ${product.revenue?.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {metrics.low_stock_count > 0 && (
          <View style={styles.alertBox}>
            <Ionicons name="warning" size={24} color="#FF9800" />
            <Text style={styles.alertText}>
              Tienes {metrics.low_stock_count} producto{metrics.low_stock_count !== 1 ? 's' : ''} con stock bajo
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderInsights = () => {
    if (!latestInsight?.insights) return null;

    const insightsText = latestInsight.insights;

    return (
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>🤖 Análisis Inteligente</Text>
        <View style={styles.insightsCard}>
          <Text style={styles.insightsText}>{insightsText}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Mis Datos</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Mis Datos</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
        }
      >
        {!latestInsight ? (
          <View style={styles.emptyState}>
            <Ionicons name="analytics" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No hay reportes aún</Text>
            <Text style={styles.emptyText}>
              Genera tu primer análisis inteligente del negocio y descubre cómo mejorar tus ventas
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.dateHeader}>
              <Ionicons name="calendar" size={20} color="#666" />
              <Text style={styles.dateText}>
                Generado el {formatDate(latestInsight.generated_at)}
              </Text>
            </View>

            {renderMetrics()}
            {renderInsights()}
          </>
        )}

        <Pressable
          style={[styles.generateButton, generating && styles.buttonDisabled]}
          onPress={generateNewInsight}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="sparkles" size={24} color="#fff" />
              <Text style={styles.generateButtonText}>
                {latestInsight ? 'Generar Nuevo Reporte' : 'Generar Mi Primer Reporte'}
              </Text>
            </>
          )}
        </Pressable>

        {latestInsight && (
          <Pressable
            style={[styles.whatsappButton, sending && styles.buttonDisabled]}
            onPress={sendToWhatsApp}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-whatsapp" size={24} color="#fff" />
                <Text style={styles.whatsappButtonText}>Enviar por WhatsApp</Text>
              </>
            )}
          </Pressable>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="bulb" size={20} color="#FF9800" />
          <Text style={styles.infoText}>
            Los reportes se generan automáticamente cada semana (lunes) y cada mes.
            También puedes generarlos cuando quieras usando el botón de arriba.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  metricsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  topProductsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  topProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topProductRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  topProductInfo: {
    flex: 1,
  },
  topProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  topProductStats: {
    fontSize: 14,
    color: '#666',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  alertText: {
    fontSize: 14,
    color: '#E65100',
    marginLeft: 12,
    flex: 1,
  },
  insightsContainer: {
    marginBottom: 16,
  },
  insightsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightsText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  whatsappButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  infoText: {
    fontSize: 13,
    color: '#E65100',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});
