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
import { api } from '../utils/api';

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
      const response = await api.get('/alerts/low-stock');
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
    return level === 'critical' ? '#f44336' : '#FF9800';
  };

  const getAlertIcon = (level: 'critical' | 'warning') => {
    return level === 'critical' ? 'warning' : 'alert-circle';
  };

  const renderAlertItem = ({ item }: { item: AlertProduct }) => (
    <View style={[styles.alertCard, { borderLeftColor: getAlertColor(item.alert_level) }]}>
      <View style={styles.alertHeader}>
        <Ionicons
          name={getAlertIcon(item.alert_level) as any}
          size={24}
          color={getAlertColor(item.alert_level)}
        />
        <Text style={[styles.alertLevel, { color: getAlertColor(item.alert_level) }]}>
          {item.alert_level === 'critical' ? 'CRÍTICO' : 'ADVERTENCIA'}
        </Text>
      </View>

      <View style={styles.alertContent}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="cube-outline" size={32} color="#999" />
          </View>
        )}

        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <View style={styles.stockInfo}>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Stock actual:</Text>
              <Text style={[styles.stockValue, { color: getAlertColor(item.alert_level) }]}>
                {item.quantity}
              </Text>
            </View>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Mínimo:</Text>
              <Text style={styles.stockValue}>{item.min_stock_alert}</Text>
            </View>
          </View>
          <Text style={styles.productPrice}>Precio: ${item.price.toFixed(2)}</Text>
        </View>
      </View>

      {item.alert_level === 'critical' && (
        <View style={styles.criticalBanner}>
          <Ionicons name="alert-circle" size={16} color="#fff" />
          <Text style={styles.criticalText}>¡Producto sin stock!</Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
      <Text style={styles.emptyTitle}>¡Todo en orden!</Text>
      <Text style={styles.emptyText}>
        No hay productos con stock bajo en este momento
      </Text>
      <TouchableOpacity
        style={styles.inventoryButton}
        onPress={() => router.push('/(tabs)/inventory')}
      >
        <Ionicons name="cube" size={20} color="#fff" />
        <Text style={styles.inventoryButtonText}>Ver Inventario</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Cargando alertas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alertas de Stock</Text>
        <View style={styles.headerRight}>
          {alerts.length > 0 && (
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>{alerts.length}</Text>
            </View>
          )}
        </View>
      </View>

      {alerts.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlertItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4CAF50']}
            />
          }
          ListHeaderComponent={
            <View style={styles.summary}>
              <Ionicons name="warning" size={24} color="#FF9800" />
              <Text style={styles.summaryText}>
                {alerts.length} producto{alerts.length !== 1 ? 's' : ''} con stock bajo
              </Text>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  alertBadge: {
    backgroundColor: '#f44336',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  alertBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  summary: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginLeft: 12,
    flex: 1,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertLevel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 1,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stockInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  stockLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  stockValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  productPrice: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  criticalBanner: {
    backgroundColor: '#f44336',
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  criticalText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  inventoryButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  inventoryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
