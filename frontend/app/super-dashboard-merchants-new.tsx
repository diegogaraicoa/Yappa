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
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../utils/api';

export default function NewMerchantsScreen() {
  const router = useRouter();
  const { period = '30d' } = useLocalSearchParams<{ period?: string }>();
  const [loading, setLoading] = useState(true);
  const [merchants, setMerchants] = useState([]);
  const [filteredMerchants, setFilteredMerchants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [merchants, searchQuery, filter]);

  const loadData = async () => {
    try {
      const response = await api.get(`/api/dashboard/merchants/new?period=${period}`);
      setMerchants(response.data.merchants || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('❌ Error: No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...merchants];

    if (filter === 'full') {
      filtered = filtered.filter(m => m.fully_activated_at);
    } else if (filter === 'initial') {
      filtered = filtered.filter(m => m.activated_at && !m.fully_activated_at);
    } else if (filter === 'inactive') {
      filtered = filtered.filter(m => !m.activated_at);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.nombre.toLowerCase().includes(query) ||
        m.username.toLowerCase().includes(query) ||
        m.admin_nombre.toLowerCase().includes(query)
      );
    }

    setFilteredMerchants(filtered);
  };

  const getActivationBadge = (merchant: any) => {
    if (merchant.fully_activated_at) {
      return { label: 'Full', color: '#00D2FF' };
    } else if (merchant.activated_at) {
      return { label: 'Initial', color: '#FF9800' };
    }
    return { label: 'Inactivo', color: '#999' };
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const fullCount = merchants.filter(m => m.fully_activated_at).length;
  const initialCount = merchants.filter(m => m.activated_at && !m.fully_activated_at).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
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
          <Text style={styles.headerTitle}>Merchants Nuevos</Text>
          <Text style={styles.headerSubtitle}>
            {filteredMerchants.length} de {merchants.length} merchants nuevos
          </Text>
        </View>
        <View style={styles.infoBadge}>
          <Ionicons name="information-circle" size={16} color="#666" />
          <Text style={styles.infoBadgeText}>Solo lectura</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre, username o admin..."
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

      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            Todos ({merchants.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'full' && styles.filterButtonActive]}
          onPress={() => setFilter('full')}
        >
          <Text style={[styles.filterButtonText, filter === 'full' && styles.filterButtonTextActive]}>
            Full ({fullCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'initial' && styles.filterButtonActive]}
          onPress={() => setFilter('initial')}
        >
          <Text style={[styles.filterButtonText, filter === 'initial' && styles.filterButtonTextActive]}>
            Initial ({initialCount})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {filteredMerchants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No se encontraron merchants nuevos</Text>
          </View>
        ) : (
          filteredMerchants.map((merchant: any, index: number) => {
            const badge = getActivationBadge(merchant);
            const isExpanded = expandedId === merchant.id;
            const isDeactivated = merchant.is_active === false || !merchant.activated_at;
            return (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.card, 
                  isExpanded && styles.cardExpanded,
                  isDeactivated && styles.cardDeactivated
                ]}
                onPress={() => setExpandedId(isExpanded ? null : merchant.id)}
                activeOpacity={0.7}
              >
                {isDeactivated && (
                  <View style={styles.deactivatedBanner}>
                    <Ionicons name="alert-circle" size={14} color="#FFF" />
                    <Text style={styles.deactivatedBannerText}>DESACTIVADO</Text>
                  </View>
                )}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, isDeactivated && styles.cardTitleDeactivated]}>{merchant.nombre}</Text>
                    <Text style={styles.cardSubtitle}>@{merchant.username}</Text>
                  </View>
                  <View style={styles.cardHeaderRight}>
                    <View style={[styles.badge, { backgroundColor: badge.color }]}>
                      <Text style={styles.badgeText}>{badge.label}</Text>
                    </View>
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#666" 
                      style={{ marginLeft: 8 }}
                    />
                  </View>
                </View>
                
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={styles.expandedRow}>
                      <Ionicons name="business" size={16} color="#666" />
                      <Text style={styles.expandedLabel}>Admin:</Text>
                      <Text style={styles.expandedValue}>{merchant.admin_nombre}</Text>
                    </View>
                    <View style={styles.expandedRow}>
                      <Ionicons name="people" size={16} color="#666" />
                      <Text style={styles.expandedLabel}>Clerks:</Text>
                      <Text style={styles.expandedValue}>{merchant.clerks_count}</Text>
                    </View>
                    <View style={styles.expandedRow}>
                      <Ionicons name="calendar" size={16} color="#666" />
                      <Text style={styles.expandedLabel}>Creado:</Text>
                      <Text style={styles.expandedValue}>{formatDate(merchant.created_at)}</Text>
                    </View>
                    {merchant.direccion && (
                      <View style={styles.expandedRow}>
                        <Ionicons name="location" size={16} color="#666" />
                        <Text style={styles.expandedLabel}>Dirección:</Text>
                        <Text style={styles.expandedValue}>{merchant.direccion}</Text>
                      </View>
                    )}
                    {merchant.telefono && (
                      <View style={styles.expandedRow}>
                        <Ionicons name="call" size={16} color="#666" />
                        <Text style={styles.expandedLabel}>Teléfono:</Text>
                        <Text style={styles.expandedValue}>{merchant.telefono}</Text>
                      </View>
                    )}
                    
                    <View style={styles.infoNote}>
                      <Ionicons name="information-circle-outline" size={14} color="#666" />
                      <Text style={styles.infoNoteText}>Para editar, ir a Jerarquía → All Merchants</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backButton: { padding: 8 },
  headerTextContainer: { flex: 1, marginLeft: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  infoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  infoBadgeText: { fontSize: 11, color: '#666' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 16, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: '#333' },
  filtersContainer: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 12, gap: 8 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  filterButtonActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  filterButtonText: { fontSize: 13, color: '#666', fontWeight: '500' },
  filterButtonTextActive: { color: '#FFF', fontWeight: '600' },
  scrollView: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#999' },
  card: { backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  cardExpanded: { borderColor: '#4CAF50', borderWidth: 2 },
  cardDeactivated: { backgroundColor: '#FFF5F5', borderColor: '#F44336', borderWidth: 2, opacity: 0.85 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center' },
  expandedContent: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  expandedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  expandedLabel: { fontSize: 13, color: '#666', fontWeight: '500' },
  expandedValue: { fontSize: 13, color: '#333', flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardTitleDeactivated: { textDecorationLine: 'line-through', color: '#999' },
  cardSubtitle: { fontSize: 13, color: '#666', marginTop: 3 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#FFF' },
  deactivatedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F44336', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, marginBottom: 8, gap: 6 },
  deactivatedBannerText: { color: '#FFF', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  infoNote: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0', gap: 6 },
  infoNoteText: { fontSize: 12, color: '#666', fontStyle: 'italic' },
});
