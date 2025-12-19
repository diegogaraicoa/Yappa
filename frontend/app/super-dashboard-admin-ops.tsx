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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../utils/api';

export default function AdminOpsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [admins, setAdmins] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [clerks, setClerks] = useState([]);
  
  // Accordion states
  const [expandedSection, setExpandedSection] = useState<'admins' | 'merchants' | 'clerks' | null>('admins');
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'admin' | 'merchant' | 'clerk' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  
  // Form states
  const [formData, setFormData] = useState<any>({});
  const [isActive, setIsActive] = useState(true);
  
  // Search states
  const [searchAdmin, setSearchAdmin] = useState('');
  const [searchMerchant, setSearchMerchant] = useState('');
  const [searchClerk, setSearchClerk] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [adminsRes, merchantsRes, clerksRes] = await Promise.all([
        api.get('/api/admin-ops/admins'),
        api.get('/api/admin-ops/merchants'),
        api.get('/api/admin-ops/clerks')
      ]);
      
      setAdmins(adminsRes.data.admins || []);
      setMerchants(merchantsRes.data.merchants || []);
      setClerks(clerksRes.data.clerks || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('❌ Error: No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: 'admins' | 'merchants' | 'clerks') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // CRUD Handlers
  const openCreateModal = (type: 'admin' | 'merchant' | 'clerk') => {
    setModalType(type);
    setIsEditing(false);
    setCurrentItem(null);
    
    if (type === 'admin') {
      setFormData({ nombre: '', email: '', telefono: '' });
    } else if (type === 'merchant') {
      setFormData({ 
        admin_id: admins.length > 0 ? admins[0].id : '', 
        username: '', 
        password: '', 
        nombre: '', 
        direccion: '', 
        telefono: '' 
      });
    } else {
      setFormData({ 
        merchant_id: merchants.length > 0 ? merchants[0].id : '', 
        email: '', 
        password: '', 
        nombre: '', 
        whatsapp_number: '', 
        role: 'employee' 
      });
    }
    
    setModalVisible(true);
  };

  const openEditModal = (type: 'admin' | 'merchant' | 'clerk', item: any) => {
    setModalType(type);
    setIsEditing(true);
    setCurrentItem(item);
    setIsActive(item.active !== false); // Default to true if not specified
    
    if (type === 'admin') {
      setFormData({
        nombre: item.nombre || '',
        email: item.email || '',
        telefono: item.telefono || ''
      });
    } else if (type === 'merchant') {
      setFormData({
        admin_id: item.admin_id || '',
        username: item.username || '',
        password: '',
        nombre: item.nombre || '',
        direccion: item.direccion || '',
        telefono: item.telefono || ''
      });
    } else {
      setFormData({
        merchant_id: item.merchant_id || '',
        email: item.email || '',
        password: '',
        nombre: item.nombre || '',
        whatsapp_number: item.whatsapp_number || '',
        role: item.role || 'employee'
      });
    }
    
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      let endpoint = '';
      const dataToSend = { ...formData, active: isActive };
      
      if (modalType === 'admin') {
        if (!formData.nombre?.trim() || !formData.email?.trim()) {
          alert('❌ Error: Nombre y email son obligatorios');
          return;
        }
        endpoint = isEditing 
          ? `/api/admin-ops/admins/${currentItem.id}` 
          : '/api/admin-ops/admins';
      } else if (modalType === 'merchant') {
        if (!formData.nombre?.trim() || !formData.username?.trim() || (!isEditing && !formData.password?.trim())) {
          alert('❌ Error: Campos obligatorios faltantes');
          return;
        }
        endpoint = isEditing 
          ? `/api/admin-ops/merchants/${currentItem.id}` 
          : '/api/admin-ops/merchants';
      } else if (modalType === 'clerk') {
        if (!formData.nombre?.trim() || !formData.email?.trim() || (!isEditing && !formData.password?.trim())) {
          alert('❌ Error: Campos obligatorios faltantes');
          return;
        }
        endpoint = isEditing 
          ? `/api/admin-ops/clerks/${currentItem.id}` 
          : '/api/admin-ops/clerks';
      }
      
      if (isEditing) {
        await api.patch(endpoint, dataToSend);
        alert('✅ Actualizado correctamente');
      } else {
        await api.post(endpoint, dataToSend);
        alert('✅ Creado correctamente');
      }
      
      setModalVisible(false);
      loadAllData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Error al guardar';
      alert('❌ Error: ' + errorMsg);
    }
  };

  const handleDelete = async (type: 'admin' | 'merchant' | 'clerk', item: any) => {
    const typeName = type === 'admin' ? 'admin' : type === 'merchant' ? 'merchant' : 'clerk';
    const confirmed = window.confirm(`¿Estás seguro de eliminar este ${typeName}?`);
    
    if (!confirmed) return;
    
    try {
      const endpoint = `/api/admin-ops/${type === 'admin' ? 'admins' : type === 'merchant' ? 'merchants' : 'clerks'}/${item.id}`;
      await api.delete(endpoint);
      alert('✅ Eliminado correctamente');
      loadAllData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Error al eliminar';
      alert('❌ Error: ' + errorMsg);
    }
  };

  // Filter functions
  const filteredAdmins = admins.filter((a: any) => 
    a.nombre.toLowerCase().includes(searchAdmin.toLowerCase()) ||
    a.email.toLowerCase().includes(searchAdmin.toLowerCase())
  );

  const filteredMerchants = merchants.filter((m: any) => 
    m.nombre.toLowerCase().includes(searchMerchant.toLowerCase()) ||
    m.username.toLowerCase().includes(searchMerchant.toLowerCase())
  );

  const filteredClerks = clerks.filter((c: any) => 
    c.nombre.toLowerCase().includes(searchClerk.toLowerCase()) ||
    c.email.toLowerCase().includes(searchClerk.toLowerCase())
  );

  if (loading) {
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
          <Text style={styles.headerTitle}>Admin Ops</Text>
          <Text style={styles.headerSubtitle}>Gestión completa del sistema</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* ACCORDION 1: ADMINS */}
        <View style={styles.accordionContainer}>
          <TouchableOpacity 
            style={styles.accordionHeader}
            onPress={() => toggleSection('admins')}
          >
            <View style={styles.accordionHeaderLeft}>
              <Ionicons 
                name="business" 
                size={24} 
                color="#9C27B0" 
                style={styles.accordionIcon} 
              />
              <View>
                <Text style={styles.accordionTitle}>Admins</Text>
                <Text style={styles.accordionCount}>{admins.length} total</Text>
              </View>
            </View>
            <Ionicons 
              name={expandedSection === 'admins' ? 'chevron-up' : 'chevron-down'} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>

          {expandedSection === 'admins' && (
            <View style={styles.accordionContent}>
              <View style={styles.accordionToolbar}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar admin..."
                  placeholderTextColor="#999"
                  value={searchAdmin}
                  onChangeText={setSearchAdmin}
                />
                <TouchableOpacity 
                  style={[styles.addButton, { backgroundColor: '#9C27B0' }]}
                  onPress={() => openCreateModal('admin')}
                >
                  <Ionicons name="add" size={20} color="#FFF" />
                  <Text style={styles.addButtonText}>Crear</Text>
                </TouchableOpacity>
              </View>

              {filteredAdmins.map((admin: any, index: number) => (
                <View key={index} style={[
                  styles.itemCard,
                  admin.active === false && styles.itemCardInactive
                ]}>
                  {admin.active === false && (
                    <View style={styles.inactiveBanner}>
                      <Ionicons name="ban" size={16} color="#FFF" />
                      <Text style={styles.inactiveBannerText}>DESACTIVADO - Sin acceso</Text>
                    </View>
                  )}
                  <View style={[styles.itemInfo, admin.active === false && { paddingTop: 28 }]}>
                    <Text style={styles.itemTitle}>{admin.nombre}</Text>
                    <Text style={styles.itemSubtitle}>{admin.email}</Text>
                    <View style={styles.itemStats}>
                      <Text style={styles.itemStat}>🏪 {admin.merchants_count} merchants</Text>
                      <Text style={styles.itemStat}>👥 {admin.clerks_count} clerks</Text>
                      {admin.has_kyb && (
                        <View style={styles.kybBadge}>
                          <Text style={styles.kybText}>KYB: {admin.kyb_status}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={() => openEditModal('admin', admin)}
                    >
                      <Ionicons name="pencil" size={18} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={() => handleDelete('admin', admin)}
                    >
                      <Ionicons name="trash" size={18} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {filteredAdmins.length === 0 && (
                <Text style={styles.emptyText}>No se encontraron admins</Text>
              )}
            </View>
          )}
        </View>

        {/* ACCORDION 2: MERCHANTS */}
        <View style={styles.accordionContainer}>
          <TouchableOpacity 
            style={styles.accordionHeader}
            onPress={() => toggleSection('merchants')}
          >
            <View style={styles.accordionHeaderLeft}>
              <Ionicons 
                name="storefront" 
                size={24} 
                color="#00D2FF" 
                style={styles.accordionIcon} 
              />
              <View>
                <Text style={styles.accordionTitle}>Merchants</Text>
                <Text style={styles.accordionCount}>{merchants.length} total</Text>
              </View>
            </View>
            <Ionicons 
              name={expandedSection === 'merchants' ? 'chevron-up' : 'chevron-down'} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>

          {expandedSection === 'merchants' && (
            <View style={styles.accordionContent}>
              <View style={styles.accordionToolbar}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar merchant..."
                  placeholderTextColor="#999"
                  value={searchMerchant}
                  onChangeText={setSearchMerchant}
                />
                <TouchableOpacity 
                  style={[styles.addButton, { backgroundColor: '#00D2FF' }]}
                  onPress={() => openCreateModal('merchant')}
                >
                  <Ionicons name="add" size={20} color="#FFF" />
                  <Text style={styles.addButtonText}>Crear</Text>
                </TouchableOpacity>
              </View>

              {filteredMerchants.map((merchant: any, index: number) => (
                <View key={index} style={[
                  styles.itemCard,
                  merchant.active === false && styles.itemCardInactive
                ]}>
                  {merchant.active === false && (
                    <View style={styles.inactiveBanner}>
                      <Ionicons name="ban" size={16} color="#FFF" />
                      <Text style={styles.inactiveBannerText}>DESACTIVADO - Sin acceso</Text>
                    </View>
                  )}
                  <View style={[styles.itemInfo, merchant.active === false && { paddingTop: 28 }]}>
                    <Text style={styles.itemTitle}>{merchant.nombre}</Text>
                    <Text style={styles.itemSubtitle}>@{merchant.username}</Text>
                    <View style={styles.itemStats}>
                      <Text style={styles.itemStat}>🏢 {merchant.admin_nombre}</Text>
                      <Text style={styles.itemStat}>👥 {merchant.clerks_count} clerks</Text>
                    </View>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={() => openEditModal('merchant', merchant)}
                    >
                      <Ionicons name="pencil" size={18} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={() => handleDelete('merchant', merchant)}
                    >
                      <Ionicons name="trash" size={18} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {filteredMerchants.length === 0 && (
                <Text style={styles.emptyText}>No se encontraron merchants</Text>
              )}
            </View>
          )}
        </View>

        {/* ACCORDION 3: CLERKS */}
        <View style={styles.accordionContainer}>
          <TouchableOpacity 
            style={styles.accordionHeader}
            onPress={() => toggleSection('clerks')}
          >
            <View style={styles.accordionHeaderLeft}>
              <Ionicons 
                name="people" 
                size={24} 
                color="#FF9800" 
                style={styles.accordionIcon} 
              />
              <View>
                <Text style={styles.accordionTitle}>Clerks</Text>
                <Text style={styles.accordionCount}>{clerks.length} total</Text>
              </View>
            </View>
            <Ionicons 
              name={expandedSection === 'clerks' ? 'chevron-up' : 'chevron-down'} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>

          {expandedSection === 'clerks' && (
            <View style={styles.accordionContent}>
              <View style={styles.accordionToolbar}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar clerk..."
                  placeholderTextColor="#999"
                  value={searchClerk}
                  onChangeText={setSearchClerk}
                />
                <TouchableOpacity 
                  style={[styles.addButton, { backgroundColor: '#FF9800' }]}
                  onPress={() => openCreateModal('clerk')}
                >
                  <Ionicons name="add" size={20} color="#FFF" />
                  <Text style={styles.addButtonText}>Crear</Text>
                </TouchableOpacity>
              </View>

              {filteredClerks.map((clerk: any, index: number) => (
                <View key={index} style={[
                  styles.itemCard,
                  clerk.active === false && styles.itemCardInactive
                ]}>
                  {clerk.active === false && (
                    <View style={styles.inactiveBanner}>
                      <Ionicons name="ban" size={16} color="#FFF" />
                      <Text style={styles.inactiveBannerText}>DESACTIVADO - Sin acceso</Text>
                    </View>
                  )}
                  <View style={[styles.itemInfo, clerk.active === false && { paddingTop: 28 }]}>
                    <Text style={styles.itemTitle}>{clerk.nombre}</Text>
                    <Text style={styles.itemSubtitle}>{clerk.email}</Text>
                    <View style={styles.itemStats}>
                      <Text style={styles.itemStat}>🏪 {clerk.merchant_nombre}</Text>
                      <Text style={styles.itemStat}>
                        {clerk.role === 'owner' ? '👑 Owner' : '👤 Employee'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={() => openEditModal('clerk', clerk)}
                    >
                      <Ionicons name="pencil" size={18} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={() => handleDelete('clerk', clerk)}
                    >
                      <Ionicons name="trash" size={18} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {filteredClerks.length === 0 && (
                <Text style={styles.emptyText}>No se encontraron clerks</Text>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* CRUD Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Editar' : 'Crear'} {modalType === 'admin' ? 'Admin' : modalType === 'merchant' ? 'Merchant' : 'Clerk'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {modalType === 'admin' && (
                <>
                  <Text style={styles.label}>Nombre *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.nombre}
                    onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                    placeholder="Nombre completo"
                    placeholderTextColor="#999"
                  />

                  <Text style={styles.label}>Email *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    placeholder="email@example.com"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <Text style={styles.label}>Teléfono</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.telefono}
                    onChangeText={(text) => setFormData({ ...formData, telefono: text })}
                    placeholder="+593999123456"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                  />

                  {isEditing && (
                    <>
                      <Text style={styles.label}>Estado de Acceso</Text>
                      <View style={styles.activeToggleContainer}>
                        <TouchableOpacity
                          style={[
                            styles.toggleOption,
                            isActive && styles.toggleOptionActive
                          ]}
                          onPress={() => setIsActive(true)}
                        >
                          <Ionicons 
                            name="checkmark-circle" 
                            size={20} 
                            color={isActive ? '#FFF' : '#00D2FF'} 
                          />
                          <Text style={[
                            styles.toggleText,
                            isActive && styles.toggleTextActive
                          ]}>
                            Activo - Tiene acceso al app
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.toggleOption,
                            !isActive && styles.toggleOptionInactive
                          ]}
                          onPress={() => setIsActive(false)}
                        >
                          <Ionicons 
                            name="close-circle" 
                            size={20} 
                            color={!isActive ? '#FFF' : '#F44336'} 
                          />
                          <Text style={[
                            styles.toggleText,
                            !isActive && styles.toggleTextInactive
                          ]}>
                            Inactivo - Sin acceso al app
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </>
              )}

              {modalType === 'merchant' && (
                <>
                  {/* Admin selector - only when creating, not editing */}
                  {!isEditing ? (
                    <>
                      <Text style={styles.label}>Admin *</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorContainer}>
                        {admins.map((admin: any) => (
                          <TouchableOpacity
                            key={admin.id}
                            style={[
                              styles.selectorOption,
                              formData.admin_id === admin.id && styles.selectorOptionSelected
                            ]}
                            onPress={() => setFormData({ ...formData, admin_id: admin.id })}
                          >
                            <Text style={[
                              styles.selectorText,
                              formData.admin_id === admin.id && styles.selectorTextSelected
                            ]}>
                              {admin.nombre}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  ) : (
                    <View style={styles.readOnlyField}>
                      <Text style={styles.label}>Admin</Text>
                      <Text style={styles.readOnlyValue}>
                        {admins.find((a: any) => a.id === formData.admin_id)?.nombre || 'N/A'}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.label}>Nombre *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.nombre}
                    onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                    placeholder="Nombre del merchant"
                    placeholderTextColor="#999"
                  />

                  <Text style={styles.label}>Username *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.username}
                    onChangeText={(text) => setFormData({ ...formData, username: text })}
                    placeholder="username_tienda"
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                  />

                  <Text style={styles.label}>Contraseña {!isEditing && '*'}</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    placeholder={isEditing ? "Dejar vacío para mantener actual" : "Contraseña"}
                    placeholderTextColor="#999"
                    secureTextEntry
                  />

                  <Text style={styles.label}>Dirección</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.direccion}
                    onChangeText={(text) => setFormData({ ...formData, direccion: text })}
                    placeholder="Dirección"
                    placeholderTextColor="#999"
                  />

                  <Text style={styles.label}>Teléfono</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.telefono}
                    onChangeText={(text) => setFormData({ ...formData, telefono: text })}
                    placeholder="+593999123456"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                  />

                  {isEditing && (
                    <>
                      <Text style={styles.label}>Estado de Acceso</Text>
                      <View style={styles.activeToggleContainer}>
                        <TouchableOpacity
                          style={[
                            styles.toggleOption,
                            isActive && styles.toggleOptionActive
                          ]}
                          onPress={() => setIsActive(true)}
                        >
                          <Ionicons 
                            name="checkmark-circle" 
                            size={20} 
                            color={isActive ? '#FFF' : '#00D2FF'} 
                          />
                          <Text style={[
                            styles.toggleText,
                            isActive && styles.toggleTextActive
                          ]}>
                            Activo - Tiene acceso al app
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.toggleOption,
                            !isActive && styles.toggleOptionInactive
                          ]}
                          onPress={() => setIsActive(false)}
                        >
                          <Ionicons 
                            name="close-circle" 
                            size={20} 
                            color={!isActive ? '#FFF' : '#F44336'} 
                          />
                          <Text style={[
                            styles.toggleText,
                            !isActive && styles.toggleTextInactive
                          ]}>
                            Inactivo - Sin acceso al app
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </>
              )}

              {modalType === 'clerk' && (
                <>
                  {/* Merchant selector - only when creating, not editing */}
                  {!isEditing ? (
                    <>
                      <Text style={styles.label}>Merchant *</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorContainer}>
                        {merchants.map((merchant: any) => (
                          <TouchableOpacity
                            key={merchant.id}
                            style={[
                              styles.selectorOption,
                              formData.merchant_id === merchant.id && styles.selectorOptionSelected
                            ]}
                            onPress={() => setFormData({ ...formData, merchant_id: merchant.id })}
                          >
                            <Text style={[
                              styles.selectorText,
                              formData.merchant_id === merchant.id && styles.selectorTextSelected
                            ]}>
                              {merchant.nombre}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  ) : (
                    <View style={styles.readOnlyField}>
                      <Text style={styles.label}>Merchant</Text>
                      <Text style={styles.readOnlyValue}>
                        {merchants.find((m: any) => m.id === formData.merchant_id)?.nombre || 'N/A'}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.label}>Nombre *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.nombre}
                    onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                    placeholder="Nombre del clerk"
                    placeholderTextColor="#999"
                  />

                  <Text style={styles.label}>Email *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    placeholder="email@example.com"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <Text style={styles.label}>Contraseña {!isEditing && '*'}</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    placeholder={isEditing ? "Dejar vacío para mantener actual" : "Contraseña"}
                    placeholderTextColor="#999"
                    secureTextEntry
                  />

                  <Text style={styles.label}>WhatsApp</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.whatsapp_number}
                    onChangeText={(text) => setFormData({ ...formData, whatsapp_number: text })}
                    placeholder="+593999123456"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                  />

                  <Text style={styles.label}>Role</Text>
                  <View style={styles.roleContainer}>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        formData.role === 'employee' && styles.roleOptionSelected
                      ]}
                      onPress={() => setFormData({ ...formData, role: 'employee' })}
                    >
                      <Text style={[
                        styles.roleText,
                        formData.role === 'employee' && styles.roleTextSelected
                      ]}>
                        Employee
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        formData.role === 'owner' && styles.roleOptionSelected
                      ]}
                      onPress={() => setFormData({ ...formData, role: 'owner' })}
                    >
                      <Text style={[
                        styles.roleText,
                        formData.role === 'owner' && styles.roleTextSelected
                      ]}>
                        Owner
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {isEditing && (
                    <>
                      <Text style={styles.label}>Estado de Acceso</Text>
                      <View style={styles.activeToggleContainer}>
                        <TouchableOpacity
                          style={[
                            styles.toggleOption,
                            isActive && styles.toggleOptionActive
                          ]}
                          onPress={() => setIsActive(true)}
                        >
                          <Ionicons 
                            name="checkmark-circle" 
                            size={20} 
                            color={isActive ? '#FFF' : '#00D2FF'} 
                          />
                          <Text style={[
                            styles.toggleText,
                            isActive && styles.toggleTextActive
                          ]}>
                            Activo - Tiene acceso al app
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.toggleOption,
                            !isActive && styles.toggleOptionInactive
                          ]}
                          onPress={() => setIsActive(false)}
                        >
                          <Ionicons 
                            name="close-circle" 
                            size={20} 
                            color={!isActive ? '#FFF' : '#F44336'} 
                          />
                          <Text style={[
                            styles.toggleText,
                            !isActive && styles.toggleTextInactive
                          ]}>
                            Inactivo - Sin acceso al app
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Actualizar' : 'Crear'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backButton: { padding: 8 },
  headerTextContainer: { flex: 1, marginLeft: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  scrollView: { flex: 1 },
  
  // Accordion styles
  accordionContainer: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFF' },
  accordionHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  accordionIcon: { marginRight: 12 },
  accordionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  accordionCount: { fontSize: 13, color: '#666', marginTop: 2 },
  accordionContent: { padding: 16, paddingTop: 0, backgroundColor: '#FAFAFA' },
  accordionToolbar: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  searchInput: { flex: 1, height: 40, backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 12, fontSize: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  addButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6 },
  addButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  
  // Item card styles
  itemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E0E0E0', position: 'relative' },
  itemCardInactive: { backgroundColor: '#FFF5F5', borderColor: '#FFCDD2', borderWidth: 2 },
  inactiveBanner: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: '#F44336', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 4, 
    borderTopLeftRadius: 8, 
    borderTopRightRadius: 8,
    gap: 6,
    zIndex: 10,
  },
  inactiveBannerText: { 
    color: '#FFF', 
    fontSize: 11, 
    fontWeight: '700', 
    letterSpacing: 0.5,
  },
  itemInfo: { flex: 1, paddingTop: 0 },
  itemTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  itemSubtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  itemStats: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 8 },
  itemStat: { fontSize: 12, color: '#999' },
  kybBadge: { backgroundColor: '#2196F3', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  kybText: { fontSize: 10, color: '#FFF', fontWeight: '600' },
  itemActions: { flexDirection: 'row', gap: 8 },
  iconButton: { padding: 8 },
  emptyText: { textAlign: 'center', color: '#999', paddingVertical: 20, fontSize: 14 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  modalBody: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: '#333' },
  selectorContainer: { marginBottom: 12 },
  selectorOption: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F5F5F5', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  selectorOptionSelected: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  selectorText: { fontSize: 14, color: '#666', fontWeight: '500' },
  selectorTextSelected: { color: '#FFF', fontWeight: '600' },
  readOnlyField: { marginBottom: 16, padding: 12, backgroundColor: '#F5F5F5', borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  readOnlyValue: { fontSize: 15, color: '#333', fontWeight: '500', marginTop: 4 },
  roleContainer: { flexDirection: 'row', gap: 12 },
  roleOption: { flex: 1, paddingVertical: 12, backgroundColor: '#F5F5F5', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  roleOptionSelected: { backgroundColor: '#9C27B0', borderColor: '#9C27B0' },
  roleText: { fontSize: 14, color: '#666', fontWeight: '500' },
  roleTextSelected: { color: '#FFF', fontWeight: '600' },
  modalFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#F5F5F5' },
  saveButton: { backgroundColor: '#2196F3' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  
  // Toggle styles
  activeToggleContainer: { flexDirection: 'column', gap: 8, marginTop: 8 },
  toggleOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#F5F5F5', gap: 10 },
  toggleOptionActive: { backgroundColor: '#00D2FF', borderColor: '#00D2FF' },
  toggleOptionInactive: { backgroundColor: '#F44336', borderColor: '#F44336' },
  toggleText: { fontSize: 14, color: '#666', fontWeight: '500', flex: 1 },
  toggleTextActive: { color: '#FFF', fontWeight: '600' },
  toggleTextInactive: { color: '#FFF', fontWeight: '600' },
});
