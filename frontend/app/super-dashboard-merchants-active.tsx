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
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../utils/api';

export default function AllMerchantsScreenCRUD() {
  const router = useRouter();
  const { period = '30d' } = useLocalSearchParams<{ period?: string }>();
  const [loading, setLoading] = useState(true);
  const [merchants, setMerchants] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [filteredMerchants, setFilteredMerchants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'full', 'initial', 'inactive'
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMerchant, setCurrentMerchant] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    admin_id: '',
    username: '',
    password: '',
    nombre: '',
    direccion: '',
    telefono: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [merchants, searchQuery, filter]);

  const loadData = async () => {
    try {
      const [merchantsResponse, adminsResponse] = await Promise.all([
        api.get(`/api/dashboard/merchants/active?period=${period}`),
        api.get('/api/admin-ops/admins')
      ]);
      setMerchants(merchantsResponse.data.merchants || []);
      setAdmins(adminsResponse.data.admins || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('❌ Error: No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...merchants];

    // Filter by status
    if (filter === 'full') {
      filtered = filtered.filter(m => m.fully_activated_at);
    } else if (filter === 'initial') {
      filtered = filtered.filter(m => m.activated_at && !m.fully_activated_at);
    } else if (filter === 'inactive') {
      filtered = filtered.filter(m => !m.activated_at);
    }

    // Search filter
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

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentMerchant(null);
    setFormData({
      admin_id: admins.length > 0 ? admins[0].id : '',
      username: '',
      password: '',
      nombre: '',
      direccion: '',
      telefono: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (merchant: any) => {
    setIsEditing(true);
    setCurrentMerchant(merchant);
    setFormData({
      admin_id: merchant.admin_id || '',
      username: merchant.username || '',
      password: '', // No mostramos la contraseña actual
      nombre: merchant.nombre || '',
      direccion: merchant.direccion || '',
      telefono: merchant.telefono || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    // Validaciones
    if (!formData.nombre.trim()) {
      alert('❌ Error: El nombre es obligatorio');
      return;
    }
    if (!formData.username.trim()) {
      alert('❌ Error: El username es obligatorio');
      return;
    }
    if (!isEditing && !formData.password.trim()) {
      alert('❌ Error: La contraseña es obligatoria');
      return;
    }
    if (!formData.admin_id) {
      alert('❌ Error: Debe seleccionar un Admin');
      return;
    }

    try {
      if (isEditing) {
        // Actualizar
        await api.patch(`/api/admin-ops/merchants/${currentMerchant.id}`, formData);
        alert('✅ Merchant actualizado correctamente');
      } else {
        // Crear
        await api.post('/api/admin-ops/merchants', formData);
        alert('✅ Merchant creado correctamente');
      }
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Error al guardar';
      alert('❌ Error: ' + errorMsg);
    }
  };

  const handleDelete = async (merchant: any) => {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar el merchant "${merchant.nombre}"?\n\nEsto solo es posible si no tiene clerks asociados.`
    );
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/api/admin-ops/merchants/${merchant.id}`);
      alert('✅ Merchant eliminado correctamente');
      loadData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Error al eliminar';
      alert('❌ Error: ' + errorMsg);
    }
  };

  const handleToggleActive = async (merchant: any) => {
    const isActive = merchant.activated_at !== null;
    const action = isActive ? 'desactivar' : 'activar';
    const confirmed = window.confirm(
      `¿Estás seguro de ${action} el merchant "${merchant.nombre}"?`
    );
    
    if (!confirmed) return;
    
    try {
      await api.patch(`/api/admin-ops/merchants/${merchant.id}/toggle-active`);
      alert(`✅ Merchant ${isActive ? 'desactivado' : 'activado'} correctamente`);
      loadData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Error al cambiar estado';
      alert('❌ Error: ' + errorMsg);
    }
  };

  const fullCount = merchants.filter(m => m.fully_activated_at).length;
  const initialCount = merchants.filter(m => m.activated_at && !m.fully_activated_at).length;
  const inactiveCount = merchants.filter(m => !m.activated_at).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D2FF" />
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
          <Text style={styles.headerTitle}>Merchants Activos</Text>
          <Text style={styles.headerSubtitle}>
            {filteredMerchants.length} de {merchants.length} merchants activos
          </Text>
        </View>
      </View>

      {/* Search Bar */}
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

      {/* Filter Buttons */}
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
            <Ionicons name="search-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No se encontraron merchants</Text>
          </View>
        ) : (
          filteredMerchants.map((merchant: any, index: number) => {
            const badge = getActivationBadge(merchant);
            const isExpanded = expandedId === merchant.id;
            const isDeactivated = !merchant.activated_at;
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
                {/* Deactivated Banner */}
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
                
                {/* Expanded Content */}
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
                      <Text style={styles.expandedLabel}>Fecha:</Text>
                      <Text style={styles.expandedValue}>
                        {merchant.activated_at ? `Activado: ${formatDate(merchant.activated_at)}` : `Creado: ${formatDate(merchant.created_at)}`}
                      </Text>
                    </View>
                    
                    {/* Action Buttons - Only visible when expanded */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, merchant.activated_at ? styles.deactivateButton : styles.activateButton]}
                        onPress={() => handleToggleActive(merchant)}
                      >
                        <Ionicons name={merchant.activated_at ? "pause-circle" : "play-circle"} size={16} color="#FFF" />
                        <Text style={styles.actionButtonText}>{merchant.activated_at ? "Desactivar" : "Activar"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => openEditModal(merchant)}
                      >
                        <Ionicons name="pencil" size={16} color="#FFF" />
                        <Text style={styles.actionButtonText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDelete(merchant)}
                      >
                        <Ionicons name="trash" size={16} color="#FFF" />
                        <Text style={styles.actionButtonText}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Modal for Create/Edit */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Editar Merchant' : 'Crear Merchant'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Admin Selector */}
              <Text style={styles.label}>Admin *</Text>
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {admins.map((admin: any) => (
                    <TouchableOpacity
                      key={admin.id}
                      style={[
                        styles.adminOption,
                        formData.admin_id === admin.id && styles.adminOptionSelected
                      ]}
                      onPress={() => setFormData({ ...formData, admin_id: admin.id })}
                    >
                      <Text style={[
                        styles.adminOptionText,
                        formData.admin_id === admin.id && styles.adminOptionTextSelected
                      ]}>
                        {admin.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={formData.nombre}
                onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                placeholder="Nombre del merchant"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Username *</Text>
              <TextInput
                style={styles.input}
                value={formData.username}
                onChangeText={(text) => setFormData({ ...formData, username: text })}
                placeholder="username_tienda"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Contraseña {!isEditing && '*'}</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                placeholder={isEditing ? "Dejar vacío para mantener actual" : "Contraseña"}
                placeholderTextColor="#999"
                secureTextEntry
              />

              <Text style={styles.label}>Dirección</Text>
              <TextInput
                style={styles.input}
                value={formData.direccion}
                onChangeText={(text) => setFormData({ ...formData, direccion: text })}
                placeholder="Dirección del merchant"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={formData.telefono}
                onChangeText={(text) => setFormData({ ...formData, telefono: text })}
                placeholder="+593999123456"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Actualizar' : 'Crear'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#00D2FF',
    borderColor: '#00D2FF',
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
  cardExpanded: {
    borderColor: '#00D2FF',
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  expandedLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  expandedValue: {
    fontSize: 13,
    color: '#333',
    flex: 1,
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
  adminText: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
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
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  dateText: {
    fontSize: 11,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  activateButton: {
    backgroundColor: '#4CAF50',
  },
  deactivateButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00D2FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  pickerContainer: {
    marginBottom: 12,
  },
  adminOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  adminOptionSelected: {
    backgroundColor: '#00D2FF',
    borderColor: '#00D2FF',
  },
  adminOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  adminOptionTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  saveButton: {
    backgroundColor: '#00D2FF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
