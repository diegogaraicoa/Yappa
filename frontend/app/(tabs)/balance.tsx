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
          <ActivityIndicator size="large" color="#00D2FF" />
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
            tintColor="#00D2FF"
            colors={['#00D2FF']}
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

        {/* Balance Principal */}
        <View style={styles.mainBalanceCard}>
          <View style={styles.mainBalanceHeader}>
            <Text style={styles.mainBalanceLabel}>BALANCE</Text>
            {balance.balance >= 0 ? (
              <View style={styles.positiveIndicator}>
                <Ionicons name="trending-up" size={20} color="#00D2FF" />
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
              { color: balance.balance >= 0 ? '#00D2FF' : '#F44336' },
            ]}
          >
            ${balance.balance.toFixed(2)}
          </Text>
          <View style={styles.mainBalanceDetails}>
            <View style={styles.mainBalanceDetailItem}>
              <View style={[styles.detailDot, { backgroundColor: '#00D2FF' }]} />
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

        {/* Resúmenes */}
        <Text style={styles.sectionLabel}>DETALLES</Text>

        {/* Resumen Ingresos */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIconContainer} style={{ backgroundColor: '#E8F5E9' }}>
              <Ionicons name="arrow-up" size={20} color="#00D2FF" />
            </View>
            <Text style={styles.summaryTitle}>Ingresos</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryRowLabel}>Número de ventas</Text>
            <Text style={styles.summaryRowValue}>{balance.resumen_ingresos.numero_ventas}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryRowLabel}>Efectivo</Text>
            <Text style={styles.summaryRowValue}>${balance.resumen_ingresos.pagos_efectivo.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryRowLabel}>Otros pagos</Text>
            <Text style={styles.summaryRowValue}>${balance.resumen_ingresos.otros_pagos.toFixed(2)}</Text>
          </View>
        </View>

        {/* Resumen Egresos */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="arrow-down" size={20} color="#F44336" />
            </View>
            <Text style={styles.summaryTitle}>Egresos</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryRowLabel}>Número de gastos</Text>
            <Text style={styles.summaryRowValue}>{balance.resumen_egresos.numero_gastos}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryRowLabel}>Efectivo</Text>
            <Text style={styles.summaryRowValue}>${balance.resumen_egresos.gastos_efectivo.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryRowLabel}>Otros gastos</Text>
            <Text style={styles.summaryRowValue}>${balance.resumen_egresos.otros_gastos.toFixed(2)}</Text>
          </View>
        </View>

        {/* Transacciones Recientes */}
        {(sales.length > 0 || expenses.length > 0) && (
          <>
            <Text style={styles.sectionLabel}>RECIENTES</Text>

            {/* Últimas Ventas */}
            {sales.length > 0 && (
              <View style={styles.transactionsList}>
                {sales.map((sale) => (
                  <View key={sale._id} style={styles.transactionItem}>
                    <View style={[styles.transactionIcon, { backgroundColor: '#E8F5E9' }]}>
                      <Ionicons name="arrow-up" size={16} color="#00D2FF" />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>
                        {sale.customer_name || 'Venta'}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {format(new Date(sale.date), 'dd MMM yyyy')}
                      </Text>
                    </View>
                    <Text style={[styles.transactionAmount, { color: '#00D2FF' }]}>
                      +${sale.total.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Últimos Gastos */}
            {expenses.length > 0 && (
              <View style={styles.transactionsList}>
                {expenses.map((expense) => (
                  <View key={expense._id} style={styles.transactionItem}>
                    <View style={[styles.transactionIcon, { backgroundColor: '#FFEBEE' }]}>
                      <Ionicons name="arrow-down" size={16} color="#F44336" />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>{expense.category}</Text>
                      <Text style={styles.transactionDate}>
                        {format(new Date(expense.date), 'dd MMM yyyy')}
                      </Text>
                    </View>
                    <Text style={[styles.transactionAmount, { color: '#F44336' }]}>
                      -${expense.amount.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal visible={showDateModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectingDate === 'start' ? 'Fecha inicio' : 'Fecha fin'}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowDateModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={(day) => handleDateSelect(day.dateString)}
              markedDates={{
                [startDate]: { selected: true, selectedColor: '#00D2FF' },
                [endDate]: { selected: true, selectedColor: '#2196F3' },
              }}
              theme={{
                selectedDayBackgroundColor: '#00D2FF',
                todayTextColor: '#00D2FF',
                arrowColor: '#00D2FF',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#757575',
  },

  // Header
  header: {
    paddingHorizontal: 20,
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
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212121',
    letterSpacing: -0.5,
  },

  // Section Label
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
  },

  // Date Section
  dateSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  dateButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  dateSeparator: {
    marginHorizontal: 8,
  },
  clearButton: {
    marginLeft: 8,
    padding: 8,
  },

  // Main Balance Card
  mainBalanceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  mainBalanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainBalanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  positiveIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  negativeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainBalanceAmount: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 20,
  },
  mainBalanceDetails: {
    gap: 12,
  },
  mainBalanceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  summaryRowLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
  },
  summaryRowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },

  // Transactions
  transactionsList: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9E9E9E',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 20,
  },
});
