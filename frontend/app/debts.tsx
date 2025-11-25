import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DebtsScreen() {
  const router = useRouter();
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'customer' | 'supplier'>('all');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);

  useEffect(() => {
    loadDebts();
  }, [filter]);

  const loadDebts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/debts', {
        params: filter !== 'all' ? { type: filter } : {},
      });
      setDebts(response.data.filter((d: any) => !d.paid));
    } catch (error) {
      console.log('Error loading debts:', error);
      Alert.alert('Error', 'No se pudieron cargar las deudas');
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (debtId: string) => {
    try {
      await api.put(`/api/debts/${debtId}/pay`);
      Alert.alert('Éxito', 'Deuda marcada como pagada');
      setShowConfirmModal(false);
      setSelectedDebt(null);
      loadDebts();
    } catch (error) {
      Alert.alert('Error', 'No se pudo marcar la deuda como pagada');
    }
  };

  const confirmPay = (debt: any) => {
    setSelectedDebt(debt);
    setShowConfirmModal(true);
  };

  const totalDebt = debts.reduce((sum, debt) => sum + debt.amount, 0);
  const customerDebt = debts
    .filter((d) => d.type === 'customer')
    .reduce((sum, d) => sum + d.amount, 0);
  const supplierDebt = debts
    .filter((d) => d.type === 'supplier')
    .reduce((sum, d) => sum + d.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

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
        <Text style={styles.headerTitle}>Deudas</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="wallet-outline" size={24} color="#FF9800" />
          <Text style={styles.summaryLabel}>Total de Deudas</Text>
        </View>
        <Text style={styles.summaryTotal}>{formatCurrency(totalDebt)}</Text>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="arrow-down-circle" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.summaryItemLabel}>Por Cobrar</Text>
            <Text style={[styles.summaryItemValue, { color: '#4CAF50' }]}>
              {formatCurrency(customerDebt)}
            </Text>
          </View>

          <View style={styles.summaryVerticalDivider} />

          <View style={styles.summaryItem}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="arrow-up-circle" size={20} color="#F44336" />
            </View>
            <Text style={styles.summaryItemLabel}>Por Pagar</Text>
            <Text style={[styles.summaryItemValue, { color: '#F44336' }]}>
              {formatCurrency(supplierDebt)}
            </Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersLabel}>FILTRAR</Text>
        <View style={styles.filters}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'all' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'all' && styles.filterTextActive,
              ]}
            >
              Todas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'customer' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('customer')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'customer' && styles.filterTextActive,
              ]}
            >
              Por Cobrar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'supplier' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('supplier')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'supplier' && styles.filterTextActive,
              ]}
            >
              Por Pagar
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Debts List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadDebts}
            tintColor="#FF9800"
            colors={['#FF9800']}
          />
        }
      >
        {loading && debts.length === 0 ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#FF9800" />
            <Text style={styles.loadingText}>Cargando deudas...</Text>
          </View>
        ) : debts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
            </View>
            <Text style={styles.emptyTitle}>¡Todo al día!</Text>
            <Text style={styles.emptyText}>No hay deudas pendientes</Text>
          </View>
        ) : (
          debts.map((debt) => (
            <View key={debt._id} style={styles.debtCard}>
              {/* Debt Header */}
              <View style={styles.debtHeader}>
                <View
                  style={[
                    styles.debtTypeIndicator,
                    {
                      backgroundColor:
                        debt.type === 'customer' ? '#E8F5E9' : '#FFEBEE',
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      debt.type === 'customer'
                        ? 'arrow-down-circle'
                        : 'arrow-up-circle'
                    }
                    size={24}
                    color={debt.type === 'customer' ? '#4CAF50' : '#F44336'}
                  />
                </View>
                <View style={styles.debtInfo}>
                  <Text style={styles.debtName}>
                    {debt.related_name || 'Sin nombre'}
                  </Text>
                  <Text style={styles.debtType}>
                    {debt.type === 'customer' ? 'Cliente' : 'Proveedor'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.debtAmount,
                    {
                      color: debt.type === 'customer' ? '#4CAF50' : '#F44336',
                    },
                  ]}
                >
                  {formatCurrency(debt.amount)}
                </Text>
              </View>

              {/* Debt Details */}
              <View style={styles.debtDetails}>
                <View style={styles.debtDetailRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color="#9E9E9E"
                  />
                  <Text style={styles.debtDate}>
                    {format(new Date(debt.date), "dd 'de' MMMM, yyyy", {
                      locale: es,
                    })}
                  </Text>
                </View>

                {debt.notes && (
                  <View style={styles.debtDetailRow}>
                    <Ionicons
                      name="document-text-outline"
                      size={16}
                      color="#9E9E9E"
                    />
                    <Text style={styles.debtNotes}>{debt.notes}</Text>
                  </View>
                )}
              </View>

              {/* Pay Button */}
              <TouchableOpacity
                style={styles.payButton}
                onPress={() => confirmPay(debt)}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.payButtonText}>Marcar como Pagada</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Confirm Payment Modal */}
      <Modal visible={showConfirmModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="checkmark-circle" size={56} color="#4CAF50" />
            </View>
            
            <Text style={styles.modalTitle}>Confirmar Pago</Text>
            
            {selectedDebt && (
              <>
                <Text style={styles.modalText}>
                  ¿Marcar la deuda de{' '}
                  <Text style={styles.modalTextBold}>
                    {selectedDebt.related_name || 'Sin nombre'}
                  </Text>{' '}
                  por{' '}
                  <Text style={styles.modalTextBold}>
                    {formatCurrency(selectedDebt.amount)}
                  </Text>{' '}
                  como pagada?
                </Text>
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowConfirmModal(false);
                  setSelectedDebt(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => selectedDebt && markAsPaid(selectedDebt._id)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
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

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  summaryTotal: {
    fontSize: 32,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 16,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryVerticalDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#F5F5F5',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  summaryIconContainer: {
    marginBottom: 4,
  },
  summaryItemLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9E9E9E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryItemValue: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Filters
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filtersLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F5F5F5',
  },
  filterButtonActive: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  filterTextActive: {
    color: '#FF9800',
    fontWeight: '600',
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },

  // Debt Card
  debtCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  debtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  debtTypeIndicator: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtInfo: {
    flex: 1,
  },
  debtName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  debtType: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
  },
  debtAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  debtDetails: {
    gap: 8,
    marginBottom: 16,
  },
  debtDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  debtDate: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
  },
  debtNotes: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
    fontStyle: 'italic',
    flex: 1,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Loading State
  loadingState: {
    paddingTop: 80,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9E9E9E',
  },

  // Empty State
  emptyState: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#9E9E9E',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIconContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#757575',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalTextBold: {
    fontWeight: '700',
    color: '#212121',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#616161',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
