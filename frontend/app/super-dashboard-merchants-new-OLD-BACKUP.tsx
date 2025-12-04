import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../utils/api';

export default function MerchantsNewScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/api/dashboard/merchants/new?period=30d');
      setData(response.data);
    } catch (error) {
      console.error('Error loading merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const merchants = data?.merchants || [];
  const changePercentage = data?.change_percentage || 0;
  const isPositive = changePercentage >= 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Merchants Nuevos</Text>
          <Text style={styles.headerSubtitle}>{data?.count || 0} merchants activados recientemente</Text>
        </View>
      </View>

      {data?.change_percentage !== undefined && (
        <View style={[styles.comparisonCard, { backgroundColor: isPositive ? '#E8F5E9' : '#FFEBEE' }]}>
          <View style={styles.comparisonRow}>
            <Ionicons 
              name={isPositive ? 'trending-up' : 'trending-down'} 
              size={24} 
              color={isPositive ? '#00D2FF' : '#F44336'} 
            />
            <Text style={[styles.comparisonText, { color: isPositive ? '#00D2FF' : '#F44336' }]}>
              {isPositive ? '+' : ''}{changePercentage.toFixed(1)}% vs período anterior
            </Text>
          </View>
          <Text style={styles.comparisonDetail}>
            Período anterior: {data?.previous_count || 0} merchants
          </Text>
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        {merchants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="add-circle-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No hay merchants nuevos</Text>
          </View>
        ) : (
          merchants.map((merchant: any, index: number) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Ionicons name="storefront" size={24} color="#2196F3" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{merchant.nombre}</Text>
                  <Text style={styles.cardSubtitle}>@{merchant.username}</Text>
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar" size={14} color="#999" />
                    <Text style={styles.dateText}>
                      Activado: {formatDate(merchant.activated_at)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 8,
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
  comparisonCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  comparisonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  comparisonDetail: {
    fontSize: 14,
    color: '#666',
    marginLeft: 32,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
});