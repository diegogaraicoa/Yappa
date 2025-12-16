import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import { useFocusEffect } from '@react-navigation/native';
import FloatingHelpButton from '../../components/FloatingHelpButton';
import AIInsightCard from '../../components/AIInsightCard';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceData, setBalanceData] = useState({
    income: 0,
    expenses: 0,
    balance: 0,
  });
  const [todayStats, setTodayStats] = useState({
    sales: 0,
    salesCount: 0,
    expenses: 0,
    expensesCount: 0,
  });

  const fetchBalanceData = async () => {
    try {
      const response = await api.get('/api/balance');
      const data = response.data;
      setBalanceData({
        income: data.ingresos || data.total_income || 0,
        expenses: data.egresos || data.total_expenses || 0,
        balance: data.balance || 0,
      });
    } catch (error: any) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchTodayStats = async () => {
    try {
      // Intentar obtener stats de hoy
      const today = new Date().toISOString().split('T')[0];
      const balanceResponse = await api.get('/api/balance', {
        params: { start_date: today, end_date: today }
      });
      
      const data = balanceResponse.data;
      setTodayStats({
        sales: data.ingresos || 0,
        salesCount: data.resumen_ingresos?.numero_ventas || 0,
        expenses: data.egresos || 0,
        expensesCount: data.resumen_egresos?.numero_gastos || 0,
      });
    } catch (error) {
      console.log('Error fetching today stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchBalanceData(), fetchTodayStats()]);
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchBalanceData();
      fetchTodayStats();
    }, [])
  );

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await signOut();
    router.replace('/auth');
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00D2FF"
            colors={['#00D2FF']}
          />
        }
      >
        {/* Header - Command Center Style */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.appName}>YAPPA</Text>
              <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            </View>
            <TouchableOpacity 
              onPress={handleLogout} 
              style={styles.logoutButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="log-out-outline" size={22} color="#757575" />
            </TouchableOpacity>
          </View>
          <Text style={styles.storeName}>{user?.store_name}</Text>
        </View>

        {/* Hero Balance Card */}
        <TouchableOpacity 
          style={styles.heroCard}
          onPress={() => router.push('/(tabs)/balance')}
          activeOpacity={0.9}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroLabel}>Balance Total</Text>
              <Text style={[
                styles.heroAmount,
                { color: balanceData.balance >= 0 ? '#00D2FF' : '#F44336' }
              ]}>
                {formatCurrency(balanceData.balance)}
              </Text>
              <View style={styles.heroTrend}>
                <Ionicons 
                  name={balanceData.balance >= 0 ? "trending-up" : "trending-down"} 
                  size={16} 
                  color={balanceData.balance >= 0 ? '#00D2FF' : '#F44336'} 
                />
                <Text style={[
                  styles.heroTrendText,
                  { color: balanceData.balance >= 0 ? '#00D2FF' : '#F44336' }
                ]}>
                  Este mes
                </Text>
              </View>
            </View>
            <View style={styles.heroRight}>
              <View style={styles.miniStat}>
                <Ionicons name="arrow-down-circle" size={18} color="#4CAF50" />
                <Text style={styles.miniStatAmount}>{formatCurrency(balanceData.income)}</Text>
              </View>
              <View style={styles.miniStat}>
                <Ionicons name="arrow-up-circle" size={18} color="#F44336" />
                <Text style={styles.miniStatAmount}>{formatCurrency(balanceData.expenses)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.heroFooter}>
            <Text style={styles.heroFooterText}>Ver detalles</Text>
            <Ionicons name="chevron-forward" size={16} color="#757575" />
          </View>
        </TouchableOpacity>

        {/* Today's Quick Stats */}
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>📊 Hoy</Text>
          <View style={styles.todayCards}>
            <View style={[styles.todayCard, styles.salesCard]}>
              <Ionicons name="cart-outline" size={20} color="#4CAF50" />
              <Text style={styles.todayCardValue}>{formatCurrency(todayStats.sales)}</Text>
              <Text style={styles.todayCardLabel}>{todayStats.salesCount} ventas</Text>
            </View>
            <View style={[styles.todayCard, styles.expensesCard]}>
              <Ionicons name="receipt-outline" size={20} color="#F44336" />
              <Text style={styles.todayCardValue}>{formatCurrency(todayStats.expenses)}</Text>
              <Text style={styles.todayCardLabel}>{todayStats.expensesCount} gastos</Text>
            </View>
          </View>
        </View>

        {/* AI Insight Card - Ya existe */}
        <View style={styles.insightSection}>
          <AIInsightCard />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/sale')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="add-circle" size={28} color="#4CAF50" />
              </View>
              <Text style={styles.quickActionText}>Nueva Venta</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/expense')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="remove-circle" size={28} color="#F44336" />
              </View>
              <Text style={styles.quickActionText}>Nuevo Gasto</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/debts')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="document-text" size={28} color="#FF9800" />
              </View>
              <Text style={styles.quickActionText}>Deudas</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/(tabs)/inventory')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="cube" size={28} color="#2196F3" />
              </View>
              <Text style={styles.quickActionText}>Inventario</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Logout Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="log-out-outline" size={32} color="#F44336" />
            </View>
            <Text style={styles.modalTitle}>Cerrar sesión</Text>
            <Text style={styles.modalMessage}>
              ¿Confirmas que deseas cerrar sesión?
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmLogout}
              >
                <Text style={styles.confirmButtonText}>Cerrar sesión</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      
      <FloatingHelpButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00D2FF',
    letterSpacing: 2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginTop: 4,
  },
  storeName: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },

  // Hero Balance Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLeft: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 13,
    color: '#757575',
    fontWeight: '500',
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 4,
  },
  heroTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  heroTrendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  heroRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniStatAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 4,
  },
  heroFooterText: {
    fontSize: 13,
    color: '#757575',
    fontWeight: '500',
  },

  // Today Section
  todaySection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
  },
  todayCards: {
    flexDirection: 'row',
    gap: 12,
  },
  todayCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  salesCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  expensesCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
  },
  todayCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginTop: 8,
  },
  todayCardLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },

  // Insight Section
  insightSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },

  // Quick Actions
  quickActionsSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#424242',
    marginTop: 12,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  confirmButton: {
    backgroundColor: '#F44336',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#757575',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
