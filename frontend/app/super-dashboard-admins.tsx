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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../utils/api';

export default function AllAdminsScreenCRUD() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [admins, searchQuery, filter]);

  const loadData = async () => {
    try {
      const response = await api.get('/api/admin-ops/admins');
      setAdmins(response.data.admins || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('❌ Error: No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...admins];

    if (filter === 'full') {
      filtered = filtered.filter(a => a.merchants_count > 0 && a.clerks_count > 5);
    } else if (filter === 'initial') {
      filtered = filtered.filter(a => a.merchants_count > 0 && a.clerks_count <= 5);
    } else if (filter === 'inactive') {
      filtered = filtered.filter(a => a.merchants_count === 0);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.nombre.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query)
      );
    }

    setFilteredAdmins(filtered);
  };

  const getActivationBadge = (admin: any) => {
    if (admin.is_active === false) {
      return { label: 'Desactivado', color: '#F44336' };
    }
    if (admin.merchants_count > 0 && admin.clerks_count > 5) {
      return { label: 'Full', color: '#00D2FF' };
    } else if (admin.merchants_count > 0) {
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
    setCurrentAdmin(null);
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (admin: any) => {
    setIsEditing(true);
    setCurrentAdmin(admin);
    setFormData({
      nombre: admin.nombre || '',
      email: admin.email || '',
      telefono: admin.telefono || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      alert('❌ Error: El nombre es obligatorio');
      return;
    }
    if (!formData.email.trim()) {
      alert('❌ Error: El email es obligatorio');
      return;
    }

    try {
      if (isEditing) {
        await api.patch(`/api/admin-ops/admins/${currentAdmin.id}`, formData);
        alert('✅ Admin actualizado correctamente');
      } else {
        await api.post('/api/admin-ops/admins', formData);
        alert('✅ Admin creado correctamente');
      }
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Error al guardar';
      alert('❌ Error: ' + errorMsg);
    }
  };

  const handleDelete = async (admin: any) => {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar el admin "${admin.nombre}"?\n\nEsto solo es posible si no tiene merchants asociados.`
    );
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/api/admin-ops/admins/${admin.id}`);
      alert('✅ Admin eliminado correctamente');
      loadData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Error al eliminar';
      alert('❌ Error: ' + errorMsg);
    }
  };

  const handleToggleActive = async (admin: any) => {
    const isActive = admin.is_active !== false;
    const action = isActive ? 'desactivar' : 'activar';
    const confirmed = window.confirm(`¿Estás seguro de ${action} el admin "${admin.nombre}"?`);
    if (!confirmed) return;
    try {
      await api.patch(`/api/admin-ops/admins/${admin.id}/toggle-active`);
      alert(`✅ Admin ${isActive ? 'desactivado' : 'activado'} correctamente`);
      loadData();
    } catch (error: any) {
      alert('❌ Error: ' + (error.response?.data?.detail || 'Error al cambiar estado'));
    }
  };

  const fullCount = admins.filter(a => a.merchants_count > 0 && a.clerks_count > 5).length;
  const initialCount = admins.filter(a => a.merchants_count > 0 && a.clerks_count <= 5).length;
  const inactiveCount = admins.filter(a => a.merchants_count === 0).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9C27B0" />
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
          <Text style={styles.headerTitle}>Todos los Admins</Text>
          <Text style={styles.headerSubtitle}>
            {filteredAdmins.length} de {admins.length} admins
          </Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o email..."
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
            Todos ({admins.length})
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
        {filteredAdmins.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No se encontraron admins</Text>
          </View>
        ) : (
          filteredAdmins.map((admin: any, index: number) => {
            const badge = getActivationBadge(admin);
            const isExpanded = expandedId === admin.id;
            const isDeactivated = admin.is_active === false;
            return (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.card, 
                  isExpanded && styles.cardExpanded,
                  isDeactivated && styles.cardDeactivated
                ]}
                onPress={() => setExpandedId(isExpanded ? null : admin.id)}
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
                    <Text style={[styles.cardTitle, isDeactivated && styles.cardTitleDeactivated]}>{admin.nombre}</Text>
                    <Text style={styles.cardSubtitle}>{admin.email}</Text>
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
                    {admin.telefono && (
                      <View style={styles.expandedRow}>
                        <Ionicons name="call" size={16} color="#666" />
                        <Text style={styles.expandedLabel}>Teléfono:</Text>
                        <Text style={styles.expandedValue}>{admin.telefono}</Text>
                      </View>
                    )}
                    <View style={styles.expandedRow}>
                      <Ionicons name="storefront" size={16} color="#666" />
                      <Text style={styles.expandedLabel}>Merchants:</Text>
                      <Text style={styles.expandedValue}>{admin.merchants_count}</Text>
                    </View>
                    <View style={styles.expandedRow}>
                      <Ionicons name="people" size={16} color="#666" />
                      <Text style={styles.expandedLabel}>Clerks:</Text>
                      <Text style={styles.expandedValue}>{admin.clerks_count}</Text>
                    </View>
                    <View style={styles.expandedRow}>
                      <Ionicons name="calendar" size={16} color="#666" />
                      <Text style={styles.expandedLabel}>Creado:</Text>
                      <Text style={styles.expandedValue}>{formatDate(admin.created_at)}</Text>
                    </View>
                    {admin.has_kyb && (
                      <View style={styles.expandedRow}>
                        <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                        <Text style={styles.expandedLabel}>KYB:</Text>
                        <Text style={styles.expandedValue}>{admin.kyb_status || 'pending'}</Text>
                      </View>
                    )}
                    
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, !isDeactivated ? styles.deactivateButton : styles.activateButton]}
                        onPress={() => handleToggleActive(admin)}
                      >
                        <Ionicons name={!isDeactivated ? "pause-circle" : "play-circle"} size={16} color="#FFF" />
                        <Text style={styles.actionButtonText}>{!isDeactivated ? "Desactivar" : "Activar"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => openEditModal(admin)}
                      >
                        <Ionicons name="pencil" size={16} color="#FFF" />
                        <Text style={styles.actionButtonText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDelete(admin)}
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

      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

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
                {isEditing ? 'Editar Admin' : 'Crear Admin'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={formData.nombre}
                onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                placeholder="Nombre completo"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="email@example.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
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
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backButton: { padding: 8 },
  headerTextContainer: { flex: 1, marginLeft: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 16, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: '#333' },
  filtersContainer: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 12, gap: 8 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  filterButtonActive: { backgroundColor: '#9C27B0', borderColor: '#9C27B0' },
  filterButtonText: { fontSize: 13, color: '#666', fontWeight: '500' },
  filterButtonTextActive: { color: '#FFF', fontWeight: '600' },
  scrollView: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#999' },
  card: { backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  cardExpanded: { borderColor: '#9C27B0', borderWidth: 2 },
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
  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 6, gap: 6 },
  editButton: { backgroundColor: '#2196F3' },
  deleteButton: { backgroundColor: '#F44336' },
  activateButton: { backgroundColor: '#4CAF50' },
  deactivateButton: { backgroundColor: '#FF9800' },
  actionButtonText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#9C27B0', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  modalBody: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: '#333' },
  modalFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#F5F5F5' },
  saveButton: { backgroundColor: '#9C27B0' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
