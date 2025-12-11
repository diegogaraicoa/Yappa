import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
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
import QuickActions from '../../components/QuickActions';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [alertCount, setAlertCount] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceData, setBalanceData] = useState({
    income: 0,
    expenses: 0,
    balance: 0,
  });

  const fetchAlertCount = async () => {
    try {
      const response = await api.get('/api/alerts/low-stock');
      setAlertCount(response.data.length);
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      setAlertCount(0);
    }
  };

  const fetchBalanceData = async () => {
    try {
      const response = await api.get('/api/balance');
      const data = response.data;
      setBalanceData({
        income: data.total_income || 0,
        expenses: data.total_expenses || 0,
        balance: data.balance || 0,
      });
    } catch (error: any) {
      console.error('Error fetching balance:', error);
      setBalanceData({ income: 0, expenses: 0, balance: 0 });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAlertCount(), fetchBalanceData()]);
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchAlertCount();
      fetchBalanceData();
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

  const menuItems = [
    {
      id: 'sale',
      title: 'Venta',
      subtitle: 'Registrar venta',
      icon: 'arrow-up-circle',
      iconColor: '#00D2FF',
      bgColor: '#E8F5E9',
      action: () => router.push('/sale'),
    },
    {
      id: 'expense',
      title: 'Gastos',
      subtitle: 'Registrar gasto',
      icon: 'arrow-down-circle',
      iconColor: '#F44336',
      bgColor: '#FFEBEE',
      action: () => router.push('/expense'),
    },
    {
      id: 'debts',
      title: 'Deudas',
      subtitle: 'Por cobrar/pagar',
      icon: 'document-text-outline',
      iconColor: '#FF9800',
      bgColor: '#FFF3E0',
      action: () => router.push('/debts'),
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
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
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeHeader}>
            <View>
              <Text style={styles.appName}>YAPPA</Text>
              <Text style={styles.storeName}>{user?.store_name}</Text>
            </View>
            <TouchableOpacity 
              onPress={handleLogout} 
              style={styles.logoutButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="log-out-outline" size={22} color="#757575" />
            </TouchableOpacity>
          </View>
          <Text style={styles.greeting}>Hola 👋</Text>
          <Text style={styles.subtitle}>Balance de tu negocio</Text>
        </View>

        {/* Balance Section - Lo más importante */}
        <View style={styles.balanceSection}>
          <TouchableOpacity 
            style={styles.balanceCard}
            onPress={() => router.push('/(tabs)/balance')}
            activeOpacity={0.7}
          >
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Balance del mes</Text>
              <Ionicons name="chevron-forward" size={20} color="#757575" />
            </View>
            
            <View style={styles.balanceAmountContainer}>
              <Text style={[
                styles.balanceAmount,
                { color: balanceData.balance >= 0 ? '#00D2FF' : '#F44336' }
              ]}>
                {formatCurrency(balanceData.balance)}
              </Text>
              {balanceData.balance >= 0 ? (
                <View style={styles.positiveIndicator}>
                  <Ionicons name="trending-up" size={24} color="#00D2FF" />
                </View>
              ) : (
                <View style={styles.negativeIndicator}>
                  <Ionicons name="trending-down" size={24} color="#F44336" />
                </View>
              )}
            </View>

            <View style={styles.balanceDetails}>
              <View style={styles.balanceDetailItem}>
                <View style={styles.balanceDetailDot} style={{ backgroundColor: '#00D2FF' }} />
                <Text style={styles.balanceDetailLabel}>Ingresos</Text>
                <Text style={styles.balanceDetailValue}>{formatCurrency(balanceData.income)}</Text>
              </View>
              <View style={styles.balanceDetailItem}>
                <View style={styles.balanceDetailDot} style={{ backgroundColor: '#F44336' }} />
                <Text style={styles.balanceDetailLabel}>Gastos</Text>
                <Text style={styles.balanceDetailValue}>{formatCurrency(balanceData.expenses)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* AI Insight Card */}
        <AIInsightCard />

        {/* Quick Actions */}
        <QuickActions />

        {/* Actions Label */}
        <View style={styles.actionsLabel}>
          <Text style={styles.actionsLabelText}>Más acciones</Text>
        </View>

        {/* Alert Banner - Minimalista */}
        {alertCount > 0 && (
          <TouchableOpacity 
            style={styles.alertBanner}
            onPress={() => router.push('/alerts')}
            activeOpacity={0.7}
          >
            <View style={styles.alertIconContainer}>
              <Ionicons name="alert-circle" size={24} color="#FF9800" />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Stock bajo</Text>
              <Text style={styles.alertSubtitle}>
                {alertCount} producto{alertCount !== 1 ? 's' : ''} requiere{alertCount !== 1 ? 'n' : ''} atención
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF9800" />
          </TouchableOpacity>
        )}

        {/* Action Cards - Grandes y legibles */}
        <View style={styles.actionsSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.actionCard}
              onPress={item.action}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
                <Ionicons name={item.icon as any} size={32} color={item.iconColor} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>{item.title}</Text>
                <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Logout Modal - Minimalista */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="log-out-outline" size={32} color="#F44336" />
              </View>
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
  // Container
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20, // Espacio normal
    paddingBottom: 100, // Espacio para los tabs en el bottom
  },

  // Welcome Section
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 16,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  appName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00D2FF',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  storeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    letterSpacing: -0.5,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#757575',
    lineHeight: 24,
  },

  // Balance Section - Lo más importante
  balanceSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  positiveIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  negativeIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceDetails: {
    gap: 12,
  },
  balanceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceDetailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  balanceDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
    flex: 1,
  },
  balanceDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },

  // Actions Label
  actionsLabel: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  actionsLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Alert Banner - Minimalista
  alertBanner: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFB74D',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
    lineHeight: 20,
  },

  // Action Cards - Grandes y legibles
  actionsSection: {
    paddingHorizontal: 20,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
    lineHeight: 20,
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 20,
  },

  // Modal - Minimalista
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  modalMessage: {
    fontSize: 16,
    fontWeight: '400',
    color: '#757575',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: '#F44336',
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#616161',
    letterSpacing: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
