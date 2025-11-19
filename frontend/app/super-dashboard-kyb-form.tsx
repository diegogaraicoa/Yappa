import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../utils/api';
import * as DocumentPicker from 'expo-document-picker';

export default function KYBFormScreen() {
  const router = useRouter();
  const { merchant_id } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [loadingMerchants, setLoadingMerchants] = useState(true);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState(merchant_id as string || '');
  const [kybId, setKybId] = useState('');
  
  // Form fields
  const [nombreLegal, setNombreLegal] = useState('');
  const [rucTaxId, setRucTaxId] = useState('');
  const [direccionFiscal, setDireccionFiscal] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [emailOficial, setEmailOficial] = useState('');
  const [representanteLegal, setRepresentanteLegal] = useState('');
  const [documentoRepresentante, setDocumentoRepresentante] = useState('');
  const [notas, setNotas] = useState('');
  
  const [uploadingDocument, setUploadingDocument] = useState(false);

  useEffect(() => {
    loadMerchants();
  }, []);

  useEffect(() => {
    if (selectedMerchantId) {
      loadKYBData();
    }
  }, [selectedMerchantId]);

  const loadMerchants = async () => {
    try {
      const response = await api.get('/api/dashboard/all-merchants-list');
      setMerchants(response.data.merchants || []);
    } catch (error) {
      console.error('Error loading merchants:', error);
      Alert.alert('Error', 'No se pudieron cargar los merchants');
    } finally {
      setLoadingMerchants(false);
    }
  };

  const loadKYBData = async () => {
    try {
      const response = await api.get(`/api/kyb/${selectedMerchantId}`);
      const kyb = response.data.kyb;
      
      setKybId(kyb.id);
      setNombreLegal(kyb.nombre_legal || '');
      setRucTaxId(kyb.ruc_tax_id || '');
      setDireccionFiscal(kyb.direccion_fiscal || '');
      setTelefonoContacto(kyb.telefono_contacto || '');
      setEmailOficial(kyb.email_oficial || '');
      setRepresentanteLegal(kyb.representante_legal || '');
      setDocumentoRepresentante(kyb.documento_representante || '');
      setNotas(kyb.notas || '');
    } catch (error: any) {
      // 404 significa que no hay KYB aún, está ok
      if (error.response?.status !== 404) {
        console.error('Error loading KYB data:', error);
      }
    }
  };

  const validateForm = (): boolean => {
    if (!selectedMerchantId) {
      Alert.alert('Error', 'Selecciona un merchant');
      return false;
    }
    if (!nombreLegal.trim()) {
      Alert.alert('Error', 'El nombre legal es requerido');
      return false;
    }
    if (!rucTaxId.trim()) {
      Alert.alert('Error', 'El RUC/Tax ID es requerido');
      return false;
    }
    if (!direccionFiscal.trim()) {
      Alert.alert('Error', 'La dirección fiscal es requerida');
      return false;
    }
    if (!telefonoContacto.trim()) {
      Alert.alert('Error', 'El teléfono de contacto es requerido');
      return false;
    }
    if (!emailOficial.trim()) {
      Alert.alert('Error', 'El email oficial es requerido');
      return false;
    }
    if (!representanteLegal.trim()) {
      Alert.alert('Error', 'El representante legal es requerido');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const kybData = {
        merchant_id: selectedMerchantId,
        nombre_legal: nombreLegal.trim(),
        ruc_tax_id: rucTaxId.trim(),
        direccion_fiscal: direccionFiscal.trim(),
        telefono_contacto: telefonoContacto.trim(),
        email_oficial: emailOficial.trim(),
        representante_legal: representanteLegal.trim(),
        documento_representante: documentoRepresentante || null,
        notas: notas.trim() || null,
      };

      await api.post('/api/kyb', kybData);

      Alert.alert(
        'Éxito',
        'Datos KYB guardados exitosamente',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      console.error('Error saving KYB:', error);
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      setUploadingDocument(true);

      const file = result.assets[0];

      // Read file as base64
      if (Platform.OS === 'web') {
        // Web: Use FileReader
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const reader = new FileReader();
        
        reader.onloadend = () => {
          setDocumentoRepresentante(reader.result as string);
          setUploadingDocument(false);
          Alert.alert('Éxito', 'Documento cargado. Guarda el formulario para subir al servidor.');
        };
        
        reader.readAsDataURL(blob);
      } else {
        // Mobile: Direct upload
        if (!kybId) {
          Alert.alert('Info', 'Primero guarda el formulario, luego sube el documento');
          setUploadingDocument(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType
        } as any);

        await api.post(`/api/kyb/upload-document/${kybId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        Alert.alert('Éxito', 'Documento subido exitosamente');
        loadKYBData(); // Reload to get the updated document
      }
    } catch (error: any) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'No se pudo subir el documento');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleRemoveDocument = () => {
    Alert.alert(
      'Confirmar',
      '¿Eliminar documento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => setDocumentoRepresentante('')
        }
      ]
    );
  };

  if (loadingMerchants) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            {kybId ? 'Editar KYB' : 'Agregar KYB'}
          </Text>
          <Text style={styles.headerSubtitle}>Know Your Business</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          {/* Merchant Selector */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Merchant <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              <Ionicons name="storefront" size={20} color="#666" style={styles.pickerIcon} />
              <View style={styles.pickerWrapper}>
                {Platform.OS === 'web' ? (
                  <select
                    style={{
                      width: '100%',
                      height: 44,
                      fontSize: 15,
                      color: '#333',
                      border: 'none',
                      backgroundColor: 'transparent',
                      outline: 'none'
                    }}
                    value={selectedMerchantId}
                    onChange={(e) => setSelectedMerchantId(e.target.value)}
                    disabled={!!merchant_id}
                  >
                    <option value="">Seleccionar merchant</option>
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre} (@{m.username})
                      </option>
                    ))}
                  </select>
                ) : (
                  <Text style={styles.pickerText}>
                    {selectedMerchantId
                      ? merchants.find(m => m.id === selectedMerchantId)?.nombre
                      : 'Seleccionar merchant'}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Nombre Legal */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Nombre Legal del Negocio <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Demo Store S.A."
              placeholderTextColor="#999"
              value={nombreLegal}
              onChangeText={setNombreLegal}
            />
          </View>

          {/* RUC / Tax ID */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              RUC / Tax ID <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 1234567890001"
              placeholderTextColor="#999"
              value={rucTaxId}
              onChangeText={setRucTaxId}
              keyboardType="numeric"
            />
          </View>

          {/* Dirección Fiscal */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Dirección Fiscal Completa <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ej: Av. Principal 123, Quito, Ecuador"
              placeholderTextColor="#999"
              value={direccionFiscal}
              onChangeText={setDireccionFiscal}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Teléfono */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Teléfono de Contacto <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: +593999123456"
              placeholderTextColor="#999"
              value={telefonoContacto}
              onChangeText={setTelefonoContacto}
              keyboardType="phone-pad"
            />
          </View>

          {/* Email Oficial */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Email Oficial <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: contacto@empresa.com"
              placeholderTextColor="#999"
              value={emailOficial}
              onChangeText={setEmailOficial}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Representante Legal */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Representante Legal <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Juan Pérez"
              placeholderTextColor="#999"
              value={representanteLegal}
              onChangeText={setRepresentanteLegal}
            />
          </View>

          {/* Documento del Representante */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Documento del Representante Legal (Opcional)
            </Text>
            <Text style={styles.helperText}>PDF, JPG o PNG - Máx 5MB</Text>
            
            {documentoRepresentante ? (
              <View style={styles.documentPreview}>
                <View style={styles.documentInfo}>
                  <Ionicons name="document-attach" size={24} color="#4CAF50" />
                  <Text style={styles.documentText}>Documento cargado</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={handleRemoveDocument}
                >
                  <Ionicons name="close-circle" size={24} color="#F44336" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUploadDocument}
                disabled={uploadingDocument}
              >
                {uploadingDocument ? (
                  <ActivityIndicator size="small" color="#2196F3" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={24} color="#2196F3" />
                    <Text style={styles.uploadButtonText}>Subir Documento</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Notas */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Notas (Opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notas adicionales..."
              placeholderTextColor="#999"
              value={notas}
              onChangeText={setNotas}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="save" size={20} color="#FFF" />
                <Text style={styles.submitButtonText}>
                  {kybId ? 'Actualizar KYB' : 'Guardar KYB'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#F44336',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  pickerIcon: {
    marginRight: 12,
  },
  pickerWrapper: {
    flex: 1,
  },
  pickerText: {
    fontSize: 15,
    color: '#333',
    paddingVertical: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 20,
    gap: 12,
  },
  uploadButtonText: {
    fontSize: 15,
    color: '#2196F3',
    fontWeight: '600',
  },
  documentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  documentText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 12,
    gap: 12,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
