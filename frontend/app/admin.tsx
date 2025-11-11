import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import * as DocumentPicker from 'expo-document-picker';

export default function AdminConsoleScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const response = await api.get('/api/admin/analytics');
        setAnalytics(response.data);
      } else if (activeTab === 'products') {
        const response = await api.get('/api/products');
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      // Read file content
      const response = await fetch(result.assets[0].uri);
      const text = await response.text();

      // Parse CSV
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const parsedData = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim() || '';
        });
        parsedData.push(row);
      }

      setUploadData(parsedData);
      setShowUploadModal(true);
    } catch (error) {
      Alert.alert('Error', 'No se pudo leer el archivo CSV');
    }
  };

  const confirmUpload = async () => {
    setUploading(true);
    try {
      const response = await api.post('/api/admin/products/bulk-upload', {
        products: uploadData
      });

      setShowUploadModal(false);
      Alert.alert(
        '✅ Carga Exitosa',
        `Creados: ${response.data.created}\nActualizados: ${response.data.updated}\nErrores: ${response.data.errors.length}`
      );
      loadData();
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cargar los productos');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = 'name,quantity,price,cost,category,min_stock_alert,alert_enabled,description\nCoca Cola 2L,50,2.50,1.80,Bebidas,10,true,Gaseosa Coca Cola 2 litros\n';
    // En web, crear un link de descarga
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_productos.csv';
    a.click();
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Console</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Ionicons name="stats-chart" size={20} color={activeTab === 'dashboard' ? '#4CAF50' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.activeTab]}
          onPress={() => setActiveTab('products')}
        >
          <Ionicons name="cube" size={20} color={activeTab === 'products' ? '#4CAF50' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
            Productos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        ) : activeTab === 'dashboard' ? (
          <View style={styles.dashboard}>
            <Text style={styles.sectionTitle}>Resumen General</Text>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="trending-up" size={32} color="#fff" />
                <Text style={styles.statValue}>${analytics?.sales?.month?.toFixed(2) || '0'}</Text>
                <Text style={styles.statLabel}>Ventas del Mes</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#FF9800' }]}>
                <Ionicons name="cash" size={32} color="#fff" />
                <Text style={styles.statValue}>${analytics?.balance?.month?.toFixed(2) || '0'}</Text>
                <Text style={styles.statLabel}>Balance del Mes</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#2196F3' }]}>
                <Ionicons name="cube" size={32} color="#fff" />
                <Text style={styles.statValue}>{analytics?.products?.total || 0}</Text>
                <Text style={styles.statLabel}>Total Productos</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#f44336' }]}>
                <Ionicons name="alert-circle" size={32} color="#fff" />
                <Text style={styles.statValue}>{analytics?.products?.low_stock || 0}</Text>
                <Text style={styles.statLabel}>Stock Bajo</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Productos Más Vendidos</Text>
            {analytics?.top_products?.map((product: any, index: number) => (
              <View key={index} style={styles.topProductCard}>
                <Text style={styles.topProductName}>
                  {index + 1}. {product.product_name}
                </Text>
                <Text style={styles.topProductStats}>
                  Cantidad: {product.quantity_sold} | Ingresos: ${product.revenue.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.productsSection}>
            <View style={styles.productsHeader}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar productos..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity style={styles.uploadButton} onPress={handleFileUpload}>
                <Ionicons name="cloud-upload" size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>Cargar CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.templateButton} onPress={downloadTemplate}>
                <Ionicons name="download" size={20} color="#4CAF50" />
              </TouchableOpacity>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Producto</Text>
              <Text style={styles.tableHeaderText}>Cantidad</Text>
              <Text style={styles.tableHeaderText}>Precio</Text>
              <Text style={styles.tableHeaderText}>Costo</Text>
            </View>

            {filteredProducts.map((product) => (
              <View key={product._id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{product.name}</Text>
                <Text style={styles.tableCell}>{product.quantity}</Text>
                <Text style={styles.tableCell}>${product.price}</Text>
                <Text style={styles.tableCell}>${product.cost}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={showUploadModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Vista Previa de Carga</Text>
            <Text style={styles.modalSubtitle}>
              {uploadData.length} productos listos para cargar
            </Text>

            <ScrollView style={styles.modalScroll}>
              {uploadData.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.previewItem}>
                  <Text style={styles.previewText}>{item.name}</Text>
                  <Text style={styles.previewSubtext}>
                    ${item.price} | Stock: {item.quantity}
                  </Text>
                </View>
              ))}
              {uploadData.length > 5 && (
                <Text style={styles.moreText}>
                  ... y {uploadData.length - 5} más
                </Text>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowUploadModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmar</Text>
                )}
              </Pressable>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    padding: 16,
    paddingTop: 48,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  dashboard: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  topProductCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  topProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  topProductStats: {
    fontSize: 14,
    color: '#666',
  },
  productsSection: {
    padding: 16,
  },
  productsHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  templateButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  modalScroll: {
    maxHeight: 300,
    marginBottom: 16,
  },
  previewItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  previewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  previewSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  moreText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 12,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
