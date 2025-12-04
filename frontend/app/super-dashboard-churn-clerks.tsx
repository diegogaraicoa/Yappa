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

export default function ChurnClerksScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/api/dashboard/churn?period=30d');
      setData(response.data.clerks);
    } catch (error) {
      console.error('Error loading churn data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 30) return `Hace ${diffDays} días`;
    if (diffDays < 60) return 'Hace 1 mes';
    return `Hace ${Math.floor(diffDays / 30)} meses`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F44336" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const clerks = data?.details || [];
  const churnRate = data?.churn_rate || 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Clerks Churned</Text>
          <Text style={styles.headerSubtitle}>{data?.churned_count || 0} clerks sin actividad</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle" size={24} color="#F44336" />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Tasa de Churn: {churnRate}%</Text>
            <Text style={styles.infoSubtitle}>
              {data?.churned_count || 0} de {data?.total_previous || 0} clerks tuvieron actividad en el período anterior pero no en el actual.
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {clerks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="happy-outline" size={64} color="#00D2FF" />
            <Text style={styles.emptyText}>¡Excelente! No hay clerks churned</Text>
            <Text style={styles.emptySubtext}>Todos tus clerks siguen activos</Text>
          </View>
        ) : (
          clerks.map((clerk: any, index: number) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Ionicons name="person-outline" size={28} color="#F44336" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{clerk.nombre}</Text>
                  <Text style={styles.cardSubtitle}>{clerk.email}</Text>
                  <Text style={styles.merchantName}>{clerk.merchant_nombre}</Text>
                  <View style={styles.lastActivityRow}>
                    <Ionicons name="time-outline" size={14} color="#999" />
                    <Text style={styles.lastActivityText}>
                      Última actividad: {formatDate(clerk.last_activity)}
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
  infoCard: {
    backgroundColor: '#FFEBEE',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00D2FF',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
    marginTop: 4,
  },
  merchantName: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  lastActivityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  lastActivityText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
  },
});