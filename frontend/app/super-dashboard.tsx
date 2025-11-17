import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const SUPER_ADMIN_TOKEN_KEY = '@super_admin_token';

type Period = '30d' | '7d' | 'today' | 'this_month' | 'last_month';

interface KPIData {
  period: {
    start: string;
    end: string;
  };
  active_merchants: {
    count: number;
    merchants: any[];
  };
  new_merchants: {
    count: number;
    previous_count?: number;
    change_percentage?: number;
    merchants: any[];
  };
  active_clerks: {
    count: number;
    new_count: number;
    existing_count: number;
    clerks: any[];
  };
  feature_usage: {
    most_used: any[];
    least_used: any[];
    by_section: any;
  };
  churn: {
    merchants: {
      churned_count: number;
      total_previous: number;
      churn_rate: number;
      details: any[];
    };
    clerks: {
      churned_count: number;
      total_previous: number;
      churn_rate: number;
      details: any[];
    };
  };
  hierarchy: {
    total_admins: number;
    total_merchants: number;
    total_clerks: number;
    merchants_per_admin: number;
    clerks_per_merchant: number;
  };
}

export default function SuperDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('30d');

  useEffect(() => {
    loadKPIData();
  }, [selectedPeriod]);

  const loadKPIData = async () => {
    try {
      const response = await api.get(`/api/dashboard/kpis?period=${selectedPeriod}`);
      setKpiData(response.data);
    } catch (error) {
      console.error('Error loading KPI data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadKPIData();
  };

  const getPeriodLabel = (period: Period): string => {
    const labels: Record<Period, string> = {
      '30d': 'Últimos 30 días',
      '7d': 'Últimos 7 días',
      today: 'Hoy',
      this_month: 'Este mes',
      last_month: 'Mes pasado',
    };
    return labels[period];
  };

  const renderPeriodFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersTitle}>Período:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(['30d', '7d', 'today', 'this_month', 'last_month'] as Period[]).map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.filterButton, selectedPeriod === period && styles.filterButtonActive]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[styles.filterButtonText, selectedPeriod === period && styles.filterButtonTextActive]}
            >
              {getPeriodLabel(period)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderKPICard = (
    title: string,
    value: number | string,
    icon: keyof typeof Ionicons.glyphMap,
    color: string,
    subtitle?: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={[styles.kpiCard, { borderLeftColor: color }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.kpiCardHeader}>
        <Ionicons name={icon} size={28} color={color} />
        <Text style={styles.kpiCardTitle}>{title}</Text>
      </View>
      <Text style={styles.kpiCardValue}>{value}</Text>
      {subtitle && <Text style={styles.kpiCardSubtitle}>{subtitle}</Text>}
      {onPress && (
        <View style={styles.kpiCardArrow}>
          <Ionicons name="chevron-forward" size={16} color="#999" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFeatureUsage = () => {
    if (!kpiData) return null;

    const mostUsed = kpiData.feature_usage.most_used.slice(0, 5);
    const leastUsed = kpiData.feature_usage.least_used.slice(0, 5);

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

    return (
      <View style={styles.featureUsageContainer}>
        <Text style={styles.sectionTitle}>📊 Uso de Features</Text>
        
        <View style={styles.featureUsageRow}>
          {/* Most Used */}
          <View style={styles.featureUsageColumn}>
            <Text style={styles.featureUsageColumnTitle}>✅ Más Usadas (Top 5)</Text>
            {mostUsed.map((item, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureItemName}>{getSectionName(item.section)}</Text>
                <Text style={styles.featureItemValue}>{item.visits} visitas</Text>
              </View>
            ))}
          </View>

          {/* Least Used */}
          <View style={styles.featureUsageColumn}>
            <Text style={styles.featureUsageColumnTitle}>⚠️ Menos Usadas (Bottom 5)</Text>
            {leastUsed.length > 0 ? (
              leastUsed.map((item, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureItemName}>{getSectionName(item.section)}</Text>
                  <Text style={styles.featureItemValue}>{item.visits} visitas</Text>
                </View>
              ))
            ) : (
              <Text style={styles.featureItemEmpty}>Todas las features están siendo usadas</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderChurnSection = () => {
    if (!kpiData) return null;

    const merchantChurn = kpiData.churn.merchants;
    const clerkChurn = kpiData.churn.clerks;

    const getChurnColor = (rate: number): string => {
      if (rate === 0) return '#4CAF50';
      if (rate < 10) return '#FF9800';
      return '#F44336';
    };

    return (
      <View style={styles.churnContainer}>
        <Text style={styles.sectionTitle}>📉 Tasa de Churn</Text>
        <View style={styles.churnRow}>
          <View style={[styles.churnCard, { borderLeftColor: getChurnColor(merchantChurn.churn_rate) }]}>
            <Text style={styles.churnCardLabel}>Merchants</Text>
            <Text style={[styles.churnCardValue, { color: getChurnColor(merchantChurn.churn_rate) }]}>
              {merchantChurn.churn_rate}%
            </Text>
            <Text style={styles.churnCardDetail}>
              {merchantChurn.churned_count} de {merchantChurn.total_previous} churned
            </Text>
          </View>

          <View style={[styles.churnCard, { borderLeftColor: getChurnColor(clerkChurn.churn_rate) }]}>
            <Text style={styles.churnCardLabel}>Clerks</Text>
            <Text style={[styles.churnCardValue, { color: getChurnColor(clerkChurn.churn_rate) }]}>
              {clerkChurn.churn_rate}%
            </Text>
            <Text style={styles.churnCardDetail}>
              {clerkChurn.churned_count} de {clerkChurn.total_previous} churned
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHierarchy = () => {
    if (!kpiData) return null;

    const hierarchy = kpiData.hierarchy;

    return (
      <View style={styles.hierarchyContainer}>
        <Text style={styles.sectionTitle}>🏢 Jerarquía del Sistema</Text>
        <View style={styles.hierarchyRow}>
          <View style={styles.hierarchyCard}>
            <Ionicons name="business-outline" size={32} color="#2196F3" />
            <Text style={styles.hierarchyCardValue}>{hierarchy.total_admins}</Text>
            <Text style={styles.hierarchyCardLabel}>Admins</Text>
          </View>

          <View style={styles.hierarchyCard}>
            <Ionicons name="storefront-outline" size={32} color="#4CAF50" />
            <Text style={styles.hierarchyCardValue}>{hierarchy.total_merchants}</Text>
            <Text style={styles.hierarchyCardLabel}>Merchants</Text>
          </View>

          <View style={styles.hierarchyCard}>
            <Ionicons name="people-outline" size={32} color="#FF9800" />
            <Text style={styles.hierarchyCardValue}>{hierarchy.total_clerks}</Text>
            <Text style={styles.hierarchyCardLabel}>Clerks</Text>
          </View>
        </View>

        <View style={styles.hierarchyAverages}>
          <Text style={styles.hierarchyAverageText}>
            📊 {hierarchy.merchants_per_admin} merchants por admin
          </Text>
          <Text style={styles.hierarchyAverageText}>
            👥 {hierarchy.clerks_per_merchant} clerks por merchant
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Cargando KPIs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!kpiData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
          <Text style={styles.errorText}>Error al cargar datos</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadKPIData}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const changePercentage = kpiData.new_merchants.change_percentage || 0;
  const isPositiveChange = changePercentage >= 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Super Dashboard</Text>
          <Text style={styles.headerSubtitle}>KPIs y Métricas del Negocio</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Period Filters */}
        {renderPeriodFilters()}

        {/* Main KPI Cards */}
        <View style={styles.kpiGrid}>
          {renderKPICard(
            'Merchants Activos',
            kpiData.active_merchants.count,
            'storefront',
            '#4CAF50',
            'Con actividad en el período'
          )}

          {renderKPICard(
            'Merchants Nuevos',
            kpiData.new_merchants.count,
            'add-circle',
            '#2196F3',
            changePercentage !== 0
              ? `${isPositiveChange ? '+' : ''}${changePercentage.toFixed(1)}% vs período anterior`
              : undefined
          )}

          {renderKPICard(
            'Clerks Activos',
            kpiData.active_clerks.count,
            'people',
            '#FF9800',
            `${kpiData.active_clerks.new_count} nuevos, ${kpiData.active_clerks.existing_count} existentes`
          )}

          {renderKPICard(
            'Total Usuarios',
            kpiData.hierarchy.total_merchants + kpiData.hierarchy.total_clerks,
            'analytics',
            '#9C27B0',
            'Merchants + Clerks'
          )}
        </View>

        {/* Feature Usage */}
        {renderFeatureUsage()}

        {/* Churn Section */}
        {renderChurnSection()}

        {/* Hierarchy */}
        {renderHierarchy()}

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
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
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  filtersContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  kpiGrid: {
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    margin: '1%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  kpiCardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  kpiCardSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  kpiCardArrow: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  featureUsageContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureUsageRow: {
    flexDirection: 'row',
    gap: 16,
  },
  featureUsageColumn: {
    flex: 1,
  },
  featureUsageColumnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginBottom: 8,
  },
  featureItemName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  featureItemValue: {
    fontSize: 14,
    color: '#666',
  },
  featureItemEmpty: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  churnContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  churnRow: {
    flexDirection: 'row',
    gap: 16,
  },
  churnCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  churnCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  churnCardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  churnCardDetail: {
    fontSize: 12,
    color: '#999',
  },
  hierarchyContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hierarchyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  hierarchyCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  hierarchyCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  hierarchyCardLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  hierarchyAverages: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
  },
  hierarchyAverageText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});
