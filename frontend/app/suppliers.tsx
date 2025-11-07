import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

export default function SuppliersScreen() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    phone: '',
    email: '',
    type: '',
    tax_id: '',
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.log('Error loading suppliers:', error);
      Alert.alert('Error', 'No se pudieron cargar los proveedores');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newSupplier.name) {
      Alert.alert('Error', 'Ingresa el nombre del proveedor');
      return;
    }

    try {
      await api.post('/api/suppliers', newSupplier);
      Alert.alert('Éxito', 'Proveedor creado correctamente');
      setShowModal(false);
      setNewSupplier({ name: '', phone: '', email: '', type: '', tax_id: '' });
      loadSuppliers();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al crear proveedor');
    }
  };

  const deleteSupplier = async (supplierId: string) => {
    Alert.alert(
      'Eliminar Proveedor',
      '¿Estás seguro de que quieres eliminar este proveedor?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/suppliers/${supplierId}`);
              Alert.alert('Éxito', 'Proveedor eliminado');
              loadSuppliers();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el proveedor');
            }
          },
        },
      ]
    );
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.phone?.includes(searchQuery)
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Proveedores</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar proveedores..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadSuppliers} />
        }
      >
        {filteredSuppliers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron proveedores' : 'No hay proveedores aún'}
            </Text>
            <Text style={styles.emptySubtext}>
              {!searchQuery && 'Agrega tu primer proveedor'}
            </Text>
          </View>
        ) : (
          filteredSuppliers.map((supplier) => (
            <View key={supplier._id} style={styles.supplierCard}>
              <View style={styles.supplierInfo}>
                <Text style={styles.supplierName}>{supplier.name}</Text>
                {supplier.type && (
                  <Text style={styles.supplierType}>{supplier.type}</Text>
                )}
                {supplier.phone && (
                  <View style={styles.supplierDetail}>
                    <Ionicons name="call" size={16} color="#666" />
                    <Text style={styles.supplierDetailText}>{supplier.phone}</Text>
                  </View>
                )}
                {supplier.email && (
                  <View style={styles.supplierDetail}>
                    <Ionicons name="mail" size={16} color="#666" />
                    <Text style={styles.supplierDetailText}>{supplier.email}</Text>
                  </View>
                )}
                {supplier.tax_id && (
                  <View style={styles.supplierDetail}>
                    <Ionicons name="document-text" size={16} color="#666" />
                    <Text style={styles.supplierDetailText}>{supplier.tax_id}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => deleteSupplier(supplier._id)}>
                <Ionicons name="trash-outline" size={20} color="#f44336" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Proveedor</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.inputLabel}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={newSupplier.name}
                onChangeText={(text) => setNewSupplier({ ...newSupplier, name: text })}
                placeholder="Nombre del proveedor"
              />

              <Text style={styles.inputLabel}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={newSupplier.phone}
                onChangeText={(text) => setNewSupplier({ ...newSupplier, phone: text })}
                placeholder="0999123456"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={newSupplier.email}
                onChangeText={(text) => setNewSupplier({ ...newSupplier, email: text })}
                placeholder="ejemplo@correo.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Tipo</Text>
              <TextInput
                style={styles.input}
                value={newSupplier.type}
                onChangeText={(text) => setNewSupplier({ ...newSupplier, type: text })}
                placeholder="Ej: Alimentos, Bebidas, Limpieza"
              />

              <Text style={styles.inputLabel}>RUC/Cédula</Text>
              <TextInput
                style={styles.input}
                value={newSupplier.tax_id}
                onChangeText={(text) => setNewSupplier({ ...newSupplier, tax_id: text })}
                placeholder="1234567890"
                keyboardType="numeric"
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleCreate}>
                <Text style={styles.submitButtonText}>Crear Proveedor</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FF9800',
    padding: 16,
    paddingTop: 48,
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
    marginLeft: 8,
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  supplierCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  supplierType: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '500',
    marginBottom: 8,
  },
  supplierDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  supplierDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
