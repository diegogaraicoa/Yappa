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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    lastname: '',
    phone: '',
    email: '',
  });
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProductQuick, setNewProductQuick] = useState({
    name: '',
    price: '',
    cost: '',
    quantity: '1',
  });

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

    // Cliente es opcional, pero si es "Por Cobrar" y no hay cliente, advertir
    if (!paid && !selectedCustomer) {
      const confirmed = window.confirm('No has seleccionado un cliente. ¿Continuar sin cliente?');
      if (!confirmed) return;
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
      
      setLoading(false);
      Alert.alert(
        'Éxito', 
        'Venta registrada correctamente',
        [{ text: 'OK', onPress: () => router.back() }]
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
    setTotal(newTotal.toFixed(2));
  };

  const removeProduct = (index: number) => {
    const newProducts = selectedProducts.filter((_, i) => i !== index);
    setSelectedProducts(newProducts);
    
    const newTotal = newProducts.reduce((sum, p) => sum + (p.saleQuantity * p.price), 0);
    setTotal(newTotal.toFixed(2));
  };

  const updateProductQuantity = (index: number, quantity: number) => {
    const newProducts = [...selectedProducts];
    newProducts[index].saleQuantity = quantity;
    setSelectedProducts(newProducts);
    
    const newTotal = newProducts.reduce((sum, p) => sum + (p.saleQuantity * p.price), 0);
    setTotal(newTotal.toFixed(2));
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.lastname || !newCustomer.phone) {
      Alert.alert('Error', 'Ingresa nombre, apellido y teléfono');
      return;
    }

    try {
      const response = await api.post('/api/customers', newCustomer);
      Alert.alert('Éxito', 'Cliente creado correctamente');
      setSelectedCustomer(response.data);
      setShowNewCustomerModal(false);
      setShowCustomerModal(false);
      setNewCustomer({ name: '', lastname: '', phone: '', email: '' });
      await loadCustomers();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al crear cliente');
    }
  };

  const handleCreateProductQuick = async () => {
    if (!newProductQuick.name || !newProductQuick.price) {
      Alert.alert('Error', 'Ingresa al menos nombre y precio');
      return;
    }

    try {
      const productData = {
        name: newProductQuick.name,
        price: parseFloat(newProductQuick.price),
        cost: parseFloat(newProductQuick.cost) || 0,
        quantity: parseFloat(newProductQuick.quantity) || 0,
        description: '',
        category_id: '',
        alert_enabled: false,
      };

      const response = await api.post('/api/products', productData);
      Alert.alert('Éxito', 'Producto creado correctamente');
      
      // Auto-add to selected products
      addProduct(response.data);
      
      setShowNewProductModal(false);
      setShowProductModal(false);
      setNewProductQuick({ name: '', price: '', cost: '', quantity: '1' });
      await loadProducts();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al crear producto');
    }
  };

  // Initial Selection Screen
  if (withInventory === null) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nueva Venta</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.initialContent}>
          <Text style={styles.questionTitle}>¿Cómo quieres registrar?</Text>
          <Text style={styles.questionSubtitle}>Selecciona el tipo de venta</Text>
          
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => setWithInventory(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="cube" size={32} color="#00D2FF" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Con Inventario</Text>
              <Text style={styles.optionDescription}>
                Descuenta productos del stock
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => setWithInventory(false)}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="cash" size={32} color="#2196F3" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Sin Inventario</Text>
              <Text style={styles.optionDescription}>
                Solo registra el monto
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Main Form
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setWithInventory(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {withInventory ? 'Con Inventario' : 'Sin Inventario'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.form}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Products (if with inventory) */}
        {withInventory && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PRODUCTOS *</Text>
            {selectedProducts.map((product, index) => (
              <View key={index} style={styles.productCard}>
                <View style={styles.productLeft}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>${product.price.toFixed(2)} c/u</Text>
                </View>
                <View style={styles.productRight}>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity
                      onPress={() => updateProductQuantity(index, Math.max(1, product.saleQuantity - 1))}
                      style={styles.quantityButton}
                    >
                      <Ionicons name="remove" size={16} color="#757575" />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.quantityInput}
                      value={product.saleQuantity.toString()}
                      onChangeText={(text) => {
                        const qty = parseFloat(text) || 1;
                        updateProductQuantity(index, qty);
                      }}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity
                      onPress={() => updateProductQuantity(index, product.saleQuantity + 1)}
                      style={styles.quantityButton}
                    >
                      <Ionicons name="add" size={16} color="#757575" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => removeProduct(index)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="trash-outline" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowProductModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color="#00D2FF" />
              <Text style={styles.addButtonText}>Agregar Producto</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Total */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TOTAL *</Text>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Monto Total</Text>
            <View style={styles.totalInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.totalInput}
                value={total}
                onChangeText={setTotal}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#BDBDBD"
                editable={!withInventory}
              />
            </View>
          </View>
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
                Por Cobrar
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Customer (always visible, optional) */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CLIENTE {!paid && '(Recomendado)'}</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCustomerModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={20} color="#757575" />
            <Text style={styles.selectButtonText}>
              {selectedCustomer 
                ? `${selectedCustomer.name} ${selectedCustomer.lastname}`
                : 'Seleccionar cliente (opcional)'}
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
              <Text style={styles.submitButtonText}>Registrar Venta</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Product Modal */}
      <Modal visible={showProductModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Producto</Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            {/* Create New Product Button */}
            <View style={styles.createNewContainer}>
              <TouchableOpacity
                style={styles.createNewButton}
                onPress={() => {
                  setShowProductModal(false);
                  setShowNewProductModal(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={20} color="#00D2FF" />
                <Text style={styles.createNewText}>Crear Producto Rápido</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {products.filter(p => !selectedProducts.find(sp => sp._id === p._id)).map((product) => (
                <TouchableOpacity
                  key={product._id}
                  style={styles.modalItem}
                  onPress={() => addProduct(product)}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalItemLeft}>
                    <Text style={styles.modalItemName}>{product.name}</Text>
                    <Text style={styles.modalItemPrice}>${product.price.toFixed(2)}</Text>
                  </View>
                  <View style={styles.modalItemRight}>
                    <Text style={styles.modalItemStock}>Stock: {product.quantity}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {products.filter(p => !selectedProducts.find(sp => sp._id === p._id)).length === 0 && (
                <View style={styles.emptyCustomers}>
                  <Text style={styles.emptyCustomersText}>
                    Todos los productos ya fueron agregados
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* New Product Quick Modal */}
      <Modal visible={showNewProductModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Producto Rápido</Text>
              <TouchableOpacity onPress={() => {
                setShowNewProductModal(false);
                setNewProductQuick({ name: '', price: '', cost: '', quantity: '1' });
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
                  placeholder="Producto temporal"
                  placeholderTextColor="#BDBDBD"
                  value={newProductQuick.name}
                  onChangeText={(text) => setNewProductQuick({ ...newProductQuick, name: text })}
                />
              </View>

              {/* Price & Cost */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Precio *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#BDBDBD"
                    value={newProductQuick.price}
                    onChangeText={(text) => setNewProductQuick({ ...newProductQuick, price: text })}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Costo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#BDBDBD"
                    value={newProductQuick.cost}
                    onChangeText={(text) => setNewProductQuick({ ...newProductQuick, cost: text })}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {/* Quantity */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Stock Inicial</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  placeholderTextColor="#BDBDBD"
                  value={newProductQuick.quantity}
                  onChangeText={(text) => setNewProductQuick({ ...newProductQuick, quantity: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowNewProductModal(false);
                  setNewProductQuick({ name: '', price: '', cost: '', quantity: '1' });
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleCreateProductQuick}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveText}>Crear y Agregar</Text>
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
                  <Ionicons name="checkmark" size={24} color="#00D2FF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Customer Modal */}
      <Modal visible={showCustomerModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
              <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            {/* Create New Customer Button */}
            <View style={styles.createNewContainer}>
              <TouchableOpacity
                style={styles.createNewButton}
                onPress={() => {
                  setShowCustomerModal(false);
                  setShowNewCustomerModal(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={20} color="#00D2FF" />
                <Text style={styles.createNewText}>Crear Nuevo Cliente</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {customers.map((customer) => (
                <TouchableOpacity
                  key={customer._id}
                  style={[
                    styles.modalItem,
                    selectedCustomer?._id === customer._id && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalItemLeft}>
                    <Text style={[
                      styles.modalItemName,
                      selectedCustomer?._id === customer._id && styles.modalItemTextSelected
                    ]}>
                      {customer.name} {customer.lastname}
                    </Text>
                    <Text style={styles.modalItemPhone}>{customer.phone}</Text>
                  </View>
                  {selectedCustomer?._id === customer._id && (
                    <Ionicons name="checkmark" size={24} color="#00D2FF" />
                  )}
                </TouchableOpacity>
              ))}

              {customers.length === 0 && (
                <View style={styles.emptyCustomers}>
                  <Text style={styles.emptyCustomersText}>
                    No hay clientes. Crea uno nuevo.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* New Customer Modal */}
      <Modal visible={showNewCustomerModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Cliente</Text>
              <TouchableOpacity onPress={() => {
                setShowNewCustomerModal(false);
                setNewCustomer({ name: '', lastname: '', phone: '', email: '' });
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
                  placeholder="Juan"
                  placeholderTextColor="#BDBDBD"
                  value={newCustomer.name}
                  onChangeText={(text) => setNewCustomer({ ...newCustomer, name: text })}
                />
              </View>

              {/* Lastname */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Apellido *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Pérez"
                  placeholderTextColor="#BDBDBD"
                  value={newCustomer.lastname}
                  onChangeText={(text) => setNewCustomer({ ...newCustomer, lastname: text })}
                />
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Teléfono *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+593 99 123 4567"
                  placeholderTextColor="#BDBDBD"
                  value={newCustomer.phone}
                  onChangeText={(text) => setNewCustomer({ ...newCustomer, phone: text })}
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
                  value={newCustomer.email}
                  onChangeText={(text) => setNewCustomer({ ...newCustomer, email: text })}
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
                  setShowNewCustomerModal(false);
                  setNewCustomer({ name: '', lastname: '', phone: '', email: '' });
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleCreateCustomer}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveText}>Crear Cliente</Text>
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

  // Initial Selection
  initialContent: {
    padding: 20,
    paddingTop: 40,
  },
  questionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  questionSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#757575',
    marginBottom: 32,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
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

  // Product Card
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  productLeft: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
  },
  productRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInput: {
    width: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },

  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#00D2FF',
    borderStyle: 'dashed',
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D2FF',
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
    color: '#00D2FF',
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
    backgroundColor: '#E8F5E9',
    borderColor: '#00D2FF',
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
  },
  statusButtonTextActive: {
    color: '#00D2FF',
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
    backgroundColor: '#00D2FF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#00D2FF',
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
    backgroundColor: '#E8F5E9',
    borderColor: '#00D2FF',
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
  modalItemPrice: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
  },
  modalItemPhone: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
  },
  modalItemStock: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  modalItemRight: {
    marginLeft: 12,
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  modalItemTextSelected: {
    color: '#00D2FF',
    fontWeight: '600',
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 20,
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
    borderColor: '#00D2FF',
    gap: 8,
  },
  createNewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D2FF',
  },

  // Empty Customers
  emptyCustomers: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyCustomersText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9E9E9E',
    textAlign: 'center',
  },

  // Input Group (for new customer modal)
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
    backgroundColor: '#00D2FF',
    borderRadius: 12,
    paddingVertical: 16,
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
});
