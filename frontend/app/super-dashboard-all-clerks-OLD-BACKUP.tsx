import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../utils/api';

export default function AllClerksScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clerks, setClerks] = useState([]);
  const [filteredClerks, setFilteredClerks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'inactive'

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clerks, searchQuery, filter]);

  const loadData = async () => {
    try {
      const response = await api.get('/api/dashboard/all-clerks-list');
      setClerks(response.data.clerks || []);
    } catch (error) {
      console.error('Error loading clerks:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clerks];

    // Filter by status
    if (filter === 'active') {
      filtered = filtered.filter(c => c.activated_at);
    } else if (filter === 'inactive') {
      filtered = filtered.filter(c => !c.activated_at);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.nombre.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.merchant_nombre.toLowerCase().includes(query)
      );
    }

    setFilteredClerks(filtered);
  };

  const getActivationBadge = (clerk: any) => {
    if (clerk.fully_activated_at) {
      return { label: 'Full', color: '#00D2FF' };
    } else if (clerk.activated_at) {
      return { label: 'Initial', color: '#FF9800' };
    }
    return { label: 'Inactivo', color: '#999' };
  };

  const getRoleBadge = (role: string) => {
    return role === 'owner' 
      ? { label: 'Owner', color: '#9C27B0' } 
      : { label: 'Employee', color: '#2196F3' };
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const activeCount = clerks.filter(c => c.activated_at).length;
  const inactiveCount = clerks.filter(c => !c.activated_at).length;

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Todos los Clerks</Text>
          <Text style={styles.headerSubtitle}>
            {filteredClerks.length} de {clerks.length} clerks
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre, email o merchant..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Buttons */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            Todos ({clerks.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'active' && styles.filterButtonActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterButtonText, filter === 'active' && styles.filterButtonTextActive]}>
            Activos ({activeCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'inactive' && styles.filterButtonActive]}
          onPress={() => setFilter('inactive')}
        >
          <Text style={[styles.filterButtonText, filter === 'inactive' && styles.filterButtonTextActive]}>
            Inactivos ({inactiveCount})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {filteredClerks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No se encontraron clerks</Text>
          </View>
        ) : (
          filteredClerks.map((clerk: any, index: number) => {
            const activationBadge = getActivationBadge(clerk);
            const roleBadge = getRoleBadge(clerk.role);
            return (
              <View key={index} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{clerk.nombre}</Text>
                    <Text style={styles.cardSubtitle}>{clerk.email}</Text>
                    <Text style={styles.merchantText}>🏪 {clerk.merchant_nombre}</Text>
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
                  {clerk.whatsapp_number && (
                    <View style={styles.footerItem}>
                      <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                      <Text style={styles.footerText}>{clerk.whatsapp_number}</Text>
                    </View>
                  )}
                  <Text style={styles.dateText}>
                    {clerk.activated_at ? `Act: ${formatDate(clerk.activated_at)}` : `Creado: ${formatDate(clerk.created_at)}`}
                  </Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#333',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFF',
    fontWeight: '600',
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
    marginTop: 12,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
  },
  merchantText: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
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
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 5,
  },
  dateText: {
    fontSize: 11,
    color: '#999',
  },
});
