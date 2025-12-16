import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar } from 'react-native-calendars';
import api from '../../utils/api';
import { format } from 'date-fns';

interface Analytics {
  period_days: number;
  top_product: {
    id: string;
    name: string;
    units_sold: number;
    revenue: number;
  } | null;
  best_day: {
    day: string;
    day_number: number;
    total_sales: number;
  } | null;
  best_customer: {
    id: string;
    name: string;
    total_purchases: number;
    purchase_count: number;
  } | null;
  trend: {
    current_period: number;
    previous_period: number;
    percentage_change: number;
    direction: 'up' | 'down' | 'stable';
  };
  top_5_products: Array<{
    id: string;
    name: string;
    units_sold: number;
    revenue: number;
  }>;
  summary: {
    total_sales: number;
    total_revenue: number;
    average_sale: number;
  };
}

export default function BalanceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [balance, setBalance] = useState<any>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectingDate, setSelectingDate] = useState<'start' | 'end'>('start');
  const [activeTab, setActiveTab] = useState<'balance' | 'analytics'>('balance');

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = () => {
    loadBalance();
    loadSales();
    loadExpenses();
    loadAnalytics();
  };

  const loadBalance = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get('/api/balance', { params });
      setBalance(response.data);
    } catch (error) {
      console.log('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await api.get('/api/analytics/business?days=30');
      setAnalytics(response.data);
    } catch (error) {
      console.log('Error loading analytics:', error);
    }
  };

  const loadSales = async () => {
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get('/api/sales', { params });
      setSales(response.data.slice(0, 5));
    } catch (error) {
      console.log('Error loading sales:', error);
    }
  };

  const loadExpenses = async () => {
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get('/api/expenses', { params });
      setExpenses(response.data.slice(0, 5));
    } catch (error) {
      console.log('Error loading expenses:', error);
    }
  };

  const onRefresh = () => {
    loadData();
  };

  const handleDateSelect = (date: string) => {
    if (selectingDate === 'start') {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
    setShowDateModal(false);
  };

  const clearDates = () => {
    setStartDate('');
    setEndDate('');
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  if (!balance) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D2FF" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={onRefresh}
            tintColor="#00D2FF"
            colors={['#00D2FF']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>YAPPA</Text>
            <Text style={styles.screenTitle}>Mi Negocio</Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'balance' && styles.tabActive]}
            onPress={() => setActiveTab('balance')}
          >
            <Ionicons 
              name="wallet-outline" 
              size={18} 
              color={activeTab === 'balance' ? '#00D2FF' : '#9E9E9E'} 
            />
            <Text style={[styles.tabText, activeTab === 'balance' && styles.tabTextActive]}>
              Balance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'analytics' && styles.tabActive]}
            onPress={() => setActiveTab('analytics')}
          >
            <Ionicons 
              name="analytics-outline" 
              size={18} 
              color={activeTab === 'analytics' ? '#9C27B0' : '#9E9E9E'} 
            />
            <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActiveAnalytics]}>
              Analytics
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'balance' ? (
          <>
            {/* Filtros de Fecha */}
            <View style={styles.dateSection}>
              <Text style={styles.sectionLabel}>PERIODO</Text>
              <View style={styles.dateButtons}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setSelectingDate('start');
                    setShowDateModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={18} color="#757575" />
                  <Text style={styles.dateButtonText}>
                    {startDate ? format(new Date(startDate), 'dd/MM/yy') : 'Inicio'}
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.dateSeparator}>
                  <Ionicons name="remove" size={16} color="#BDBDBD" />
                </View>

                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setSelectingDate('end');
                    setShowDateModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={18} color="#757575" />
                  <Text style={styles.dateButtonText}>
                    {endDate ? format(new Date(endDate), 'dd/MM/yy') : 'Fin'}
                  </Text>
                </TouchableOpacity>

                {(startDate || endDate) && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearDates}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={20} color="#F44336" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>BALANCE TOTAL</Text>
              <Text style={[
                styles.balanceAmount, 
                balance.balance >= 0 ? styles.positive : styles.negative
              ]}>
                {formatCurrency(balance.balance)}
              </Text>
            </View>

            {/* Income/Expense Row */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, styles.incomeCard]}>
                <View style={styles.summaryIconContainer}>
                  <Ionicons name="arrow-down-circle" size={24} color="#4CAF50" />
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Ingresos</Text>
                  <Text style={[styles.summaryAmount, styles.positive]}>
                    {formatCurrency(balance.ingresos)}
                  </Text>
                </View>
              </View>
              <View style={[styles.summaryCard, styles.expenseCard]}>
                <View style={styles.summaryIconContainer}>
                  <Ionicons name="arrow-up-circle" size={24} color="#F44336" />
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Egresos</Text>
                  <Text style={[styles.summaryAmount, styles.negative]}>
                    {formatCurrency(balance.egresos)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{balance.resumen_ingresos?.numero_ventas || 0}</Text>
                <Text style={styles.statLabel}>Ventas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{balance.resumen_egresos?.numero_gastos || 0}</Text>
                <Text style={styles.statLabel}>Gastos</Text>
              </View>
            </View>
          </>
        ) : (
          /* Analytics Tab Content */
          <>
            {/* Analytics Period */}
            <View style={styles.analyticsPeriod}>
              <Ionicons name="calendar" size={16} color="#9C27B0" />
              <Text style={styles.analyticsPeriodText}>Últimos 30 días</Text>
            </View>

            {/* Trend Card */}
            {analytics?.trend && (
              <View style={styles.trendCard}>
                <View style={styles.trendHeader}>
                  <Text style={styles.trendTitle}>Tendencia de Ventas</Text>
                  <View style={[
                    styles.trendBadge,
                    analytics.trend.direction === 'up' ? styles.trendUp : 
                    analytics.trend.direction === 'down' ? styles.trendDown : styles.trendStable
                  ]}>
                    <Ionicons 
                      name={analytics.trend.direction === 'up' ? 'trending-up' : 
                            analytics.trend.direction === 'down' ? 'trending-down' : 'remove'}
                      size={14} 
                      color="#FFF" 
                    />
                    <Text style={styles.trendBadgeText}>
                      {analytics.trend.percentage_change > 0 ? '+' : ''}{analytics.trend.percentage_change}%
                    </Text>
                  </View>
                </View>
                <Text style={styles.trendSubtitle}>vs período anterior</Text>
              </View>
            )}

            {/* Analytics Cards Grid */}
            <View style={styles.analyticsGrid}>
              {/* Top Product */}
              <View style={styles.analyticsCard}>
                <View style={[styles.analyticsIconBg, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="trophy" size={20} color="#2196F3" />
                </View>
                <Text style={styles.analyticsCardLabel}>Producto Estrella</Text>
                <Text style={styles.analyticsCardValue} numberOfLines={1}>
                  {analytics?.top_product?.name || 'Sin datos'}
                </Text>
                {analytics?.top_product && (
                  <Text style={styles.analyticsCardSubtext}>
                    {analytics.top_product.units_sold} unidades
                  </Text>
                )}
              </View>

              {/* Best Day */}
              <View style={styles.analyticsCard}>
                <View style={[styles.analyticsIconBg, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="sunny" size={20} color="#FF9800" />
                </View>
                <Text style={styles.analyticsCardLabel}>Mejor Día</Text>
                <Text style={styles.analyticsCardValue}>
                  {analytics?.best_day?.day || 'Sin datos'}
                </Text>
                {analytics?.best_day && (
                  <Text style={styles.analyticsCardSubtext}>
                    {formatCurrency(analytics.best_day.total_sales)}
                  </Text>
                )}
              </View>

              {/* Best Customer */}
              <View style={styles.analyticsCard}>
                <View style={[styles.analyticsIconBg, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="person" size={20} color="#4CAF50" />
                </View>
                <Text style={styles.analyticsCardLabel}>Mejor Cliente</Text>
                <Text style={styles.analyticsCardValue} numberOfLines={1}>
                  {analytics?.best_customer?.name || 'Sin datos'}
                </Text>
                {analytics?.best_customer && (
                  <Text style={styles.analyticsCardSubtext}>
                    {analytics.best_customer.purchase_count} compras
                  </Text>
                )}
              </View>

              {/* Average Sale */}
              <View style={styles.analyticsCard}>
                <View style={[styles.analyticsIconBg, { backgroundColor: '#F3E5F5' }]}>
                  <Ionicons name="cash" size={20} color="#9C27B0" />
                </View>
                <Text style={styles.analyticsCardLabel}>Ticket Promedio</Text>
                <Text style={styles.analyticsCardValue}>
                  {formatCurrency(analytics?.summary?.average_sale || 0)}
                </Text>
                <Text style={styles.analyticsCardSubtext}>
                  por venta
                </Text>
              </View>
            </View>

            {/* Top 5 Products */}
            {analytics?.top_5_products && analytics.top_5_products.length > 0 && (
              <View style={styles.topProductsSection}>
                <Text style={styles.sectionTitle}>🏆 Top 5 Productos</Text>
                {analytics.top_5_products.map((product, index) => (
                  <View key={product.id} style={styles.topProductRow}>
                    <View style={styles.topProductRank}>
                      <Text style={styles.topProductRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.topProductInfo}>
                      <Text style={styles.topProductName} numberOfLines={1}>{product.name}</Text>
                      <Text style={styles.topProductUnits}>{product.units_sold} unidades</Text>
                    </View>
                    <Text style={styles.topProductRevenue}>
                      {formatCurrency(product.revenue)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Summary Stats */}
            <View style={styles.summaryStats}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{analytics?.summary?.total_sales || 0}</Text>
                <Text style={styles.summaryStatLabel}>Ventas Totales</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>
                  {formatCurrency(analytics?.summary?.total_revenue || 0)}
                </Text>
                <Text style={styles.summaryStatLabel}>Ingresos Totales</Text>
              </View>
            </View>

            {/* Empty State */}
            {(!analytics?.top_product && !analytics?.best_customer) && (
              <View style={styles.emptyAnalytics}>
                <Ionicons name="analytics-outline" size={48} color="#E0E0E0" />
                <Text style={styles.emptyTitle}>Sin datos suficientes</Text>
                <Text style={styles.emptyText}>
                  Registra ventas para ver los analytics de tu negocio
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date Modal */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectingDate === 'start' ? 'Fecha Inicio' : 'Fecha Fin'}
              </Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <Ionicons name="close" size={24} color="#424242" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={(day: any) => handleDateSelect(day.dateString)}
              markedDates={{
                [startDate]: { selected: true, selectedColor: '#00D2FF' },
                [endDate]: { selected: true, selectedColor: '#00D2FF' },
              }}
              theme={{
                selectedDayBackgroundColor: '#00D2FF',
                todayTextColor: '#00D2FF',
                arrowColor: '#00D2FF',
              }}
            />
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
  scrollContent: {
    paddingBottom: 20,
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

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  appName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00D2FF',
    letterSpacing: 1,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212121',
    marginTop: 4,
  },

  // Tab Selector
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9E9E9E',
  },
  tabTextActive: {
    color: '#00D2FF',
    fontWeight: '600',
  },
  tabTextActiveAnalytics: {
    color: '#9C27B0',
    fontWeight: '600',
  },

  // Date Section
  dateSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
    letterSpacing: 1,
    marginBottom: 8,
  },
  dateButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#424242',
  },
  dateSeparator: {
    marginHorizontal: 8,
  },
  clearButton: {
    marginLeft: 12,
  },

  // Balance Card
  balanceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    marginTop: 8,
  },
  positive: {
    color: '#4CAF50',
  },
  negative: {
    color: '#F44336',
  },

  // Summary Row
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  incomeCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  expenseCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#757575',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },

  // Analytics Tab
  analyticsPeriod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    marginBottom: 8,
  },
  analyticsPeriodText: {
    fontSize: 14,
    color: '#9C27B0',
    fontWeight: '500',
  },

  // Trend Card
  trendCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendUp: {
    backgroundColor: '#4CAF50',
  },
  trendDown: {
    backgroundColor: '#F44336',
  },
  trendStable: {
    backgroundColor: '#9E9E9E',
  },
  trendBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  trendSubtitle: {
    fontSize: 13,
    color: '#757575',
    marginTop: 4,
  },

  // Analytics Grid
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  analyticsCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 4,
  },
  analyticsIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  analyticsCardLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  analyticsCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  analyticsCardSubtext: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 2,
  },

  // Top Products Section
  topProductsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
  },
  topProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  topProductRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topProductRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#757575',
  },
  topProductInfo: {
    flex: 1,
  },
  topProductName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  topProductUnits: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  topProductRevenue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },

  // Summary Stats
  summaryStats: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },

  // Empty State
  emptyAnalytics: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#424242',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginTop: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
});
