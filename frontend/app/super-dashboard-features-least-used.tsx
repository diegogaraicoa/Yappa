import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../utils/api';

export default function FeaturesLeastUsedScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/api/dashboard/feature-usage-detail?period=30d');
      setFeatures(response.data.least_used || []);
    } catch (error) {
      console.error('Error loading features:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSectionName = (section: string): string => {
    const names: Record<string, string> = {
      sales: 'Ventas',
      expenses: 'Gastos',
      inventory: 'Inventario',
      customers: 'Clientes',
      suppliers: 'Proveedores',
      reports: 'Reportes',
      insights: 'Insights',
      whatsapp: 'WhatsApp AI',
      training: 'Capacitación',
      dashboard: 'Dashboard',
    };
    return names[section] || section;
  };

  const getIconName = (section: string): any => {
    const icons: Record<string, any> = {
      sales: 'cash',
      expenses: 'card',
      inventory: 'cube',
      customers: 'people',
      suppliers: 'business',
      reports: 'document-text',
      insights: 'analytics',
      whatsapp: 'logo-whatsapp',
      training: 'school',
      dashboard: 'grid',
    };
    return icons[section] || 'ellipse';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={styles.loadingText}>Cargando...</Text>
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
          <Text style={styles.headerTitle}>⚠️ Features Menos Usadas</Text>
          <Text style={styles.headerSubtitle}>Bottom {features.length} features</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#FF9800" />
        <Text style={styles.infoText}>
          Estas features tienen baja adopción. Considera mejorar el onboarding o la visibilidad.
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {features.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="happy-outline" size={64} color="#00D2FF" />
            <Text style={styles.emptyText}>¡Excelente!</Text>
            <Text style={styles.emptySubtext}>Todas las features están siendo usadas</Text>
          </View>
        ) : (
          features.map((feature: any, index: number) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Ionicons name={getIconName(feature.section)} size={28} color="#FF9800" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{getSectionName(feature.section)}</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Ionicons name="eye" size={14} color="#666" />
                      <Text style={styles.statText}>{feature.visits} visitas</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="people" size={14} color="#666" />
                      <Text style={styles.statText}>{feature.unique_merchants} merchants</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.warningBadge}>
                  <Ionicons name="warning" size={20} color="#FFF" />
                </View>
              </View>

              {feature.merchants_breakdown && feature.merchants_breakdown.length > 0 && (
                <View style={styles.breakdown}>
                  <Text style={styles.breakdownTitle}>Merchants que lo usan:</Text>
                  {feature.merchants_breakdown.slice(0, 5).map((merchant: any, mIndex: number) => (
                    <View key={mIndex} style={styles.breakdownItem}>
                      <Text style={styles.merchantName} numberOfLines={1}>
                        {merchant.merchant_nombre}
                      </Text>
                      <Text style={styles.merchantVisits}>{merchant.visits} visitas</Text>
                    </View>
                  ))}
                  {feature.merchants_breakdown.length > 5 && (
                    <Text style={styles.moreText}>
                      +{feature.merchants_breakdown.length - 5} merchants más
                    </Text>
                  )}
                </View>
              )}

              {(!feature.merchants_breakdown || feature.merchants_breakdown.length === 0) && (
                <View style={styles.noUsageContainer}>
                  <Ionicons name="alert-circle-outline" size={24} color="#F44336" />
                  <Text style={styles.noUsageText}>Ningún merchant usa esta feature</Text>
                </View>
              )}
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00D2FF',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  warningBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginBottom: 6,
  },
  merchantName: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    marginRight: 8,
  },
  merchantVisits: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  moreText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  noUsageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    marginTop: 12,
  },
  noUsageText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
    marginLeft: 8,
  },
});