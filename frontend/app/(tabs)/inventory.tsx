import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
  Switch,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../../utils/api';

export default function InventoryScreen() {
  const { user } = useAuth();
  const { highlight } = useLocalSearchParams<{ highlight?: string }>();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    quantity: '',
    price: '',
    cost: '',
    description: '',
    category_id: '',
    min_stock_alert: '10',
    alert_enabled: true,
    image: '',
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setNewProduct({
          ...newProduct,
          image: `data:image/jpeg;base64,${result.assets[0].base64}`,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la imagen');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Necesitamos acceso a tu cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setNewProduct({
          ...newProduct,
          image: `data:image/jpeg;base64,${result.assets[0].base64}`,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Agregar Foto',
      'Selecciona una opción',
      [
        { text: 'Tomar Foto', onPress: takePhoto },
        { text: 'Seleccionar de Galería', onPress: pickImage },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const loadData = () => {
    loadProducts();
    loadCategories();
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.log('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/api/categories', {
        params: { type: 'product' },
      });
      setCategories(response.data);
    } catch (error) {
      console.log('Error loading categories:', error);
    }
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      quantity: product.quantity.toString(),
      price: product.price.toString(),
      cost: product.cost.toString(),
      description: product.description || '',
      category_id: product.category_id || '',
      image: product.image || '',
      min_stock_alert: (product.min_stock_alert || 10).toString(),
      alert_enabled: product.alert_enabled !== false,
    });
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setNewProduct({
      name: '',
      quantity: '',
      price: '',
      cost: '',
      description: '',
      category_id: '',
      min_stock_alert: '10',
      alert_enabled: true,
      image: '',
    });
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      Alert.alert('Error', 'Ingresa al menos el nombre y precio del producto');
      return;
    }

    try {
      const productData = {
        ...newProduct,
        quantity: parseFloat(newProduct.quantity) || 0,
        price: parseFloat(newProduct.price),
        cost: parseFloat(newProduct.cost) || 0,
        min_stock_alert: parseFloat(newProduct.min_stock_alert) || 10,
        alert_enabled: newProduct.alert_enabled,
      };

      if (editingProduct) {
        await api.put(`/api/products/${editingProduct._id}`, productData);
        Alert.alert('Éxito', 'Producto actualizado correctamente');
      } else {
        await api.post('/api/products', productData);
        Alert.alert('Éxito', 'Producto creado correctamente');
      }
      
      closeProductModal();
      loadProducts();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al guardar producto');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName) {
      Alert.alert('Error', 'Ingresa el nombre de la categoría');
      return;
    }

    try {
      await api.post('/api/categories', {
        name: newCategoryName,
        type: 'product',
      });
      Alert.alert('Éxito', 'Categoría creada correctamente');
      setShowCategoryModal(false);
      setNewCategoryName('');
      loadCategories();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al crear categoría');
    }
  };

  const deleteProduct = (productId: string) => {
    setProductToDelete(productId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      await api.delete(`/api/products/${productToDelete}`);
      setProducts(prev => prev.filter(p => p._id !== productToDelete));
      Alert.alert('Éxito', 'Producto eliminado');
      await loadProducts();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo eliminar el producto');
    } finally {
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    }
  };

  const filteredProducts = products.filter((product) =>
    (product.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalInventoryValue = products.reduce(
    (sum, p) => sum + (p.quantity || 0) * (p.cost || 0),
    0
  );

  const lowStockProducts = products.filter(
    (p) => p.alert_enabled && (p.quantity || 0) <= (p.min_stock_alert || 10)
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={loadData}
            tintColor="#00D2FF"
            colors={['#00D2FF']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header YAPPA */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>YAPPA</Text>
            <Text style={styles.screenTitle}>Inventario</Text>
          </View>
        </View>

        {/* Stats KPIs */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#E0F7FA' }]}>
              <Ionicons name="cube" size={20} color="#00D2FF" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{products.length}</Text>
              <Text style={styles.statLabel}>Productos</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="cash" size={20} color="#00D2FF" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>${totalInventoryValue.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Valor Total</Text>
            </View>
          </View>
        </View>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <View style={styles.alertBanner}>
            <View style={styles.alertIconContainer}>
              <Ionicons name="warning" size={20} color="#FF9800" />
            </View>
            <Text style={styles.alertText}>
              {lowStockProducts.length} producto{lowStockProducts.length !== 1 ? 's' : ''} con stock bajo
            </Text>
          </View>
        )}

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#9E9E9E" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar productos..."
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

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => setShowProductModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.primaryActionButtonText}>Nuevo Producto</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => setShowCategoryModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="list-outline" size={20} color="#2196F3" />
            <Text style={styles.secondaryActionButtonText}>Nueva Categoría</Text>
          </TouchableOpacity>
        </View>

        {/* Products List */}
        <Text style={styles.sectionLabel}>PRODUCTOS</Text>

        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="cube-outline" size={48} color="#E0E0E0" />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No se encontraron productos' : 'Sin productos'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {!searchQuery && 'Crea tu primer producto para comenzar'}
            </Text>
          </View>
        ) : (
          <View style={styles.productsList}>
            {filteredProducts.map((product) => {
              const isLowStock = product.alert_enabled && (product.quantity || 0) <= (product.min_stock_alert || 10);
              const isHighlighted = highlightedProduct === product._id;
              
              // Color de fondo animado para el highlight
              const backgroundColor = isHighlighted 
                ? highlightAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#FFFFFF', '#FFF3E0']
                  })
                : '#FFFFFF';
              
              const borderColor = isHighlighted
                ? highlightAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#E0E0E0', '#FF9800']
                  })
                : '#E0E0E0';
              
              return (
                <Animated.View 
                  key={product._id} 
                  style={[
                    styles.productCard,
                    { backgroundColor, borderColor, borderWidth: isHighlighted ? 2 : 1 }
                  ]}
                >
                  {/* Banner de atención para productos resaltados */}
                  {isHighlighted && (
                    <View style={styles.attentionBanner}>
                      <Ionicons name="alert-circle" size={16} color="#FFF" />
                      <Text style={styles.attentionText}>⚡ Requiere atención</Text>
                    </View>
                  )}
                  {product.image && (
                    <Image source={{ uri: product.image }} style={styles.productImage} />
                  )}
                  <View style={styles.productContent}>
                    <View style={styles.productHeader}>
                      <View style={styles.productTitleSection}>
                        <Text style={styles.productName}>{product.name || 'Sin nombre'}</Text>
                        {isLowStock && (
                          <View style={styles.lowStockBadge}>
                            <Text style={styles.lowStockText}>Stock bajo</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.productActions}>
                        <TouchableOpacity 
                          onPress={() => openEditModal(product)}
                          style={styles.actionButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="create-outline" size={20} color="#757575" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => deleteProduct(product._id)}
                          style={styles.actionButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="trash-outline" size={20} color="#F44336" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {product.description && (
                      <Text style={styles.productDescription}>{product.description}</Text>
                    )}
                    
                    <View style={styles.productDetails}>
                      <View style={styles.productDetailItem}>
                        <Text style={styles.productDetailLabel}>Stock</Text>
                        <Text style={[styles.productDetailValue, isLowStock && { color: '#FF9800' }]}>
                          {product.quantity || 0}
                        </Text>
                      </View>
                      <View style={styles.productDetailItem}>
                        <Text style={styles.productDetailLabel}>Precio</Text>
                        <Text style={styles.productDetailValue}>${(product.price || 0).toFixed(2)}</Text>
                      </View>
                      <View style={styles.productDetailItem}>
                        <Text style={styles.productDetailLabel}>Costo</Text>
                        <Text style={styles.productDetailValue}>${(product.cost || 0).toFixed(2)}</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Product Modal */}
      <Modal visible={showProductModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </Text>
              <TouchableOpacity 
                onPress={closeProductModal}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Image */}
              <TouchableOpacity style={styles.imagePickerButton} onPress={showImagePicker}>
                {newProduct.image ? (
                  <Image source={{ uri: newProduct.image }} style={styles.productImagePreview} />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={32} color="#9E9E9E" />
                    <Text style={styles.imagePickerText}>Agregar foto</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Coca Cola 500ml"
                  placeholderTextColor="#BDBDBD"
                  value={newProduct.name}
                  onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descripción opcional"
                  placeholderTextColor="#BDBDBD"
                  value={newProduct.description}
                  onChangeText={(text) => setNewProduct({ ...newProduct, description: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Category */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Categoría</Text>
                <TouchableOpacity 
                  style={styles.pickerContainer}
                  onPress={() => setShowCategoryPicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pickerValue}>
                    {categories.find(c => c._id === newProduct.category_id)?.name || 'Seleccionar'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#9E9E9E" />
                </TouchableOpacity>
              </View>

              {/* Price & Cost */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Precio *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#BDBDBD"
                    value={newProduct.price}
                    onChangeText={(text) => setNewProduct({ ...newProduct, price: text })}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Costo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#BDBDBD"
                    value={newProduct.cost}
                    onChangeText={(text) => setNewProduct({ ...newProduct, cost: text })}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {/* Quantity */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cantidad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#BDBDBD"
                  value={newProduct.quantity}
                  onChangeText={(text) => setNewProduct({ ...newProduct, quantity: text })}
                  keyboardType="numeric"
                />
              </View>

              {/* Alert Settings */}
              <View style={styles.inputGroup}>
                <View style={styles.switchRow}>
                  <Text style={styles.inputLabel}>Alerta de stock bajo</Text>
                  <Switch
                    value={newProduct.alert_enabled}
                    onValueChange={(value) => setNewProduct({ ...newProduct, alert_enabled: value })}
                    trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
                    thumbColor={newProduct.alert_enabled ? '#00D2FF' : '#F5F5F5'}
                  />
                </View>
              </View>

              {newProduct.alert_enabled && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Stock mínimo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10"
                    placeholderTextColor="#BDBDBD"
                    value={newProduct.min_stock_alert}
                    onChangeText={(text) => setNewProduct({ ...newProduct, min_stock_alert: text })}
                    keyboardType="numeric"
                  />
                </View>
              )}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={closeProductModal}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleCreateProduct}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveButtonText}>
                  {editingProduct ? 'Actualizar' : 'Crear'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: 300 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Categoría</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowCategoryModal(false);
                  setNewCategoryName('');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre de la categoría</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Bebidas"
                placeholderTextColor="#BDBDBD"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowCategoryModal(false);
                  setNewCategoryName('');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleCreateCategory}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveButtonText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirm} animationType="fade" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: 250 }]}>
            <View style={styles.deleteModalIcon}>
              <View style={styles.deleteIconCircle}>
                <Ionicons name="trash-outline" size={32} color="#F44336" />
              </View>
            </View>
            <Text style={styles.deleteModalTitle}>Eliminar Producto</Text>
            <Text style={styles.deleteModalMessage}>
              ¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setProductToDelete(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, { backgroundColor: '#F44336' }]}
                onPress={confirmDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal visible={showCategoryPicker} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: 500 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
              <TouchableOpacity 
                onPress={() => setShowCategoryPicker(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#212121" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 24 }}>
              {/* Option: Sin categoría */}
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  !newProduct.category_id && styles.categoryOptionSelected
                ]}
                onPress={() => {
                  setNewProduct({ ...newProduct, category_id: '' });
                  setShowCategoryPicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.categoryOptionText,
                  !newProduct.category_id && styles.categoryOptionTextSelected
                ]}>
                  Sin categoría
                </Text>
                {!newProduct.category_id && (
                  <Ionicons name="checkmark" size={24} color="#00D2FF" />
                )}
              </TouchableOpacity>

              {/* Categories list */}
              {categories.map((category) => (
                <TouchableOpacity
                  key={category._id}
                  style={[
                    styles.categoryOption,
                    newProduct.category_id === category._id && styles.categoryOptionSelected
                  ]}
                  onPress={() => {
                    setNewProduct({ ...newProduct, category_id: category._id });
                    setShowCategoryPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.categoryOptionText,
                    newProduct.category_id === category._id && styles.categoryOptionTextSelected
                  ]}>
                    {category.name}
                  </Text>
                  {newProduct.category_id === category._id && (
                    <Ionicons name="checkmark" size={24} color="#00D2FF" />
                  )}
                </TouchableOpacity>
              ))}

              {categories.length === 0 && (
                <View style={styles.emptyCategories}>
                  <Text style={styles.emptyCategoriesText}>
                    No hay categorías. Crea una nueva primero.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  appName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00D2FF',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212121',
    letterSpacing: -0.5,
  },

  // Stats Section
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#757575',
  },

  // Alert Banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  alertIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#E65100',
  },

  // Search Section
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#212121',
  },

  // Actions Section
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D2FF',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#00D2FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  secondaryActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },

  // Section Label
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  // Products List
  productsList: {
    paddingHorizontal: 20,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F5F5F5',
  },
  productContent: {
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productTitleSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  lowStockBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lowStockText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF9800',
  },
  productActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  productDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
    marginBottom: 12,
    lineHeight: 20,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  productDetailItem: {
    alignItems: 'center',
  },
  productDetailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9E9E9E',
    marginBottom: 4,
  },
  productDetailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9E9E9E',
    textAlign: 'center',
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
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
  },
  modalScroll: {
    paddingHorizontal: 24,
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
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  modalCancelButtonText: {
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
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Image Picker
  imagePickerButton: {
    height: 200,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  imagePickerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9E9E9E',
    marginTop: 8,
  },
  productImagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  pickerValue: {
    fontSize: 16,
    fontWeight: '400',
    color: '#212121',
  },
  row: {
    flexDirection: 'row',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 20,
  },

  // Delete Modal
  deleteModalIcon: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 12,
  },
  deleteModalMessage: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },

  // Category Picker Modal
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  categoryOptionSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#00D2FF',
  },
  categoryOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  categoryOptionTextSelected: {
    color: '#00D2FF',
    fontWeight: '600',
  },
  emptyCategories: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCategoriesText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9E9E9E',
    textAlign: 'center',
  },
  // Attention Banner for highlighted products
  attentionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: -1,
  },
  attentionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 6,
  },
});
