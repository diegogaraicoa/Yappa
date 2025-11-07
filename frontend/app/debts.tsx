import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { format } from 'date-fns';

export default function DebtsScreen() {
  const router = useRouter();
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'customer' | 'supplier'>('all');

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
      loadDebts();
    } catch (error) {
      Alert.alert('Error', 'No se pudo marcar la deuda como pagada');
    }
  };

  const confirmPay = (debt: any) => {
    Alert.alert(
      'Marcar como Pagada',
      `¿Marcar esta deuda de $${debt.amount.toFixed(2)} como pagada?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Pagar',
          onPress: () => markAsPaid(debt._id),
        },
      ]
    );
  };

  const totalDebt = debts.reduce((sum, debt) => sum + debt.amount, 0);
  const customerDebt = debts.filter(d => d.type === 'customer').reduce((sum, d) => sum + d.amount, 0);
  const supplierDebt = debts.filter(d => d.type === 'supplier').reduce((sum, d) => sum + d.amount, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deudas</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Total de Deudas</Text>
        <Text style={styles.summaryAmount}>${totalDebt.toFixed(2)}</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Por Cobrar</Text>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
              ${customerDebt.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Por Pagar</Text>
            <Text style={[styles.summaryValue, { color: '#f44336' }]}>
              ${supplierDebt.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'customer' && styles.filterButtonActive]}
          onPress={() => setFilter('customer')}
        >
          <Text style={[styles.filterText, filter === 'customer' && styles.filterTextActive]}>
            Por Cobrar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'supplier' && styles.filterButtonActive]}
          onPress={() => setFilter('supplier')}
        >
          <Text style={[styles.filterText, filter === 'supplier' && styles.filterTextActive]}>
            Por Pagar
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadDebts} />
        }
      >
        {debts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            <Text style={styles.emptyText}>No hay deudas pendientes</Text>
          </View>
        ) : (
          debts.map((debt) => (
            <View
              key={debt._id}
              style={[
                styles.debtCard,
                { borderLeftColor: debt.type === 'customer' ? '#4CAF50' : '#f44336' },
              ]}
            >
              <View style={styles.debtHeader}>
                <View style={styles.debtInfo}>
                  <Text style={styles.debtName}>{debt.related_name || 'Sin nombre'}</Text>
                  <Text style={styles.debtType}>
                    {debt.type === 'customer' ? 'Cliente' : 'Proveedor'}
                  </Text>
                </View>
                <Text style={styles.debtAmount}>${debt.amount.toFixed(2)}</Text>
              </View>
              <Text style={styles.debtDate}>
                {format(new Date(debt.date), "d 'de' MMMM, yyyy")}
              </Text>
              {debt.notes && <Text style={styles.debtNotes}>{debt.notes}</Text>}
              <TouchableOpacity
                style={styles.payButton}
                onPress={() => confirmPay(debt)}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.payButtonText}>Marcar como Pagada</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
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
    backgroundColor: '#FF9800',
    padding: 16,
    paddingTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  debtCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  debtInfo: {
    flex: 1,
  },
  debtName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  debtType: {
    fontSize: 14,
    color: '#666',
  },
  debtAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  debtDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  debtNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  payButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});
