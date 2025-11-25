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
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const paymentMethods = ['Efectivo', 'Transferencia', 'DeUna', 'Tarjeta'];
  const expenseCategories = [
    'Arriendo',
    'Nómina',
    'Compra de productos',
    'Gastos administrativos',
    'Reparaciones',
    'Servicios básicos',
    'Transporte',
    'Otros',
  ];

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const response = await api.get('/api/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.log('Error loading suppliers:', error);
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

    if (!paid && !selectedSupplier) {
      Alert.alert('Error', 'Selecciona un proveedor para gastos por pagar');
      return;
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

      const response = await api.post('/api/expenses', expenseData);
      console.log('Expense saved successfully:', response.data);
      
      // Clear loading and navigate back BEFORE showing alert
      setLoading(false);
      router.back();
      
      // Show success message after navigation
      setTimeout(() => {
        Alert.alert('✅ Gasto Guardado', 'El gasto se registró correctamente');
      }, 100);
    } catch (error: any) {
      console.error('Error saving expense:', error);
      setLoading(false);
      Alert.alert('Error', error.response?.data?.detail || 'Error al registrar el gasto');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Gasto</Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.label}>Monto (USD)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Categoría</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {category || 'Seleccionar categoría'}
            </Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Método de Pago</Text>
          <View style={styles.paymentMethods}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentMethod,
                  paymentMethod === method && styles.paymentMethodActive,
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text
                  style={[
                    styles.paymentMethodText,
                    paymentMethod === method && styles.paymentMethodTextActive,
                  ]}
                >
                  {method}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Estado</Text>
            <View style={styles.switchButtons}>
              <TouchableOpacity
                style={[styles.switchButton, paid && styles.switchButtonActive]}
                onPress={() => setPaid(true)}
              >
                <Text style={[styles.switchButtonText, paid && styles.switchButtonTextActive]}>
                  Pagado
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.switchButton, !paid && styles.switchButtonActive]}
                onPress={() => setPaid(false)}
              >
                <Text style={[styles.switchButtonText, !paid && styles.switchButtonTextActive]}>
                  Por Pagar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Proveedor (Opcional)</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowSupplierModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {selectedSupplier ? selectedSupplier.name : 'Seleccionar proveedor'}
            </Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Notas (Opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Agregar notas..."
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Guardando...' : 'Guardar Gasto'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Supplier Modal */}
      <Modal visible={showSupplierModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Proveedor</Text>
              <TouchableOpacity onPress={() => setShowSupplierModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedSupplier(null);
                  setShowSupplierModal(false);
                }}
              >
                <Text style={[styles.modalItemText, { color: '#666' }]}>Ninguno</Text>
              </TouchableOpacity>
              {suppliers.length === 0 ? (
                <View style={styles.emptyModalState}>
                  <Ionicons name="business-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyModalTitle}>No hay proveedores</Text>
                  <Text style={styles.emptyModalText}>
                    Agrega tu primer proveedor para comenzar
                  </Text>
                  <TouchableOpacity
                    style={styles.createNewButton}
                    onPress={() => {
                      setShowSupplierModal(false);
                      router.push('/suppliers');
                    }}
                  >
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.createNewButtonText}>Crear Nuevo Proveedor</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {suppliers.map((supplier) => (
                    <TouchableOpacity
                      key={supplier._id}
                      style={styles.modalItem}
                      onPress={() => {
                        setSelectedSupplier(supplier);
                        setShowSupplierModal(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>{supplier.name}</Text>
                      <Text style={styles.modalItemSubtext}>{supplier.phone}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.createNewButtonBottom}
                    onPress={() => {
                      setShowSupplierModal(false);
                      router.push('/suppliers');
                    }}
                  >
                    <Ionicons name="add-circle" size={20} color="#f44336" />
                    <Text style={styles.createNewButtonBottomText}>Agregar Nuevo Proveedor</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {expenseCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={styles.modalItem}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#f44336',
    padding: 16,
    paddingTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#333',
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethod: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  paymentMethodActive: {
    backgroundColor: '#f44336',
    borderColor: '#f44336',
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#666',
  },
  paymentMethodTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchButtons: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    padding: 4,
  },
  switchButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  switchButtonActive: {
    backgroundColor: '#f44336',
  },
  switchButtonText: {
    fontSize: 14,
    color: '#666',
  },
  switchButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#f44336',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
    maxHeight: '80%',
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
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalItemSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyModalState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyModalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createNewButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createNewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  createNewButtonBottom: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
  },
  createNewButtonBottomText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: '600',
  },
});
