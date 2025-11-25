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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

export default function ExpenseScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [paid, setPaid] = useState(true);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
  });
  const [newCategoryName, setNewCategoryName] = useState('');

  const paymentMethods = ['Efectivo', 'Transferencia', 'DeUna', 'Tarjeta'];

  useEffect(() => {
    loadSuppliers();
    loadCategories();
  }, []);

  const loadSuppliers = async () => {
    try {
      const response = await api.get('/api/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.log('Error loading suppliers:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/api/categories', {
        params: { type: 'expense' },
      });
      setCategories(response.data);
    } catch (error) {
      console.log('Error loading categories:', error);
    }
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }

    if (!category) {
      Alert.alert('Error', 'Selecciona una categoría');
      return;
    }

    // Proveedor es opcional con confirmación
    if (!paid && !selectedSupplier) {
      const confirmed = window.confirm('No has seleccionado un proveedor. ¿Continuar sin proveedor?');
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      const expenseData: any = {
        amount: parseFloat(amount),
        category: category,
        payment_method: paymentMethod,
        paid: paid,
        notes: notes,
      };

      if (selectedSupplier) {
        expenseData.supplier_id = selectedSupplier._id;
        expenseData.supplier_name = selectedSupplier.name;
      }

      await api.post('/api/expenses', expenseData);
      
      setLoading(false);
      Alert.alert(
        'Éxito', 
        'Gasto registrado correctamente',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Error saving expense:', error);
      setLoading(false);
      Alert.alert('Error', error.response?.data?.detail || 'Error al registrar el gasto');
    }
  };

  const handleCreateSupplier = async () => {
    if (!newSupplier.name || !newSupplier.phone) {
      Alert.alert('Error', 'Ingresa al menos nombre y teléfono');
      return;
    }

    try {
      const response = await api.post('/api/suppliers', newSupplier);
      Alert.alert('Éxito', 'Proveedor creado correctamente');
      setSelectedSupplier(response.data);
      setShowNewSupplierModal(false);
      setShowSupplierModal(false);
      setNewSupplier({ name: '', contact: '', phone: '', email: '' });
      await loadSuppliers();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al crear proveedor');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName) {
      Alert.alert('Error', 'Ingresa el nombre de la categoría');
      return;
    }

    try {
      const response = await api.post('/api/categories', {
        name: newCategoryName,
        type: 'expense',
      });
      Alert.alert('Éxito', 'Categoría creada correctamente');
      setCategory(response.data.name);
      setShowNewCategoryModal(false);
      setShowCategoryModal(false);
      setNewCategoryName('');
      await loadCategories();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al crear categoría');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Gasto</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.form}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MONTO *</Text>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Monto del Gasto</Text>
            <View style={styles.totalInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.totalInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#BDBDBD"
              />
            </View>
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CATEGORÍA *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCategoryModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="pricetag-outline" size={20} color="#757575" />
            <Text style={styles.selectButtonText}>
              {category || 'Seleccionar categoría'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#9E9E9E" />
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MÉTODO DE PAGO</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowPaymentModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="card-outline" size={20} color="#757575" />
            <Text style={styles.selectButtonText}>{paymentMethod}</Text>
            <Ionicons name="chevron-down" size={20} color="#9E9E9E" />
          </TouchableOpacity>
        </View>

        {/* Payment Status */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ESTADO</Text>
          <View style={styles.statusButtons}>
            <TouchableOpacity
              style={[styles.statusButton, paid && styles.statusButtonActive]}
              onPress={() => setPaid(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.statusButtonText, paid && styles.statusButtonTextActive]}>
                Pagado
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusButton, !paid && styles.statusButtonActive]}
              onPress={() => setPaid(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.statusButtonText, !paid && styles.statusButtonTextActive]}>
                Por Pagar
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Supplier (always visible, optional) */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PROVEEDOR {!paid && '(Recomendado)'}</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowSupplierModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="business-outline" size={20} color="#757575" />
            <Text style={styles.selectButtonText}>
              {selectedSupplier 
                ? selectedSupplier.name
                : 'Seleccionar proveedor (opcional)'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#9E9E9E" />
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTAS</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notas opcionales..."
            placeholderTextColor="#BDBDBD"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Registrar Gasto</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Categoría de Gasto</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            {/* Create New Category Button */}
            <View style={styles.createNewContainer}>
              <TouchableOpacity
                style={styles.createNewButton}
                onPress={() => {
                  setShowCategoryModal(false);
                  setShowNewCategoryModal(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={20} color="#4CAF50" />
                <Text style={styles.createNewText}>Nueva Categoría</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  style={[
                    styles.modalItem,
                    category === cat.name && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setCategory(cat.name);
                    setShowCategoryModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.modalItemText,
                    category === cat.name && styles.modalItemTextSelected
                  ]}>
                    {cat.name}
                  </Text>
                  {category === cat.name && (
                    <Ionicons name="checkmark" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}

              {categories.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No hay categorías. Crea una nueva.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* New Category Modal */}
      <Modal visible={showNewCategoryModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { maxHeight: 300 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Categoría</Text>
              <TouchableOpacity onPress={() => {
                setShowNewCategoryModal(false);
                setNewCategoryName('');
              }}>
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 24 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre de la categoría</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Servicios básicos"
                  placeholderTextColor="#BDBDBD"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  autoFocus
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowNewCategoryModal(false);
                  setNewCategoryName('');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleCreateCategory}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Payment Method Modal */}
      <Modal visible={showPaymentModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: 400 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Método de Pago</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.modalItem,
                  paymentMethod === method && styles.modalItemSelected
                ]}
                onPress={() => {
                  setPaymentMethod(method);
                  setShowPaymentModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.modalItemText,
                  paymentMethod === method && styles.modalItemTextSelected
                ]}>
                  {method}
                </Text>
                {paymentMethod === method && (
                  <Ionicons name="checkmark" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Supplier Modal */}
      <Modal visible={showSupplierModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Proveedor</Text>
              <TouchableOpacity onPress={() => setShowSupplierModal(false)}>
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            {/* Create New Supplier Button */}
            <View style={styles.createNewContainer}>
              <TouchableOpacity
                style={styles.createNewButton}
                onPress={() => {
                  setShowSupplierModal(false);
                  setShowNewSupplierModal(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={20} color="#4CAF50" />
                <Text style={styles.createNewText}>Crear Nuevo Proveedor</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {suppliers.map((supplier) => (
                <TouchableOpacity
                  key={supplier._id}
                  style={[
                    styles.modalItem,
                    selectedSupplier?._id === supplier._id && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setSelectedSupplier(supplier);
                    setShowSupplierModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalItemLeft}>
                    <Text style={[
                      styles.modalItemName,
                      selectedSupplier?._id === supplier._id && styles.modalItemTextSelected
                    ]}>
                      {supplier.name}
                    </Text>
                    {supplier.phone && (
                      <Text style={styles.modalItemPhone}>{supplier.phone}</Text>
                    )}
                  </View>
                  {selectedSupplier?._id === supplier._id && (
                    <Ionicons name="checkmark" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}

              {suppliers.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No hay proveedores. Crea uno nuevo.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* New Supplier Modal */}
      <Modal visible={showNewSupplierModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Proveedor</Text>
              <TouchableOpacity onPress={() => {
                setShowNewSupplierModal(false);
                setNewSupplier({ name: '', contact: '', phone: '', email: '' });
              }}>
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Empresa XYZ"
                  placeholderTextColor="#BDBDBD"
                  value={newSupplier.name}
                  onChangeText={(text) => setNewSupplier({ ...newSupplier, name: text })}
                />
              </View>

              {/* Contact */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Persona de Contacto</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Juan Pérez"
                  placeholderTextColor="#BDBDBD"
                  value={newSupplier.contact}
                  onChangeText={(text) => setNewSupplier({ ...newSupplier, contact: text })}
                />
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Teléfono *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+593 99 123 4567"
                  placeholderTextColor="#BDBDBD"
                  value={newSupplier.phone}
                  onChangeText={(text) => setNewSupplier({ ...newSupplier, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor="#BDBDBD"
                  value={newSupplier.email}
                  onChangeText={(text) => setNewSupplier({ ...newSupplier, email: text })}
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
                  setShowNewSupplierModal(false);
                  setNewSupplier({ name: '', contact: '', phone: '', email: '' });
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleCreateSupplier}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveText}>Crear Proveedor</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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

  // Form
  form: {
    flex: 1,
  },
  formContent: {
    padding: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  // Total Card
  totalCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 20,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
    marginBottom: 12,
  },
  totalInputContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F44336',
    marginRight: 8,
  },
  totalInput: {
    flex: 1,
    fontSize: 40,
    fontWeight: '800',
    color: '#212121',
    padding: 0,
  },

  // Select Button
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  selectButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#212121',
  },

  // Status Buttons
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F5F5F5',
  },
  statusButtonActive: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
  },
  statusButtonTextActive: {
    color: '#F44336',
  },

  // Notes Input
  notesInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '400',
    color: '#212121',
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    padding: 20,
    paddingBottom: 40,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
    maxHeight: '80%',
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
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  modalItemSelected: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  modalItemLeft: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  modalItemPhone: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  modalItemTextSelected: {
    color: '#F44336',
    fontWeight: '600',
  },

  // Create New Button
  createNewContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: '#4CAF50',
    gap: 8,
  },
  createNewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },

  // Empty State
  emptyState: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9E9E9E',
    textAlign: 'center',
  },

  // Input Group
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

  // Modal Actions
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
    paddingVertical: 16,
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
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#4CAF50',
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

  // Bottom Spacing
  bottomSpacing: {
    height: 20,
  },
});
