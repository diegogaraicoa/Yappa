import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
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

      const response = await api.post('/api/sales', saleData);
      console.log('Sale saved successfully:', response.data);
      
      setLoading(false);
      
      // Show success alert FIRST, then navigate after user dismisses it
      Alert.alert(
        '✅ Venta Guardada', 
        'La venta se registró correctamente',
        [
          { 
            text: 'OK', 
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      console.error('Error saving sale:', error);
      setLoading(false);
      Alert.alert('Error', error.response?.data?.detail || 'Error al registrar la venta');
    }
  };

  const addProduct = (product: any) => {
    setSelectedProducts([...selectedProducts, { ...product, saleQuantity: 1 }]);
    setShowProductModal(false);
    
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
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Nueva Venta</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.questionText}>¿Cómo deseas registrar la venta?</Text>
          
          <Pressable 
            style={styles.optionButton}
            onPress={() => setWithInventory(true)}
          >
            <Ionicons name="cube" size={32} color="#4CAF50" />
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Con Inventario</Text>
              <Text style={styles.optionDescription}>
                Descuenta productos del inventario
              </Text>
            </View>
          </Pressable>

          <Pressable 
            style={styles.optionButton}
            onPress={() => setWithInventory(false)}
          >
            <Ionicons name="cash" size={32} color="#2196F3" />
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Sin Inventario</Text>
              <Text style={styles.optionDescription}>
                Registro simple de ingreso
              </Text>
            </View>
          </Pressable>
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
        <Pressable onPress={() => setWithInventory(null)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {withInventory ? 'Venta con Inventario' : 'Venta sin Inventario'}
        </Text>
      </View>

      <ScrollView style={styles.form}>
        {/* Customer Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cliente</Text>
          <Pressable 
            style={styles.selectButton}
            onPress={() => setShowCustomerModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {selectedCustomer 
                ? `${selectedCustomer.name} ${selectedCustomer.lastname}`
                : 'Seleccionar cliente (opcional)'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </Pressable>
        </View>

        {/* Products (if with inventory) */}
        {withInventory && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Productos *</Text>
            {selectedProducts.map((product, index) => (
              <View key={index} style={styles.selectedProduct}>
                <View style={styles.productLeft}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>${product.price}</Text>
                </View>
                <View style={styles.productRight}>
                  <TextInput
                    style={styles.quantityInput}
                    value={product.saleQuantity.toString()}
                    onChangeText={(text) => {
                      const qty = parseFloat(text) || 1;
                      updateProductQuantity(index, qty);
                    }}
                    keyboardType="numeric"
                  />
                  <Pressable onPress={() => removeProduct(index)}>
                    <Ionicons name="close-circle" size={24} color="#f44336" />
                  </Pressable>
                </View>
              </View>
            ))}
            <Pressable 
              style={styles.addButton}
              onPress={() => setShowProductModal(true)}
            >
              <Ionicons name="add-circle" size={20} color="#4CAF50" />
              <Text style={styles.addButtonText}>Agregar Producto</Text>
            </Pressable>
          </View>
        )}

        {/* Total */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Total *</Text>
          <TextInput
            style={styles.input}
            value={total}
            onChangeText={setTotal}
            keyboardType="numeric"
            placeholder="0.00"
            editable={!withInventory || selectedProducts.length === 0}
          />
        </View>

        {/* Payment Method */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Método de Pago</Text>
          <View style={styles.paymentMethods}>
            {paymentMethods.map((method) => (
              <Pressable
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
              </Pressable>
            ))}
          </View>
        </View>

        {/* Paid Status */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Estado</Text>
          <View style={styles.paidToggle}>
            <Pressable
              style={[
                styles.paidOption,
                paid && styles.paidOptionActive,
              ]}
              onPress={() => setPaid(true)}
            >
              <Text
                style={[
                  styles.paidOptionText,
                  paid && styles.paidOptionTextActive,
                ]}
              >
                Pagado
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.paidOption,
                !paid && styles.paidOptionActive,
              ]}
              onPress={() => setPaid(false)}
            >
              <Text
                style={[
                  styles.paidOptionText,
                  !paid && styles.paidOptionTextActive,
                ]}
              >
                Por Cobrar
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notas adicionales..."
            multiline
            numberOfLines={3}
          />
        </View>

        <Pressable
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Guardando...' : 'Guardar Venta'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Customer Modal */}
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        transparent
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
              <Pressable onPress={() => setShowCustomerModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>
            <ScrollView>
              {customers.length === 0 ? (
                <View style={styles.emptyModalState}>
                  <Ionicons name="people-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyModalTitle}>No hay clientes</Text>
                  <Text style={styles.emptyModalText}>
                    Agrega tu primer cliente para comenzar
                  </Text>
                  <Pressable
                    style={styles.createNewButton}
                    onPress={() => {
                      setShowCustomerModal(false);
                      router.push('/customers');
                    }}
                  >
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.createNewButtonText}>Crear Nuevo Cliente</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  {customers.map((customer) => (
                    <Pressable
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
                    </Pressable>
                  ))}
                  <Pressable
                    style={styles.createNewButtonBottom}
                    onPress={() => {
                      setShowCustomerModal(false);
                      router.push('/customers');
                    }}
                  >
                    <Ionicons name="add-circle" size={20} color="#4CAF50" />
                    <Text style={styles.createNewButtonBottomText}>Agregar Nuevo Cliente</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Product Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        transparent
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Producto</Text>
              <Pressable onPress={() => setShowProductModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>
            <ScrollView>
              {products
                .filter(p => !selectedProducts.find(sp => sp._id === p._id))
                .map((product) => (
                  <Pressable
                    key={product._id}
                    style={styles.modalItem}
                    onPress={() => addProduct(product)}
                  >
                    <View>
                      <Text style={styles.modalItemText}>{product.name}</Text>
                      <Text style={styles.modalItemSubtext}>${product.price}</Text>
                    </View>
                    <Text style={styles.modalItemStock}>Stock: {product.quantity}</Text>
                  </Pressable>
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
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 32,
    textAlign: 'center',
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#333',
  },
  selectedProduct: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productLeft: {
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
  },
  productRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 8,
    width: 60,
    textAlign: 'center',
    marginRight: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethod: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
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
  paidToggle: {
    flexDirection: 'row',
    gap: 12,
  },
  paidOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  paidOptionActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  paidOptionText: {
    fontSize: 16,
    color: '#666',
  },
  paidOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
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
    padding: 20,
    maxHeight: '80%',
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
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modalItemStock: {
    fontSize: 14,
    color: '#4CAF50',
  },
  emptyModalState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyModalTitle: {
    fontSize: 20,
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
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createNewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  createNewButtonBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  createNewButtonBottomText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});