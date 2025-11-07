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

export default function SaleScreen() {
  const router = useRouter();
  const [withInventory, setWithInventory] = useState<boolean | null>(null);
  const [total, setTotal] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [paid, setPaid] = useState(true);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);

  const paymentMethods = ['Efectivo', 'Transferencia', 'DeUna', 'Tarjeta'];

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await api.get('/api/customers');
      setCustomers(response.data);
    } catch (error) {
      console.log('Error loading customers:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await api.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.log('Error loading products:', error);
    }
  };

  const handleSubmit = async () => {
    if (withInventory === null) {
      Alert.alert('Error', 'Selecciona el tipo de venta');
      return;
    }

    if (!total || parseFloat(total) <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }

    if (withInventory && selectedProducts.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un producto');
      return;
    }

    if (!paid && !selectedCustomer) {
      Alert.alert('Error', 'Selecciona un cliente para ventas por cobrar');
      return;
    }

    setLoading(true);
    try {
      const saleData: any = {
        total: parseFloat(total),
        payment_method: paymentMethod,
        paid: paid,
        notes: notes,
        with_inventory: withInventory,
        products: withInventory ? selectedProducts.map(p => ({
          product_id: p._id,
          product_name: p.name,
          quantity: p.saleQuantity || 1,
          price: p.price,
          total: (p.saleQuantity || 1) * p.price
        })) : [],
      };

      if (selectedCustomer) {
        saleData.customer_id = selectedCustomer._id;
        saleData.customer_name = `${selectedCustomer.name} ${selectedCustomer.lastname}`;
      }

      await api.post('/api/sales', saleData);
      Alert.alert('Éxito', 'Venta registrada correctamente', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al registrar la venta');
    } finally {
      setLoading(false);
    }
  };

  const addProduct = (product: any) => {
    setSelectedProducts([...selectedProducts, { ...product, saleQuantity: 1 }]);
    setShowProductModal(false);
    
    // Calculate total
    const newTotal = [...selectedProducts, { ...product, saleQuantity: 1 }]
      .reduce((sum, p) => sum + (p.saleQuantity * p.price), 0);
    setTotal(newTotal.toString());
  };

  const removeProduct = (index: number) => {
    const newProducts = selectedProducts.filter((_, i) => i !== index);
    setSelectedProducts(newProducts);
    
    const newTotal = newProducts.reduce((sum, p) => sum + (p.saleQuantity * p.price), 0);
    setTotal(newTotal.toString());
  };

  const updateProductQuantity = (index: number, quantity: number) => {
    const newProducts = [...selectedProducts];
    newProducts[index].saleQuantity = quantity;
    setSelectedProducts(newProducts);
    
    const newTotal = newProducts.reduce((sum, p) => sum + (p.saleQuantity * p.price), 0);
    setTotal(newTotal.toString());
  };

  if (withInventory === null) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nueva Venta</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.questionText}>¿Cómo deseas registrar la venta?</Text>

          <TouchableOpacity
            style={[styles.optionCard, { borderColor: '#4CAF50' }]}
            onPress={() => setWithInventory(true)}
          >
            <Ionicons name="cube" size={48} color="#4CAF50" />
            <Text style={[styles.optionTitle, { color: '#4CAF50' }]}>Con Inventario</Text>
            <Text style={styles.optionDescription}>
              Descuenta productos del inventario automáticamente
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, { borderColor: '#2196F3' }]}
            onPress={() => setWithInventory(false)}
          >
            <Ionicons name="calculator" size={48} color="#2196F3" />
            <Text style={[styles.optionTitle, { color: '#2196F3' }]}>Sin Inventario</Text>
            <Text style={styles.optionDescription}>
              Registra solo el monto de la venta
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Venta {withInventory ? 'con' : 'sin'} Inventario
        </Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        {withInventory && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Productos</Text>
            {selectedProducts.map((product, index) => (
              <View key={index} style={styles.productItem}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>${product.price}</Text>
                </View>
                <View style={styles.productActions}>
                  <TextInput
                    style={styles.quantityInput}
                    value={product.saleQuantity.toString()}
                    onChangeText={(text) => updateProductQuantity(index, parseInt(text) || 1)}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity onPress={() => removeProduct(index)}>
                    <Ionicons name="close-circle" size={24} color="#f44336" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowProductModal(true)}
            >
              <Ionicons name="add-circle" size={24} color="#4CAF50" />
              <Text style={styles.addButtonText}>Agregar Producto</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Total (USD)</Text>
          <TextInput
            style={styles.input}
            value={total}
            onChangeText={setTotal}
            keyboardType="decimal-pad"
            placeholder="0.00"
            editable={!withInventory}
          />
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
                  Por Cobrar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Cliente (Opcional)</Text>
          <TouchableOpacity
            style={styles.customerButton}
            onPress={() => setShowCustomerModal(true)}
          >
            <Text style={styles.customerButtonText}>
              {selectedCustomer
                ? `${selectedCustomer.name} ${selectedCustomer.lastname}`
                : 'Seleccionar Cliente'}
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
            {loading ? 'Guardando...' : 'Guardar Venta'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Customer Modal */}
      <Modal visible={showCustomerModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
              <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {customers.map((customer) => (
                <TouchableOpacity
                  key={customer._id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {customer.name} {customer.lastname}
                  </Text>
                  <Text style={styles.modalItemSubtext}>{customer.phone}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Product Modal */}
      <Modal visible={showProductModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Producto</Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {products
                .filter(p => !selectedProducts.find(sp => sp._id === p._id))
                .map((product) => (
                  <TouchableOpacity
                    key={product._id}
                    style={styles.modalItem}
                    onPress={() => addProduct(product)}
                  >
                    <View>
                      <Text style={styles.modalItemText}>{product.name}</Text>
                      <Text style={styles.modalItemSubtext}>
                        Stock: {product.quantity} | ${product.price}
                      </Text>
                    </View>
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
    backgroundColor: '#4CAF50',
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 32,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
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
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
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
    backgroundColor: '#4CAF50',
  },
  switchButtonText: {
    fontSize: 14,
    color: '#666',
  },
  switchButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  customerButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
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
  productItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
    width: 60,
    textAlign: 'center',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addButton: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
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
});
