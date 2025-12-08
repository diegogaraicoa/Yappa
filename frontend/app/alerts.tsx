import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

interface AlertProduct {
  _id: string;
  name: string;
  image?: string;
  quantity: number;
  min_stock_alert: number;
  alert_level: 'critical' | 'warning';
  price: number;
  category_id?: string;
}

export default function AlertsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/api/alerts/low-stock');
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAlerts();
  }, []);

  const getAlertColor = (level: 'critical' | 'warning') => {
    return level === 'critical' ? '#F44336' : '#FF9800';
  };

  const getAlertBgColor = (level: 'critical' | 'warning') => {
    return level === 'critical' ? '#FFEBEE' : '#FFF3E0';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const navigateToInventory = () => {
    router.push('/(tabs)/inventory');
  };

  const renderAlertItem = ({ item }: { item: AlertProduct }) => (
    <View style={styles.alertCard}>
      {/* Alert Badge */}
      <View
        style={[
          styles.alertBadge,
          { backgroundColor: getAlertBgColor(item.alert_level) },
        ]}
      >
        <Ionicons
          name={item.alert_level === 'critical' ? 'warning' : 'alert-circle'}
          size={16}
          color={getAlertColor(item.alert_level)}
        />
        <Text
          style={[
            styles.alertBadgeText,
            { color: getAlertColor(item.alert_level) },
          ]}
        >
          {item.alert_level === 'critical' ? 'CRÍTICO' : 'ADVERTENCIA'}
        </Text>
      </View>

      {/* Product Content */}
      <View style={styles.productContent}>
        {/* Image */}
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="cube-outline" size={32} color="#BDBDBD" />
          </View>
        )}

        {/* Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.stockRow}>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Actual</Text>
              <Text
                style={[
                  styles.stockValue,
                  { color: getAlertColor(item.alert_level) },
                ]}
              >
                {item.quantity}
              </Text>
            </View>

            <View style={styles.stockDivider} />

            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Mínimo</Text>
              <Text style={styles.stockValue}>{item.min_stock_alert}</Text>
            </View>

            <View style={styles.stockDivider} />

            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Precio</Text>
              <Text style={styles.stockValue}>{formatCurrency(item.price)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Critical Banner */}
      {item.alert_level === 'critical' && item.quantity === 0 && (
        <View style={styles.criticalBanner}>
          <Ionicons name="alert-circle" size={14} color="#FFFFFF" />
          <Text style={styles.criticalText}>¡Sin stock disponible!</Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="checkmark-circle" size={64} color="#00D2FF" />
      </View>
      <Text style={styles.emptyTitle}>¡Todo en orden!</Text>
      <Text style={styles.emptyText}>
        No hay productos con stock bajo en este momento
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={navigateToInventory}
        activeOpacity={0.8}
      >
        <Ionicons name="cube" size={20} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Ver Inventario</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Alertas de Stock</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={styles.loadingText}>Cargando alertas...</Text>
        </View>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Alertas de Stock</Text>
        {alerts.length > 0 ? (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{alerts.length}</Text>
          </View>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {alerts.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlertItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF9800"
              colors={['#FF9800']}
            />
          }
          ListHeaderComponent={
            <View style={styles.summary}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="warning" size={24} color="#FF9800" />
              </View>
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryTitle}>Productos con Stock Bajo</Text>
                <Text style={styles.summarySubtitle}>
                  {alerts.length} producto{alerts.length !== 1 ? 's' : ''} requiere
                  {alerts.length === 1 ? '' : 'n'} atención
                </Text>
              </View>
            </View>
          }
        />
      )}
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
  headerBadge: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9E9E9E',
  },

  // List
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  // Summary
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#EF6C00',
  },

  // Alert Card
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  alertBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Product Content
  productContent: {
    flexDirection: 'row',
    gap: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
    lineHeight: 22,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 8,
    gap: 8,
  },
  stockItem: {
    flex: 1,
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9E9E9E',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stockValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  stockDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E0E0E0',
  },

  // Critical Banner
  criticalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 12,
    gap: 6,
  },
  criticalText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#757575',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D2FF',
    borderRadius: 60,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: '#00D2FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
