import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

export default function CustomersScreen() {
  const router = useRouter();
  const { highlight } = useLocalSearchParams<{ highlight?: string }>();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [highlightedCustomer, setHighlightedCustomer] = useState<string | null>(null);
  const highlightAnim = useRef(new Animated.Value(0)).current;
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    phone: '',
    email: '',
  });

  // Efecto para resaltar cliente cuando viene de AI Insights
  useEffect(() => {
    if (highlight) {
      setHighlightedCustomer(highlight);
      // Animar el highlight
      Animated.sequence([
        Animated.timing(highlightAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.delay(2000),
        Animated.timing(highlightAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
      ]).start(() => {
        setHighlightedCustomer(null);
      });
    }
  }, [highlight]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/customers');
      setCustomers(response.data);
    } catch (error) {
      console.log('Error loading customers:', error);
      Alert.alert('Error', 'No se pudieron cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setFormData({ name: '', lastname: '', phone: '', email: '' });
    setShowModal(true);
  };

  const openEditModal = (customer: any) => {
    setIsEditing(true);
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      lastname: customer.lastname,
      phone: customer.phone || '',
      email: customer.email || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.lastname) {
      Alert.alert('Error', 'Ingresa al menos nombre y apellido');
      return;
    }

    try {
      if (isEditing && selectedCustomer) {
        // Update
        await api.put(`/api/customers/${selectedCustomer._id}`, formData);
        Alert.alert('Éxito', 'Cliente actualizado correctamente');
      } else {
        // Create
        await api.post('/api/customers', formData);
        Alert.alert('Éxito', 'Cliente creado correctamente');
      }
      setShowModal(false);
      setFormData({ name: '', lastname: '', phone: '', email: '' });
      setSelectedCustomer(null);
      loadCustomers();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.detail ||
          `Error al ${isEditing ? 'actualizar' : 'crear'} cliente`
      );
    }
  };

  const deleteCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      await api.delete(`/api/customers/${selectedCustomer._id}`);
      Alert.alert('Éxito', 'Cliente eliminado');
      setShowDeleteModal(false);
      setSelectedCustomer(null);
      loadCustomers();
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el cliente');
    }
  };

  const confirmDelete = (customer: any) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      (customer.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.lastname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.phone || '').includes(searchQuery)
  );

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
        <Text style={styles.headerTitle}>Clientes</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9E9E9E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar clientes..."
            placeholderTextColor="#BDBDBD"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9E9E9E" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Customer Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {filteredCustomers.length}{' '}
          {filteredCustomers.length === 1 ? 'cliente' : 'clientes'}
        </Text>
      </View>

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadCustomers}
            tintColor="#00D2FF"
            colors={['#00D2FF']}
          />
        }
      >
        {loading && customers.length === 0 ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#00D2FF" />
            <Text style={styles.loadingText}>Cargando clientes...</Text>
          </View>
        ) : filteredCustomers.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="people-outline" size={48} color="#9E9E9E" />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Sin resultados' : 'Sin clientes aún'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Intenta con otro término de búsqueda'
                : 'Agrega tu primer cliente'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={openCreateModal}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Crear Cliente</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredCustomers.map((customer) => {
            const isHighlighted = highlightedCustomer === customer._id;
            const hasDebt = customer.balance < 0;
            
            // Color de fondo animado para el highlight
            const backgroundColor = isHighlighted 
              ? highlightAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#FFFFFF', '#FFEBEE']
                })
              : '#FFFFFF';
            
            const borderColor = isHighlighted
              ? highlightAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#E0E0E0', '#F44336']
                })
              : '#E0E0E0';
            
            return (
              <Animated.View 
                key={customer._id} 
                style={[
                  styles.customerCard,
                  { backgroundColor, borderColor, borderWidth: isHighlighted ? 2 : 1 }
                ]}
              >
                {/* Banner de atención para clientes resaltados */}
                {isHighlighted && (
                  <View style={styles.attentionBanner}>
                    <Ionicons name="alert-circle" size={16} color="#FFF" />
                    <Text style={styles.attentionText}>💰 Deuda pendiente - Requiere cobro</Text>
                  </View>
                )}
                {/* Avatar Circle */}
                <View style={[styles.avatarContainer, isHighlighted && { borderColor: '#F44336', borderWidth: 2 }]}>
                  <Text style={styles.avatarText}>
                    {(customer.name || '?').charAt(0).toUpperCase()}
                    {(customer.lastname || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Customer Info */}
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>
                    {customer.name || ''} {customer.lastname || ''}
                  </Text>

                  {customer.phone && (
                    <View style={styles.customerDetail}>
                      <Ionicons name="call-outline" size={14} color="#757575" />
                      <Text style={styles.customerDetailText}>
                        {customer.phone}
                      </Text>
                    </View>
                  )}

                  {customer.email && (
                    <View style={styles.customerDetail}>
                      <Ionicons name="mail-outline" size={14} color="#757575" />
                      <Text style={styles.customerDetailText}>
                        {customer.email}
                      </Text>
                    </View>
                  )}
                  
                  {/* Mostrar deuda si existe */}
                  {hasDebt && (
                    <View style={[styles.customerDetail, { marginTop: 4 }]}>
                      <Ionicons name="cash-outline" size={14} color="#F44336" />
                      <Text style={[styles.customerDetailText, { color: '#F44336', fontWeight: '600' }]}>
                        Deuda: ${Math.abs(customer.balance || 0).toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    onPress={() => openEditModal(customer)}
                    style={styles.actionButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="pencil" size={20} color="#2196F3" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmDelete(customer)}
                    style={styles.actionButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Create/Edit Customer Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowModal(false);
                  setFormData({ name: '', lastname: '', phone: '', email: '' });
                  setSelectedCustomer(null);
                }}
              >
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalForm}
              showsVerticalScrollIndicator={false}
            >
              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  placeholder="Juan"
                  placeholderTextColor="#BDBDBD"
                />
              </View>

              {/* Lastname */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Apellido *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.lastname}
                  onChangeText={(text) =>
                    setFormData({ ...formData, lastname: text })
                  }
                  placeholder="Pérez"
                  placeholderTextColor="#BDBDBD"
                />
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Teléfono</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) =>
                    setFormData({ ...formData, phone: text })
                  }
                  placeholder="+593 99 123 4567"
                  placeholderTextColor="#BDBDBD"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor="#BDBDBD"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowModal(false);
                  setFormData({ name: '', lastname: '', phone: '', email: '' });
                  setSelectedCustomer(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveText}>
                  {isEditing ? 'Actualizar' : 'Crear Cliente'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalIconContainer}>
              <Ionicons name="trash" size={48} color="#F44336" />
            </View>

            <Text style={styles.deleteModalTitle}>Eliminar Cliente</Text>

            {selectedCustomer && (
              <Text style={styles.deleteModalText}>
                ¿Estás seguro de que quieres eliminar a{' '}
                <Text style={styles.deleteModalTextBold}>
                  {selectedCustomer.name} {selectedCustomer.lastname}
                </Text>
                ?
              </Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowDeleteModal(false);
                  setSelectedCustomer(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalConfirmButton}
                onPress={deleteCustomer}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // Search Section
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#212121',
  },

  // Count Container
  countContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },

  // Customer Card
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00D2FF',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 6,
  },
  customerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  customerDetailText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },

  // Loading State
  loadingState: {
    paddingTop: 80,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9E9E9E',
  },

  // Empty State
  emptyState: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D2FF',
    borderRadius: 48,
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

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  modalForm: {
    paddingHorizontal: 24,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '400',
    color: '#212121',
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#616161',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#00D2FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#00D2FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Delete Modal
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  deleteModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  deleteModalIconContainer: {
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteModalText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#757575',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  deleteModalTextBold: {
    fontWeight: '700',
    color: '#212121',
  },
  deleteModalConfirmButton: {
    flex: 1,
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  // Attention Banner for highlighted customers
  attentionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: 8,
    marginHorizontal: -16,
    marginTop: -16,
  },
  attentionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 6,
  },
});
