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
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../utils/api';
import * as DocumentPicker from 'expo-document-picker';

export default function KYBManagementScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [kybData, setKybData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected', 'none'
  const [stats, setStats] = useState<any>(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [kybData, searchQuery, filter]);

  const loadData = async () => {
    try {
      const response = await api.get('/api/kyb');
      setKybData(response.data.kyb_data || []);
      setStats({
        total: response.data.total,
        pending: response.data.pending_count,
        approved: response.data.approved_count,
        rejected: response.data.rejected_count,
        without_kyb: response.data.merchants_without_kyb
      });
    } catch (error) {
      console.error('Error loading KYB data:', error);
      Alert.alert('Error', 'No se pudo cargar los datos KYB');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...kybData];

    // Filter by status
    if (filter === 'pending') {
      filtered = filtered.filter(k => k.status === 'pending');
    } else if (filter === 'approved') {
      filtered = filtered.filter(k => k.status === 'approved');
    } else if (filter === 'rejected') {
      filtered = filtered.filter(k => k.status === 'rejected');
    }
    // 'none' and 'all' don't filter, handled in UI

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(k => 
        k.merchant_nombre?.toLowerCase().includes(query) ||
        k.nombre_legal?.toLowerCase().includes(query) ||
        k.ruc_tax_id?.toLowerCase().includes(query)
      );
    }

    setFilteredData(filtered);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string; bg: string }> = {
      pending: { label: 'Pendiente', color: '#FF9800', bg: '#FFF3E0' },
      approved: { label: 'Aprobado', color: '#4CAF50', bg: '#E8F5E9' },
      rejected: { label: 'Rechazado', color: '#F44336', bg: '#FFEBEE' }
    };
    return badges[status] || badges.pending;
  };

  const handleDownloadTemplate = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web: Direct download
        const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/kyb/template/download`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'kyb_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        Alert.alert('Info', 'Template CSV solo disponible en web');
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      Alert.alert('Error', 'No se pudo descargar el template');
    }
  };

  const handleBulkUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      setUploadingCsv(true);

      const file = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: 'text/csv'
      } as any);

      const response = await api.post('/api/kyb/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      Alert.alert(
        'Carga Masiva Completada',
        `Creados: ${response.data.created}\nActualizados: ${response.data.updated}\nErrores: ${response.data.errors}`,
        [
          { text: 'OK', onPress: () => loadData() }
        ]
      );
    } catch (error: any) {
      console.error('Error uploading CSV:', error);
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo cargar el CSV');
    } finally {
      setUploadingCsv(false);
    }
  };

  const handleDeleteKYB = async (kybId: string, merchantName: string) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Eliminar datos KYB de ${merchantName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/kyb/${kybId}`);
              Alert.alert('Éxito', 'KYB eliminado');
              loadData();
            } catch (error) {
              console.error('Error deleting KYB:', error);
              Alert.alert('Error', 'No se pudo eliminar');
            }
          }
        }
      ]
    );
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Admin Ops - KYB</Text>
          <Text style={styles.headerSubtitle}>Know Your Business</Text>
        </View>
      </View>

      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { borderLeftColor: '#2196F3' }]}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#FF9800' }]}>
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#4CAF50' }]}>
            <Text style={styles.statValue}>{stats.approved}</Text>
            <Text style={styles.statLabel}>Aprobados</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#F44336' }]}>
            <Text style={styles.statValue}>{stats.without_kyb}</Text>
            <Text style={styles.statLabel}>Sin KYB</Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => router.push('/super-dashboard-kyb-form')}
        >
          <Ionicons name="add-circle" size={20} color="#FFF" />
          <Text style={styles.actionButtonText}>Agregar KYB</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleDownloadTemplate}
        >
          <Ionicons name="download" size={20} color="#2196F3" />
          <Text style={styles.secondaryButtonText}>Template CSV</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleBulkUpload}
          disabled={uploadingCsv}
        >
          {uploadingCsv ? (
            <ActivityIndicator size="small" color="#2196F3" />
          ) : (
            <Ionicons name="cloud-upload" size={20} color="#2196F3" />
          )}
          <Text style={styles.secondaryButtonText}>Carga Masiva</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por merchant, nombre legal o RUC..."
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

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <View style={styles.filtersContainer}>
          {[
            { key: 'all', label: `Todos (${stats?.total || 0})` },
            { key: 'pending', label: `Pendientes (${stats?.pending || 0})` },
            { key: 'approved', label: `Aprobados (${stats?.approved || 0})` },
            { key: 'rejected', label: `Rechazados (${stats?.rejected || 0})` },
          ].map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterButton, filter === key && styles.filterButtonActive]}
              onPress={() => setFilter(key)}
            >
              <Text style={[styles.filterButtonText, filter === key && styles.filterButtonTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* List */}
      <ScrollView style={styles.scrollView}>
        {filteredData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No hay datos KYB</Text>
            {filter !== 'all' && (
              <Text style={styles.emptySubtext}>Intenta cambiar el filtro</Text>
            )}
          </View>
        ) : (
          filteredData.map((kyb, index) => {
            const badge = getStatusBadge(kyb.status);
            return (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() => router.push(`/super-dashboard-kyb-form?merchant_id=${kyb.merchant_id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{kyb.merchant_nombre}</Text>
                    <Text style={styles.cardSubtitle}>{kyb.nombre_legal}</Text>
                    <Text style={styles.cardDetail}>RUC: {kyb.ruc_tax_id}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.footerLeft}>
                    <Ionicons name="person" size={14} color="#666" />
                    <Text style={styles.footerText}>{kyb.representante_legal}</Text>
                  </View>
                  <View style={styles.footerRight}>
                    <Text style={styles.dateText}>{formatDate(kyb.updated_at)}</Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteKYB(kyb.id, kyb.merchant_nombre);
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 14,
    color: '#333',
  },
  filtersScroll: {
    marginTop: 12,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
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
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
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
    marginTop: 12,
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
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#CCC',
  },
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 12,
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
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardDetail: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateText: {
    fontSize: 11,
    color: '#999',
  },
  deleteButton: {
    padding: 4,
  },
});