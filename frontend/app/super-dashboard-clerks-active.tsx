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

export default function ClerksActiveScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'new' | 'existing'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/api/dashboard/clerks/active?period=30d');
      setData(response.data);
    } catch (error) {
      console.error('Error loading clerks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivationBadge = (clerk: any) => {
    if (clerk.fully_activated_at) {
      return { label: 'Full', color: '#4CAF50' };
    } else if (clerk.activated_at) {
      return { label: 'Initial', color: '#FF9800' };
    }
    return { label: 'No Activo', color: '#999' };
  };

  const getRoleBadge = (role: string) => {
    return role === 'owner' 
      ? { label: 'Owner', color: '#9C27B0' } 
      : { label: 'Employee', color: '#2196F3' };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const clerks = data?.clerks || [];
  const newCount = data?.new_count || 0;
  const existingCount = data?.existing_count || 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Clerks Activos</Text>
          <Text style={styles.headerSubtitle}>{data?.count || 0} clerks con actividad</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{newCount}</Text>
          <Text style={styles.statLabel}>Nuevos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{existingCount}</Text>
          <Text style={styles.statLabel}>Existentes</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {clerks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No hay clerks activos</Text>
          </View>
        ) : (
          clerks.map((clerk: any, index: number) => {
            const activationBadge = getActivationBadge(clerk);
            const roleBadge = getRoleBadge(clerk.role);
            return (
              <View key={index} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>{clerk.nombre}</Text>
                    <Text style={styles.cardSubtitle}>{clerk.email}</Text>
                    <Text style={styles.merchantName}>{clerk.merchant_nombre}</Text>
                  </View>
                  <View style={styles.badges}>
                    <View style={[styles.badge, { backgroundColor: activationBadge.color }]}>
                      <Text style={styles.badgeText}>{activationBadge.label}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: roleBadge.color }]}>
                      <Text style={styles.badgeText}>{roleBadge.label}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <View style={styles.footerItem}>
                    <Ionicons name="analytics" size={16} color="#999" />
                    <Text style={styles.footerText}>{clerk.total_events} eventos</Text>
                  </View>
                  {clerk.status && (
                    <View style={[styles.statusBadge, { 
                      backgroundColor: clerk.status === 'new' ? '#E8F5E9' : '#E3F2FD' 
                    }]}>
                      <Text style={[styles.statusText, { 
                        color: clerk.status === 'new' ? '#4CAF50' : '#2196F3' 
                      }]}>
                        {clerk.status === 'new' ? 'Nuevo' : 'Existente'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  badges: {
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});