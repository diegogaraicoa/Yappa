import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../utils/api';

export default function InventoryScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    quantity: '',
    price: '',
    cost: '',
    description: '',
    category_id: '',
    min_stock_alert: '10',
    alert_enabled: true,
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
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería para agregar fotos');
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

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      Alert.alert('Error', 'Ingresa al menos el nombre y precio del producto');
      return;
    }

    try {
      await api.post('/api/products', {
        ...newProduct,
        quantity: parseFloat(newProduct.quantity) || 0,
        price: parseFloat(newProduct.price),
        cost: parseFloat(newProduct.cost) || 0,
      });
      Alert.alert('Éxito', 'Producto creado correctamente');
      setShowProductModal(false);
      setNewProduct({
        name: '',
        quantity: '',
        price: '',
        cost: '',
        description: '',
        category_id: '',
        min_stock_alert: '10',
        alert_enabled: true,
      });
      loadProducts();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al crear producto');
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

  const deleteProduct = async (productId: string) => {
    Alert.alert(
      'Eliminar Producto',
      '¿Estás seguro de que quieres eliminar este producto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/products/${productId}`);
              Alert.alert('Éxito', 'Producto eliminado');
              loadProducts();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          },
        },
      ]
    );
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.quantity * p.cost,
    0
  );

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statLabel}>Productos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${totalInventoryValue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Valor Total</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar productos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowProductModal(true)}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Nuevo Producto</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
          onPress={() => setShowCategoryModal(true)}
        >
          <Ionicons name="list" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Nueva Categoría</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron productos' : 'No hay productos aún'}
            </Text>
            <Text style={styles.emptySubtext}>
              {!searchQuery && 'Crea tu primer producto'}
            </Text>
          </View>
        ) : (
          filteredProducts.map((product) => (
            <View key={product._id} style={styles.productCard}>
              <View style={styles.productHeader}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  {product.description && (
                    <Text style={styles.productDescription}>
                      {product.description}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => deleteProduct(product._id)}>
                  <Ionicons name="trash-outline" size={20} color="#f44336" />
                </TouchableOpacity>
              </View>
              <View style={styles.productDetails}>
                <View style={styles.productDetail}>
                  <Text style={styles.productDetailLabel}>Stock</Text>
                  <Text style={styles.productDetailValue}>
                    {product.quantity}
                  </Text>
                </View>
                <View style={styles.productDetail}>
                  <Text style={styles.productDetailLabel}>Precio</Text>
                  <Text style={styles.productDetailValue}>
                    ${product.price.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.productDetail}>
                  <Text style={styles.productDetailLabel}>Costo</Text>
                  <Text style={styles.productDetailValue}>
                    ${product.cost.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Product Modal */}
      <Modal visible={showProductModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Producto</Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.inputLabel}>Foto del Producto</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={showImagePicker}>
                {newProduct.image ? (
                  <Image source={{ uri: newProduct.image }} style={styles.productImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera" size={40} color="#999" />
                    <Text style={styles.imagePlaceholderText}>
                      Tomar foto o seleccionar
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={newProduct.name}
                onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
                placeholder="Nombre del producto"
              />

              <Text style={styles.inputLabel}>Cantidad</Text>
              <TextInput
                style={styles.input}
                value={newProduct.quantity}
                onChangeText={(text) => setNewProduct({ ...newProduct, quantity: text })}
                placeholder="0"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Precio de Venta *</Text>
              <TextInput
                style={styles.input}
                value={newProduct.price}
                onChangeText={(text) => setNewProduct({ ...newProduct, price: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>Costo</Text>
              <TextInput
                style={styles.input}
                value={newProduct.cost}
                onChangeText={(text) => setNewProduct({ ...newProduct, cost: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newProduct.description}
                onChangeText={(text) =>
                  setNewProduct({ ...newProduct, description: text })
                }
                placeholder="Descripción del producto"
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateProduct}
              >
                <Text style={styles.submitButtonText}>Crear Producto</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Create Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: '40%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Categoría</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Nombre de la categoría"
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateCategory}
            >
              <Text style={styles.submitButtonText}>Crear Categoría</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
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
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  productDetail: {
    alignItems: 'center',
  },
  productDetailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
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
  imagePickerButton: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});
