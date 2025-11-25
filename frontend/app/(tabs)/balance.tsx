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

export default function BalanceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectingDate, setSelectingDate] = useState<'start' | 'end'>('start');

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = () => {
    loadBalance();
    loadSales();
    loadExpenses();
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
      Alert.alert('Error', 'No se pudo cargar el balance');
    } finally {
      setLoading(false);
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

  if (!balance) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Cargando balance...</Text>
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
            tintColor="#4CAF50"
            colors={['#4CAF50']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header YAPPA */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>YAPPA</Text>
            <Text style={styles.screenTitle}>Balance</Text>
          </View>
        </View>

        {/* Balance Principal - Destacado */}
        <View style={styles.mainBalanceCard}>
          <View style={styles.mainBalanceHeader}>
            <Text style={styles.mainBalanceLabel}>Balance Total</Text>
            {balance.balance >= 0 ? (
              <View style={styles.positiveIndicator}>
                <Ionicons name="trending-up" size={20} color="#4CAF50" />
              </View>
            ) : (
              <View style={styles.negativeIndicator}>
                <Ionicons name="trending-down" size={20} color="#F44336" />
              </View>
            )}
          </View>
          <Text
            style={[
              styles.mainBalanceAmount,
              { color: balance.balance >= 0 ? '#4CAF50' : '#F44336' },
            ]}
          >
            ${balance.balance.toFixed(2)}
          </Text>
          <View style={styles.mainBalanceDetails}>
            <View style={styles.mainBalanceDetailItem}>
              <View style={[styles.detailDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.detailLabel}>Ingresos</Text>
              <Text style={styles.detailValue}>${balance.ingresos.toFixed(2)}</Text>
            </View>
            <View style={styles.mainBalanceDetailItem}>
              <View style={[styles.detailDot, { backgroundColor: '#F44336' }]} />
              <Text style={styles.detailLabel}>Egresos</Text>
              <Text style={styles.detailValue}>${balance.egresos.toFixed(2)}</Text>
            </View>
          </View>
        </View>

      {/* Date Filters */}
      <View style={styles.dateFilters}>
        <Text style={styles.dateFiltersTitle}>Filtrar por Fecha</Text>
        <View style={styles.dateButtons}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              setSelectingDate('start');
              setShowDateModal(true);
            }}
          >
            <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
            <Text style={styles.dateButtonText}>
              {startDate ? format(new Date(startDate), 'dd/MM/yyyy') : 'Fecha Inicio'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              setSelectingDate('end');
              setShowDateModal(true);
            }}
          >
            <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
            <Text style={styles.dateButtonText}>
              {endDate ? format(new Date(endDate), 'dd/MM/yyyy') : 'Fecha Fin'}
            </Text>
          </TouchableOpacity>

          {(startDate || endDate) && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearDates}
            >
              <Ionicons name="close-circle" size={24} color="#f44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => router.push('/sale')}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Nueva Venta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#f44336' }]}
          onPress={() => router.push('/expense')}
        >
          <Ionicons name="remove-circle" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Nuevo Gasto</Text>
        </TouchableOpacity>
      </View>

      {/* Resumen Ingresos */}
      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>Resumen de Ingresos</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Número de ventas</Text>
          <Text style={styles.detailValue}>
            {balance.resumen_ingresos.numero_ventas}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Pagos en efectivo</Text>
          <Text style={styles.detailValue}>
            ${balance.resumen_ingresos.pagos_efectivo.toFixed(2)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Otros pagos</Text>
          <Text style={styles.detailValue}>
            ${balance.resumen_ingresos.otros_pagos.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Resumen Egresos */}
      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>Resumen de Egresos</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Número de gastos</Text>
          <Text style={styles.detailValue}>
            {balance.resumen_egresos.numero_gastos}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Gastos en efectivo</Text>
          <Text style={styles.detailValue}>
            ${balance.resumen_egresos.gastos_efectivo.toFixed(2)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Otros gastos</Text>
          <Text style={styles.detailValue}>
            ${balance.resumen_egresos.otros_gastos.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Últimas Ventas */}
      {sales.length > 0 && (
        <View style={styles.listCard}>
          <Text style={styles.listTitle}>Últimas Ventas</Text>
          {sales.map((sale) => (
            <View key={sale._id} style={styles.listItem}>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemTitle}>
                  {sale.customer_name || 'Venta general'}
                </Text>
                <Text style={styles.listItemDate}>
                  {format(new Date(sale.date), 'dd/MM/yyyy')}
                </Text>
              </View>
              <Text style={[styles.listItemAmount, { color: '#4CAF50' }]}>
                +${sale.total.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Últimos Gastos */}
      {expenses.length > 0 && (
        <View style={styles.listCard}>
          <Text style={styles.listTitle}>Últimos Gastos</Text>
          {expenses.map((expense) => (
            <View key={expense._id} style={styles.listItem}>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemTitle}>{expense.category}</Text>
                <Text style={styles.listItemDate}>
                  {format(new Date(expense.date), 'dd/MM/yyyy')}
                </Text>
              </View>
              <Text style={[styles.listItemAmount, { color: '#f44336' }]}>
                -${expense.amount.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Date Picker Modal */}
      <Modal visible={showDateModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Seleccionar {selectingDate === 'start' ? 'Fecha Inicio' : 'Fecha Fin'}
              </Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={(day) => handleDateSelect(day.dateString)}
              markedDates={{
                [startDate]: { selected: true, selectedColor: '#4CAF50' },
                [endDate]: { selected: true, selectedColor: '#2196F3' },
              }}
              theme={{
                selectedDayBackgroundColor: '#4CAF50',
                todayTextColor: '#4CAF50',
                arrowColor: '#4CAF50',
              }}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  balanceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  listCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItemInfo: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  listItemDate: {
    fontSize: 12,
    color: '#666',
  },
  listItemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateFilters: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  dateFiltersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  dateButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  clearButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
});
