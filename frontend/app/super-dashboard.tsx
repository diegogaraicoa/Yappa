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
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const SUPER_ADMIN_TOKEN_KEY = '@super_admin_token';

type Period = '30d' | '7d' | 'today' | 'this_month' | 'last_month' | 'custom';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Custom date range states
  const [showDateModal, setShowDateModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [appliedCustomDates, setAppliedCustomDates] = useState<{start: string, end: string} | null>(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadKPIData();
    }
  }, [selectedPeriod, isAuthenticated]);

  const checkAuthentication = async () => {
    try {
      const token = await AsyncStorage.getItem(SUPER_ADMIN_TOKEN_KEY);
      if (!token) {
        router.replace('/super-admin-login');
        return;
      }
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error checking auth:', error);
      router.replace('/super-admin-login');
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = confirm('¿Estás seguro de que deseas cerrar sesión?');
      if (confirmed) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Cerrar sesión',
        '¿Estás seguro de que deseas cerrar sesión?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cerrar sesión',
            style: 'destructive',
            onPress: performLogout,
          },
        ]
      );
    }
  };

  const performLogout = async () => {
    try {
      await AsyncStorage.removeItem(SUPER_ADMIN_TOKEN_KEY);
      await AsyncStorage.removeItem('@super_admin_email');
      setIsAuthenticated(false);
      router.push('/super-admin-login');
    } catch (error) {
      console.error('Error logging out:', error);
      if (Platform.OS === 'web') {
        alert('No se pudo cerrar sesión');
      } else {
        Alert.alert('Error', 'No se pudo cerrar sesión');
      }
    }
  };

  const loadKPIData = async () => {
    try {
      let url = `/api/dashboard/kpis?period=${selectedPeriod}`;
      
      // If custom period is selected and dates are set, add them to the URL
      if (selectedPeriod === 'custom' && appliedCustomDates) {
        url = `/api/dashboard/kpis?period=custom&start_date=${appliedCustomDates.start}&end_date=${appliedCustomDates.end}`;
      }
      
      const response = await api.get(url);
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
    if (period === 'custom' && appliedCustomDates) {
      return `${appliedCustomDates.start} - ${appliedCustomDates.end}`;
    }
    const labels: Record<Period, string> = {
      '30d': 'Últimos 30 días',
      '7d': 'Últimos 7 días',
      today: 'Hoy',
      this_month: 'Este mes',
      last_month: 'Mes pasado',
      custom: 'Personalizado',
    };
    return labels[period];
  };

  const formatDateShort = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const handleSelectCustomPeriod = () => {
    // Pre-fill with default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setCustomStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setCustomEndDate(today.toISOString().split('T')[0]);
    setShowDateModal(true);
  };

  const handleApplyCustomDates = () => {
    if (!customStartDate || !customEndDate) {
      alert('❌ Error: Selecciona ambas fechas');
      return;
    }
    
    if (new Date(customStartDate) > new Date(customEndDate)) {
      alert('❌ Error: La fecha de inicio debe ser anterior a la fecha de fin');
      return;
    }
    
    setAppliedCustomDates({ start: customStartDate, end: customEndDate });
    setSelectedPeriod('custom');
    setShowDateModal(false);
  };

  const renderDatePickerModal = () => (
    <Modal
      visible={showDateModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowDateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.dateModalContent}>
          <View style={styles.dateModalHeader}>
            <Text style={styles.dateModalTitle}>📅 Seleccionar Rango de Fechas</Text>
            <TouchableOpacity onPress={() => setShowDateModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.dateModalBody}>
            <Text style={styles.dateLabel}>Fecha de Inicio</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: 12,
                  fontSize: 16,
                  borderRadius: 8,
                  border: '1px solid #E0E0E0',
                  marginBottom: 16,
                }}
              />
            ) : (
              <TextInput
                style={styles.dateInput}
                value={customStartDate}
                onChangeText={setCustomStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            )}
            
            <Text style={styles.dateLabel}>Fecha de Fin</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: 12,
                  fontSize: 16,
                  borderRadius: 8,
                  border: '1px solid #E0E0E0',
                  marginBottom: 16,
                }}
              />
            ) : (
              <TextInput
                style={styles.dateInput}
                value={customEndDate}
                onChangeText={setCustomEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            )}
          </View>
          
          <View style={styles.dateModalFooter}>
            <TouchableOpacity
              style={[styles.dateModalButton, styles.cancelButton]}
              onPress={() => setShowDateModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateModalButton, styles.applyButton]}
              onPress={handleApplyCustomDates}
            >
              <Ionicons name="checkmark" size={20} color="#FFF" />
              <Text style={styles.applyButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderPeriodFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersTitle}>Período:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(['30d', '7d', 'today', 'this_month', 'last_month'] as Period[]).map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.filterButton, selectedPeriod === period && styles.filterButtonActive]}
            onPress={() => {
              setSelectedPeriod(period);
              setAppliedCustomDates(null);
            }}
          >
            <Text
              style={[styles.filterButtonText, selectedPeriod === period && styles.filterButtonTextActive]}
            >
              {getPeriodLabel(period)}
            </Text>
          </TouchableOpacity>
        ))}
        
        {/* Custom Date Range Button */}
        <TouchableOpacity
          style={[
            styles.filterButton, 
            styles.customDateButton,
            selectedPeriod === 'custom' && styles.filterButtonActive
          ]}
          onPress={handleSelectCustomPeriod}
        >
          <Ionicons 
            name="calendar" 
            size={16} 
            color={selectedPeriod === 'custom' ? '#FFF' : '#666'} 
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.filterButtonText, 
              selectedPeriod === 'custom' && styles.filterButtonTextActive
            ]}
          >
            {selectedPeriod === 'custom' && appliedCustomDates 
              ? `${appliedCustomDates.start} → ${appliedCustomDates.end}`
              : 'Personalizado'}
          </Text>
        </TouchableOpacity>
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
        export: 'Exportar CSV',
        ai_reports: 'Reportes IA',
      };
      return names[section] || section;
    };

    return (
      <View style={styles.featureUsageContainer}>
        <Text style={styles.sectionTitle}>📊 Uso de Features</Text>
        
        <View style={styles.featureUsageRow}>
          {/* Most Used */}
          <TouchableOpacity
            style={styles.featureUsageColumn}
            onPress={() => router.push(`/super-dashboard-features-most-used?period=${selectedPeriod}`)}
            activeOpacity={0.7}
          >
            <View style={styles.featureUsageColumnHeader}>
              <Text style={styles.featureUsageColumnTitle}>✅ Más Usadas (Top 5)</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </View>
            {mostUsed.map((item, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureItemName}>{getSectionName(item.section)}</Text>
                <Text style={styles.featureItemValue}>{item.visits} visitas</Text>
              </View>
            ))}
          </TouchableOpacity>

          {/* Least Used */}
          <TouchableOpacity
            style={styles.featureUsageColumn}
            onPress={() => router.push(`/super-dashboard-features-least-used?period=${selectedPeriod}`)}
            activeOpacity={0.7}
          >
            <View style={styles.featureUsageColumnHeader}>
              <Text style={styles.featureUsageColumnTitle}>⚠️ Menos Usadas (Bottom 5)</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </View>
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
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderChurnSection = () => {
    if (!kpiData) return null;

    const merchantChurn = kpiData.churn.merchants;
    const clerkChurn = kpiData.churn.clerks;

    const getChurnColor = (count: number): string => {
      if (count === 0) return '#00D2FF';
      if (count < 5) return '#FF9800';
      return '#F44336';
    };

    return (
      <View style={styles.churnContainer}>
        <Text style={styles.sectionTitle}>📉 Tasa de Churn</Text>
        <View style={styles.churnRow}>
          <TouchableOpacity
            style={[styles.churnCard, { borderLeftColor: getChurnColor(merchantChurn.churned_count) }]}
            onPress={() => router.push(`/super-dashboard-churn-merchants?period=${selectedPeriod}`)}
            activeOpacity={0.7}
          >
            <View style={styles.churnCardHeader}>
              <Text style={styles.churnCardLabel}>Merchants</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </View>
            <Text style={[styles.churnCardValue, { color: getChurnColor(merchantChurn.churned_count) }]}>
              {merchantChurn.churned_count}
            </Text>
            <Text style={styles.churnCardDetail}>
              {merchantChurn.churn_rate}% churn ({merchantChurn.churned_count} de {merchantChurn.total_previous})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.churnCard, { borderLeftColor: getChurnColor(clerkChurn.churned_count) }]}
            onPress={() => router.push(`/super-dashboard-churn-clerks?period=${selectedPeriod}`)}
            activeOpacity={0.7}
          >
            <View style={styles.churnCardHeader}>
              <Text style={styles.churnCardLabel}>Clerks</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </View>
            <Text style={[styles.churnCardValue, { color: getChurnColor(clerkChurn.churned_count) }]}>
              {clerkChurn.churned_count}
            </Text>
            <Text style={styles.churnCardDetail}>
              {clerkChurn.churn_rate}% churn ({clerkChurn.churned_count} de {clerkChurn.total_previous})
            </Text>
          </TouchableOpacity>
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
          <TouchableOpacity
            style={styles.hierarchyCard}
            onPress={() => router.push('/super-dashboard-admins')}
            activeOpacity={0.7}
          >
            <Ionicons name="business-outline" size={32} color="#2196F3" />
            <Text style={styles.hierarchyCardValue}>{hierarchy.total_admins}</Text>
            <Text style={styles.hierarchyCardLabel}>Admins</Text>
            <Ionicons name="chevron-forward" size={16} color="#999" style={styles.hierarchyCardArrow} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hierarchyCard}
            onPress={() => router.push('/super-dashboard-all-merchants')}
            activeOpacity={0.7}
          >
            <Ionicons name="storefront-outline" size={32} color="#00D2FF" />
            <Text style={styles.hierarchyCardValue}>{hierarchy.total_merchants}</Text>
            <Text style={styles.hierarchyCardLabel}>Merchants</Text>
            <Ionicons name="chevron-forward" size={16} color="#999" style={styles.hierarchyCardArrow} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hierarchyCard}
            onPress={() => router.push('/super-dashboard-all-clerks')}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={32} color="#FF9800" />
            <Text style={styles.hierarchyCardValue}>{hierarchy.total_clerks}</Text>
            <Text style={styles.hierarchyCardLabel}>Clerks</Text>
            <Ionicons name="chevron-forward" size={16} color="#999" style={styles.hierarchyCardArrow} />
          </TouchableOpacity>
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
          <ActivityIndicator size="large" color="#00D2FF" />
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
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Super Dashboard</Text>
          <Text style={styles.headerSubtitle}>KPIs y Métricas del Negocio</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.exploreDataButton} 
            onPress={() => router.push('/super-dashboard-ai-insights')}
          >
            <Ionicons name="sparkles" size={18} color="#FFF" />
            <Text style={styles.exploreDataButtonText}>Explore Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="#00D2FF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Period Filters */}
        {renderPeriodFilters()}

        {/* Period Info Card */}
        {kpiData?.period && (
          <View style={styles.periodInfoCard}>
            <Ionicons name="calendar-outline" size={18} color="#666" />
            <Text style={styles.periodInfoText}>
              {getPeriodLabel(selectedPeriod)}: {formatDateShort(kpiData.period.start)} - {formatDateShort(kpiData.period.end)}
            </Text>
          </View>
        )}

        {/* Main KPI Cards */}
        <View style={styles.kpiGrid}>
          {renderKPICard(
            'Merchants Activos',
            kpiData.active_merchants.count,
            'storefront',
            '#00D2FF',
            'Con actividad en el período',
            () => router.push(`/super-dashboard-merchants-active?period=${selectedPeriod}`)
          )}

          {renderKPICard(
            'Merchants Nuevos',
            kpiData.new_merchants.count,
            'add-circle',
            '#2196F3',
            changePercentage !== 0
              ? `${isPositiveChange ? '+' : ''}${changePercentage.toFixed(1)}% vs período anterior`
              : undefined,
            () => router.push(`/super-dashboard-merchants-new?period=${selectedPeriod}`)
          )}

          {renderKPICard(
            'Clerks Activos',
            kpiData.active_clerks.count,
            'people',
            '#FF9800',
            `${kpiData.active_clerks.new_count} nuevos, ${kpiData.active_clerks.existing_count} existentes`,
            () => router.push(`/super-dashboard-clerks-active?period=${selectedPeriod}`)
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
      
      {/* Custom Date Modal */}
      {renderDatePickerModal()}
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
    backgroundColor: '#00D2FF',
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
  headerTextContainer: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  adminOpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  adminOpsButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  exploreDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9C27B0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  exploreDataButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  refreshButton: {
    padding: 8,
  },
  logoutButton: {
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
  periodInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00D2FF',
  },
  periodInfoText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
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
    backgroundColor: '#00D2FF',
    borderColor: '#00D2FF',
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
  featureUsageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureUsageRow: {
    flexDirection: 'row',
    gap: 16,
  },
  featureUsageColumn: {
    flex: 1,
  },
  featureUsageColumnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureUsageColumnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
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
  churnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  churnCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  hierarchyHeaderButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  hierarchyCardArrow: {
    marginTop: 8,
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
  kybModuleCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kybModuleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kybModuleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  kybModuleContent: {
    flex: 1,
  },
  kybModuleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  kybModuleSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  // Custom Date Modal Styles
  customDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dateModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dateModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dateModalBody: {
    padding: 20,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  dateModalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  dateModalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  applyButton: {
    backgroundColor: '#00D2FF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
