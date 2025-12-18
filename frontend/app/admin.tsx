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
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({});
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSupportModal, setShowSupportModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeSection]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeSection) {
        case 'dashboard':
          const [analytics, comparisons] = await Promise.all([
            api.get('/api/admin/analytics'),
            api.get('/api/admin/comparisons')
          ]);
          setData({ analytics: analytics.data, comparisons: comparisons.data });
          break;
        case 'products':
          const [products, prodAnalytics] = await Promise.all([
            api.get('/api/products'),
            api.get('/api/admin/products/analytics')
          ]);
          setData({ products: products.data, analytics: prodAnalytics.data });
          break;
        case 'customers':
          const [customers, custAnalytics] = await Promise.all([
            api.get('/api/customers'),
            api.get('/api/admin/customers/analytics')
          ]);
          setData({ customers: customers.data, analytics: custAnalytics.data });
          break;
        case 'suppliers':
          const [suppliers, suppAnalytics] = await Promise.all([
            api.get('/api/suppliers'),
            api.get('/api/admin/suppliers/analytics')
          ]);
          setData({ suppliers: suppliers.data, analytics: suppAnalytics.data });
          break;
        case 'reports':
          const history = await api.get('/api/insights/history?limit=20');
          setData({ history: history.data });
          break;
        case 'training':
          const tutorials = await api.get('/api/training');
          setData({ tutorials: tutorials.data });
          break;
        case 'export':
          // Load all data types for export
          const [exportSales, exportCustomers, exportProducts, exportSuppliers] = await Promise.all([
            api.get('/api/sales'),
            api.get('/api/customers'),
            api.get('/api/products'),
            api.get('/api/suppliers'),
          ]);
          setData({ 
            sales: exportSales.data, 
            customers: exportCustomers.data,
            products: exportProducts.data,
            suppliers: exportSuppliers.data 
          });
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D2FF" />
        </View>
      );
    }

    switch (activeSection) {
      case 'dashboard':
        return <DashboardView data={data} />;
      case 'products':
        return <ProductsView data={data} onReload={loadData} />;
      case 'customers':
        return <CustomersView data={data} />;
      case 'suppliers':
        return <SuppliersView data={data} />;
      case 'bulk-upload':
        return <BulkUploadView onReload={loadData} />;
      case 'reports':
        return <ReportsView data={data} />;
      case 'training':
        return <TrainingView data={data} />;
      default:
        return <DashboardView data={data} />;
    }
  };

  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: 'stats-chart', color: '#00D2FF' },
    { id: 'products', title: 'Productos', icon: 'cube', color: '#00D2FF' },
    { id: 'customers', title: 'Clientes', icon: 'people', color: '#9C27B0' },
    { id: 'suppliers', title: 'Proveedores', icon: 'briefcase', color: '#FF9800' },
    { id: 'reports', title: 'Reportes IA', icon: 'document-text', color: '#E91E63' },
    { id: 'training', title: 'Capacitación', icon: 'school', color: '#9C27B0' },
    { id: 'bulk-upload', title: 'Carga Masiva', icon: 'cloud-upload', color: '#00BCD4' },
    { id: 'export', title: 'Exportar CSV', icon: 'download', color: '#4CAF50' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowSidebar(!showSidebar)} style={styles.menuButton}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Console</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* Sidebar */}
        {showSidebar && (
          <View style={styles.sidebar}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  activeSection === item.id && styles.menuItemActive
                ]}
                onPress={() => setActiveSection(item.id)}
              >
                <Ionicons name={item.icon as any} size={22} color={activeSection === item.id ? item.color : '#666'} />
                <Text style={[
                  styles.menuItemText,
                  activeSection === item.id && { color: item.color, fontWeight: '600' }
                ]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Main Content */}
        <View style={styles.mainContent}>
          {renderContent()}
        </View>
      </View>

      {/* Floating Support Button */}
      <TouchableOpacity
        style={styles.floatingSupportButton}
        onPress={() => setShowSupportModal(true)}
      >
        <Ionicons name="headset" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Support Modal */}
      <SupportModal
        visible={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </View>
  );
}

// Support Modal Component
function SupportModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('contact');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!subject || !message) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setSending(true);
    try {
      await api.post('/api/support/ticket', {
        subject,
        message,
        priority,
        contact_method: 'email'
      });

      Alert.alert(
        '✅ Mensaje Enviado',
        'Hemos recibido tu solicitud. Te contactaremos pronto por email.'
      );
      setSubject('');
      setMessage('');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el mensaje. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const openWhatsAppSupport = () => {
    const phone = '+593992913093'; // Tu número de soporte
    const text = 'Hola, necesito ayuda con Yappa Admin Console';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const faqs = [
    {
      q: '¿Cómo cargo productos masivamente?',
      a: 'Ve a "Carga Masiva" → Selecciona "Productos" → Descarga la plantilla → Llena los datos → Carga el archivo CSV'
    },
    {
      q: '¿Cómo veo mis clientes inactivos?',
      a: 'Ve a "Clientes" en el sidebar → Scroll hasta "Clientes Inactivos". Ahí verás quiénes no han comprado en más de 30 días.'
    },
    {
      q: '¿Dónde están las predicciones de stock?',
      a: 'Ve a "Productos" → Tab "Análisis" → Busca "Alertas de Stock". Verás productos que se agotarán pronto.'
    },
    {
      q: '¿Cómo comparo ventas del mes?',
      a: 'Ve al "Dashboard" → Verás comparaciones de semana vs semana y mes vs mes con porcentajes de cambio.'
    },
    {
      q: '¿Puedo exportar los reportes?',
      a: 'Próximamente. Por ahora puedes ver todos los reportes históricos en "Reportes IA".'
    }
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.supportModalContainer}>
        <View style={styles.supportModalHeader}>
          <Text style={styles.supportModalTitle}>💬 Centro de Ayuda</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.supportTabs}>
          <TouchableOpacity
            style={[styles.supportTab, activeTab === 'contact' && styles.supportTabActive]}
            onPress={() => setActiveTab('contact')}
          >
            <Text style={[styles.supportTabText, activeTab === 'contact' && styles.supportTabTextActive]}>
              Contacto
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.supportTab, activeTab === 'faq' && styles.supportTabActive]}
            onPress={() => setActiveTab('faq')}
          >
            <Text style={[styles.supportTabText, activeTab === 'faq' && styles.supportTabTextActive]}>
              FAQs
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.supportModalContent}>
          {activeTab === 'contact' ? (
            <View>
              {/* WhatsApp Option */}
              <TouchableOpacity style={styles.whatsappSupportButton} onPress={openWhatsAppSupport}>
                <Ionicons name="logo-whatsapp" size={32} color="#25D366" />
                <View style={styles.whatsappSupportContent}>
                  <Text style={styles.whatsappSupportTitle}>Chat por WhatsApp</Text>
                  <Text style={styles.whatsappSupportSubtitle}>Respuesta inmediata</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#ccc" />
              </TouchableOpacity>

              <View style={styles.supportDivider}>
                <View style={styles.supportDividerLine} />
                <Text style={styles.supportDividerText}>O</Text>
                <View style={styles.supportDividerLine} />
              </View>

              {/* Email Form */}
              <Text style={styles.supportFormTitle}>Envía un Mensaje</Text>

              <Text style={styles.supportLabel}>Asunto *</Text>
              <TextInput
                style={styles.supportInput}
                placeholder="¿En qué podemos ayudarte?"
                value={subject}
                onChangeText={setSubject}
              />

              <Text style={styles.supportLabel}>Prioridad</Text>
              <View style={styles.priorityButtons}>
                <TouchableOpacity
                  style={[styles.priorityButton, priority === 'low' && styles.priorityButtonActive]}
                  onPress={() => setPriority('low')}
                >
                  <Text style={[styles.priorityButtonText, priority === 'low' && styles.priorityButtonTextActive]}>
                    Baja
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.priorityButton, priority === 'medium' && styles.priorityButtonActive]}
                  onPress={() => setPriority('medium')}
                >
                  <Text style={[styles.priorityButtonText, priority === 'medium' && styles.priorityButtonTextActive]}>
                    Media
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.priorityButton, priority === 'high' && styles.priorityButtonActive]}
                  onPress={() => setPriority('high')}
                >
                  <Text style={[styles.priorityButtonText, priority === 'high' && styles.priorityButtonTextActive]}>
                    Alta
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.supportLabel}>Mensaje *</Text>
              <TextInput
                style={[styles.supportInput, styles.supportTextArea]}
                placeholder="Describe tu problema o pregunta..."
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.supportSubmitButton, sending && styles.supportSubmitButtonDisabled]}
                onPress={handleSubmit}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#fff" />
                    <Text style={styles.supportSubmitButtonText}>Enviar Mensaje</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.supportNote}>
                📧 Te responderemos por email en 24-48 horas
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.faqTitle}>Preguntas Frecuentes</Text>
              {faqs.map((faq, index) => (
                <View key={index} style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <Text style={styles.faqAnswer}>{faq.a}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// Dashboard View Component
function DashboardView({ data }: any) {
  const analytics = data?.analytics || {};
  const comparisons = data?.comparisons || {};

  return (
    <ScrollView style={styles.scrollContent}>
      <Text style={styles.pageTitle}>Dashboard Ejecutivo</Text>

      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, { borderLeftColor: '#00D2FF' }]}>
          <Text style={styles.kpiLabel}>Ventas del Mes</Text>
          <Text style={styles.kpiValue}>${analytics.sales?.month?.toFixed(2) || '0.00'}</Text>
          <Text style={styles.kpiSubtext}>{analytics.sales?.count_month || 0} transacciones</Text>
        </View>

        <View style={[styles.kpiCard, { borderLeftColor: '#00D2FF' }]}>
          <Text style={styles.kpiLabel}>Balance Mensual</Text>
          <Text style={[styles.kpiValue, { color: analytics.balance?.month >= 0 ? '#00D2FF' : '#f44336' }]}>
            ${analytics.balance?.month?.toFixed(2) || '0.00'}
          </Text>
          <Text style={styles.kpiSubtext}>Ventas - Gastos</Text>
        </View>

        <View style={[styles.kpiCard, { borderLeftColor: '#FF9800' }]}>
          <Text style={styles.kpiLabel}>Total Productos</Text>
          <Text style={styles.kpiValue}>{analytics.products?.total || 0}</Text>
          <Text style={[styles.kpiSubtext, { color: '#f44336' }]}>
            {analytics.products?.low_stock || 0} con stock bajo
          </Text>
        </View>

        <View style={[styles.kpiCard, { borderLeftColor: '#9C27B0' }]}>
          <Text style={styles.kpiLabel}>Deudas Pendientes</Text>
          <Text style={styles.kpiValue}>${analytics.debts?.total?.toFixed(2) || '0.00'}</Text>
          <Text style={styles.kpiSubtext}>{analytics.debts?.count || 0} deudas</Text>
        </View>
      </View>

      {/* Comparisons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Comparaciones de Período</Text>
        
        <View style={styles.comparisonCard}>
          <Text style={styles.comparisonTitle}>Semana Actual vs Anterior</Text>
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonCol}>
              <Text style={styles.comparisonLabel}>Esta Semana</Text>
              <Text style={styles.comparisonValue}>
                ${comparisons.week_comparison?.this_week?.toFixed(2) || '0.00'}
              </Text>
            </View>
            <View style={styles.comparisonCol}>
              <Text style={styles.comparisonLabel}>Semana Pasada</Text>
              <Text style={styles.comparisonValue}>
                ${comparisons.week_comparison?.last_week?.toFixed(2) || '0.00'}
              </Text>
            </View>
            <View style={styles.comparisonCol}>
              <Text style={styles.comparisonLabel}>Cambio</Text>
              <Text style={[
                styles.comparisonValue,
                { color: comparisons.week_comparison?.change_percent >= 0 ? '#00D2FF' : '#f44336' }
              ]}>
                {comparisons.week_comparison?.change_percent >= 0 ? '+' : ''}
                {comparisons.week_comparison?.change_percent?.toFixed(1) || '0'}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.comparisonCard}>
          <Text style={styles.comparisonTitle}>Mes Actual vs Anterior</Text>
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonCol}>
              <Text style={styles.comparisonLabel}>Este Mes</Text>
              <Text style={styles.comparisonValue}>
                ${comparisons.month_comparison?.this_month?.toFixed(2) || '0.00'}
              </Text>
            </View>
            <View style={styles.comparisonCol}>
              <Text style={styles.comparisonLabel}>Mes Pasado</Text>
              <Text style={styles.comparisonValue}>
                ${comparisons.month_comparison?.last_month?.toFixed(2) || '0.00'}
              </Text>
            </View>
            <View style={styles.comparisonCol}>
              <Text style={styles.comparisonLabel}>Cambio</Text>
              <Text style={[
                styles.comparisonValue,
                { color: comparisons.month_comparison?.change_percent >= 0 ? '#00D2FF' : '#f44336' }
              ]}>
                {comparisons.month_comparison?.change_percent >= 0 ? '+' : ''}
                {comparisons.month_comparison?.change_percent?.toFixed(1) || '0'}%
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Seasonality */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Análisis de Temporada</Text>
        <View style={styles.seasonalityCard}>
          <Text style={styles.seasonalityBest}>
            🏆 Mejor día de ventas: {comparisons.seasonality?.best_day?.day || 'N/A'}
          </Text>
          <Text style={styles.seasonalityValue}>
            ${comparisons.seasonality?.best_day?.total?.toFixed(2) || '0.00'}
          </Text>
        </View>
      </View>

      {/* Top Products */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⭐ Top Productos del Mes</Text>
        {analytics.top_products?.slice(0, 5).map((product: any, index: number) => (
          <View key={index} style={styles.topItemCard}>
            <Text style={styles.topItemRank}>#{index + 1}</Text>
            <View style={styles.topItemContent}>
              <Text style={styles.topItemName}>{product.product_name}</Text>
              <Text style={styles.topItemStats}>
                Cantidad: {product.quantity_sold} | Ingresos: ${product.revenue.toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// Products View Component
function ProductsView({ data, onReload }: any) {
  const [activeTab, setActiveTab] = useState('analytics');
  const products = data?.products || [];
  const analytics = data?.analytics || {};

  return (
    <ScrollView style={styles.scrollContent}>
      <Text style={styles.pageTitle}>Gestión de Productos</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
            Análisis
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'inventory' && styles.activeTab]}
          onPress={() => setActiveTab('inventory')}
        >
          <Text style={[styles.tabText, activeTab === 'inventory' && styles.activeTabText]}>
            Inventario
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'analytics' ? (
        <View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Top por Rentabilidad</Text>
            {analytics.top_by_profit?.slice(0, 5).map((product: any, index: number) => (
              <View key={index} style={styles.productAnalyticsCard}>
                <Text style={styles.productName}>{product.name}</Text>
                <View style={styles.productStats}>
                  <Text style={styles.productStat}>Ganancia: ${product.profit.toFixed(2)}</Text>
                  <Text style={styles.productStat}>Margen: {product.margin.toFixed(1)}%</Text>
                  <Text style={styles.productStat}>Vendidos: {product.units_sold}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Alertas de Stock</Text>
            {analytics.stockout_predictions?.map((product: any, index: number) => (
              <View key={index} style={[styles.productAnalyticsCard, { borderLeftColor: '#f44336' }]}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={[styles.productAlert, { color: '#f44336' }]}>
                  ⏰ Se agotará en {product.days_to_stockout} días
                </Text>
                <Text style={styles.productStat}>Stock actual: {product.current_stock}</Text>
              </View>
            ))}
            {(!analytics.stockout_predictions || analytics.stockout_predictions.length === 0) && (
              <Text style={styles.emptyText}>✅ No hay alertas de stock bajo</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Margen Bajo (Revisar Precios)</Text>
            {analytics.low_margin_alert?.slice(0, 5).map((product: any, index: number) => (
              <View key={index} style={[styles.productAnalyticsCard, { borderLeftColor: '#FF9800' }]}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={[styles.productAlert, { color: '#FF9800' }]}>
                  Margen: {product.margin.toFixed(1)}% - Considera aumentar precio
                </Text>
                <View style={styles.productStats}>
                  <Text style={styles.productStat}>Precio: ${product.price}</Text>
                  <Text style={styles.productStat}>Costo: ${product.cost}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Inventario Completo</Text>
          {products.map((product: any) => (
            <View key={product._id} style={styles.inventoryCard}>
              <Text style={styles.productName}>{product.name}</Text>
              <View style={styles.inventoryRow}>
                <Text style={styles.inventoryStat}>Stock: {product.quantity}</Text>
                <Text style={styles.inventoryStat}>Precio: ${product.price}</Text>
                <Text style={styles.inventoryStat}>Costo: ${product.cost}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// Customers View Component
function CustomersView({ data }: any) {
  const customers = data?.customers || [];
  const analytics = data?.analytics || {};

  return (
    <ScrollView style={styles.scrollContent}>
      <Text style={styles.pageTitle}>Análisis de Clientes</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Clientes</Text>
          <Text style={styles.summaryValue}>{analytics.total_customers || 0}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Deudas Totales</Text>
          <Text style={[styles.summaryValue, { color: '#f44336' }]}>
            ${analytics.total_debt?.toFixed(2) || '0.00'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⭐ Top Clientes por Ingresos</Text>
        {analytics.top_customers?.map((customer: any, index: number) => (
          <View key={index} style={styles.customerCard}>
            <View style={styles.customerHeader}>
              <Text style={styles.customerRank}>#{index + 1}</Text>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerDetail}>{customer.phone}</Text>
              </View>
              <Text style={styles.customerRevenue}>${customer.total_revenue.toFixed(2)}</Text>
            </View>
            <View style={styles.customerStats}>
              <Text style={styles.customerStat}>Compras: {customer.total_purchases}</Text>
              <Text style={styles.customerStat}>Promedio: ${customer.avg_purchase.toFixed(2)}</Text>
              {customer.pending_debt > 0 && (
                <Text style={[styles.customerStat, { color: '#f44336' }]}>
                  Deuda: ${customer.pending_debt.toFixed(2)}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Clientes con Deudas</Text>
        {analytics.customers_with_debts?.slice(0, 10).map((customer: any, index: number) => (
          <View key={index} style={[styles.customerCard, { borderLeftColor: '#f44336' }]}>
            <View style={styles.customerHeader}>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerDetail}>{customer.phone}</Text>
              </View>
              <Text style={[styles.customerRevenue, { color: '#f44336' }]}>
                ${customer.pending_debt.toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>😴 Clientes Inactivos (+30 días)</Text>
        {analytics.inactive_customers?.map((customer: any, index: number) => (
          <View key={index} style={[styles.customerCard, { borderLeftColor: '#FF9800' }]}>
            <View style={styles.customerHeader}>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={[styles.customerDetail, { color: '#FF9800' }]}>
                  Última compra hace {customer.days_since_purchase} días
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// Suppliers View Component
function SuppliersView({ data }: any) {
  const suppliers = data?.suppliers || [];
  const analytics = data?.analytics || {};

  return (
    <ScrollView style={styles.scrollContent}>
      <Text style={styles.pageTitle}>Análisis de Proveedores</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Proveedores</Text>
          <Text style={styles.summaryValue}>{analytics.total_suppliers || 0}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Gasto Total</Text>
          <Text style={styles.summaryValue}>${analytics.total_spent?.toFixed(2) || '0.00'}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Deudas con Proveedores</Text>
          <Text style={[styles.summaryValue, { color: '#f44336' }]}>
            ${analytics.total_debt_to_suppliers?.toFixed(2) || '0.00'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏢 Top Proveedores por Gasto</Text>
        {analytics.top_suppliers?.map((supplier: any, index: number) => (
          <View key={index} style={styles.supplierCard}>
            <View style={styles.supplierHeader}>
              <Text style={styles.supplierRank}>#{index + 1}</Text>
              <View style={styles.supplierInfo}>
                <Text style={styles.supplierName}>{supplier.name}</Text>
                <Text style={styles.supplierDetail}>{supplier.phone}</Text>
              </View>
              <Text style={styles.supplierAmount}>${supplier.total_spent.toFixed(2)}</Text>
            </View>
            <View style={styles.supplierStats}>
              <Text style={styles.supplierStat}>Transacciones: {supplier.total_transactions}</Text>
              <Text style={styles.supplierStat}>Promedio: ${supplier.avg_transaction.toFixed(2)}</Text>
              {supplier.pending_debt > 0 && (
                <Text style={[styles.supplierStat, { color: '#f44336' }]}>
                  Deuda: ${supplier.pending_debt.toFixed(2)}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💳 Deudas con Proveedores</Text>
        {analytics.suppliers_with_debts?.map((supplier: any, index: number) => (
          <View key={index} style={[styles.supplierCard, { borderLeftColor: '#f44336' }]}>
            <View style={styles.supplierHeader}>
              <View style={styles.supplierInfo}>
                <Text style={styles.supplierName}>{supplier.name}</Text>
                <Text style={styles.supplierDetail}>{supplier.phone}</Text>
              </View>
              <Text style={[styles.supplierAmount, { color: '#f44336' }]}>
                ${supplier.pending_debt.toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// Bulk Upload View Component
function BulkUploadView({ onReload }: any) {
  const [uploadType, setUploadType] = useState('products');
  const [uploadData, setUploadData] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const response = await fetch(result.assets[0].uri);
      const text = await response.text();
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
      setShowModal(true);
    } catch (error) {
      Alert.alert('Error', 'No se pudo leer el archivo CSV');
    }
  };

  const confirmUpload = async () => {
    setUploading(true);
    try {
      let endpoint = '';
      let payload: any = {};

      switch (uploadType) {
        case 'products':
          endpoint = '/api/admin/products/bulk-upload';
          payload = { products: uploadData };
          break;
        case 'customers':
          endpoint = '/api/admin/customers/bulk-upload';
          payload = { customers: uploadData };
          break;
        case 'suppliers':
          endpoint = '/api/admin/suppliers/bulk-upload';
          payload = { suppliers: uploadData };
          break;
      }

      const response = await api.post(endpoint, payload);
      setShowModal(false);
      Alert.alert(
        '✅ Carga Exitosa',
        `Creados: ${response.data.created}\nActualizados: ${response.data.updated}\nErrores: ${response.data.errors.length}`
      );
      onReload();
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cargar los datos');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    let csv = '';
    switch (uploadType) {
      case 'products':
        csv = 'name,quantity,price,cost,category,min_stock_alert,alert_enabled,description\nCoca Cola 2L,50,2.50,1.80,Bebidas,10,true,Gaseosa\n';
        break;
      case 'customers':
        csv = 'name,lastname,phone,email\nJuan,Perez,+593999123456,juan@email.com\n';
        break;
      case 'suppliers':
        csv = 'name,phone,email,type,tax_id\nDistribuidora XYZ,+593999654321,xyz@email.com,Mayorista,1234567890\n';
        break;
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantilla_${uploadType}.csv`;
    a.click();
  };

  return (
    <ScrollView style={styles.scrollContent}>
      <Text style={styles.pageTitle}>Carga Masiva de Datos</Text>

      {/* Type Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selecciona el tipo de datos</Text>
        <View style={styles.uploadTypeGrid}>
          <TouchableOpacity
            style={[styles.uploadTypeCard, uploadType === 'products' && styles.uploadTypeActive]}
            onPress={() => setUploadType('products')}
          >
            <Ionicons name="cube" size={32} color={uploadType === 'products' ? '#00D2FF' : '#999'} />
            <Text style={styles.uploadTypeText}>Productos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.uploadTypeCard, uploadType === 'customers' && styles.uploadTypeActive]}
            onPress={() => setUploadType('customers')}
          >
            <Ionicons name="people" size={32} color={uploadType === 'customers' ? '#00D2FF' : '#999'} />
            <Text style={styles.uploadTypeText}>Clientes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.uploadTypeCard, uploadType === 'suppliers' && styles.uploadTypeActive]}
            onPress={() => setUploadType('suppliers')}
          >
            <Ionicons name="briefcase" size={32} color={uploadType === 'suppliers' ? '#00D2FF' : '#999'} />
            <Text style={styles.uploadTypeText}>Proveedores</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.actionButton} onPress={downloadTemplate}>
          <Ionicons name="download" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Descargar Plantilla</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#00D2FF' }]} onPress={handleFileUpload}>
          <Ionicons name="cloud-upload" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Cargar Archivo CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>📝 Instrucciones</Text>
        <Text style={styles.instructionsText}>
          1. Descarga la plantilla CSV{`\n`}
          2. Llena los datos en Excel o Google Sheets{`\n`}
          3. Guarda como CSV{`\n`}
          4. Carga el archivo usando el botón verde{`\n`}
          5. Revisa la vista previa y confirma
        </Text>
      </View>

      {/* Upload Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Vista Previa</Text>
            <Text style={styles.modalSubtitle}>
              {uploadData.length} registros listos para cargar
            </Text>

            <ScrollView style={styles.modalScroll}>
              {uploadData.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.previewItem}>
                  <Text style={styles.previewText}>{item.name}</Text>
                  <Text style={styles.previewSubtext}>
                    {JSON.stringify(item).substring(0, 100)}...
                  </Text>
                </View>
              ))}
              {uploadData.length > 5 && (
                <Text style={styles.moreText}>... y {uploadData.length - 5} más</Text>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowModal(false)}
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
    </ScrollView>
  );
}

// Reports View Component
function ReportsView({ data }: any) {
  const history = data?.history || [];
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openReport = (report: any) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  return (
    <ScrollView style={styles.scrollContent}>
      <Text style={styles.pageTitle}>Historial de Reportes IA</Text>

      <Text style={styles.sectionTitle}>📚 Todos los Reportes Generados</Text>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No hay reportes generados aún</Text>
          <Text style={styles.emptySubtext}>
            Ve a "Explorar → Mis Datos" en el app móvil para generar tu primer reporte
          </Text>
        </View>
      ) : (
        history.map((report: any, index: number) => (
          <TouchableOpacity 
            key={report._id || index} 
            style={styles.reportCard}
            onPress={() => openReport(report)}
          >
            <View style={styles.reportHeader}>
              <Ionicons name="document-text" size={24} color="#00D2FF" />
              <View style={styles.reportInfo}>
                <Text style={styles.reportTitle}>Reporte #{history.length - index}</Text>
                <Text style={styles.reportDate}>{formatDate(report.generated_at)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
            {report.metrics && (
              <View style={styles.reportMetrics}>
                <Text style={styles.reportMetric}>
                  Ventas: ${report.metrics.total_sales?.toFixed(2) || '0.00'}
                </Text>
                <Text style={styles.reportMetric}>
                  Balance: ${report.metrics.balance?.toFixed(2) || '0.00'}
                </Text>
              </View>
            )}
            <Text style={styles.reportInsights} numberOfLines={3}>
              {report.insights}
            </Text>
            <Text style={styles.reportExpandText}>👆 Toca para ver completo</Text>
          </TouchableOpacity>
        ))
      )}

      {/* Report Detail Modal */}
      <Modal visible={showReportModal} animationType="slide" transparent={false}>
        <View style={styles.reportModalContainer}>
          <View style={styles.reportModalHeader}>
            <Text style={styles.reportModalTitle}>Reporte Completo</Text>
            <TouchableOpacity onPress={() => setShowReportModal(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.reportModalContent}>
            {selectedReport && (
              <>
                <View style={styles.reportModalInfo}>
                  <Text style={styles.reportModalDate}>
                    {formatDate(selectedReport.generated_at)}
                  </Text>
                  {selectedReport.metrics && (
                    <View style={styles.reportModalMetrics}>
                      <View style={styles.reportModalMetricCard}>
                        <Text style={styles.reportModalMetricLabel}>Ventas</Text>
                        <Text style={styles.reportModalMetricValue}>
                          ${selectedReport.metrics.total_sales?.toFixed(2) || '0.00'}
                        </Text>
                      </View>
                      <View style={styles.reportModalMetricCard}>
                        <Text style={styles.reportModalMetricLabel}>Balance</Text>
                        <Text style={[styles.reportModalMetricValue, {
                          color: selectedReport.metrics.balance >= 0 ? '#00D2FF' : '#f44336'
                        }]}>
                          ${selectedReport.metrics.balance?.toFixed(2) || '0.00'}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.reportModalInsights}>
                  <Text style={styles.reportModalInsightsTitle}>📊 Análisis Completo</Text>
                  <Text style={styles.reportModalInsightsText}>
                    {selectedReport.insights}
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}


// Training View Component
function TrainingView({ data }: any) {
  const tutorials = data?.tutorials || [];
  const [selectedTutorial, setSelectedTutorial] = useState<any>(null);
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      basic: '#00D2FF',
      intermediate: '#FF9800',
      advanced: '#F44336',
      whatsapp: '#25D366',
      reports: '#00D2FF',
      critical: '#E91E63',
    };
    return colors[category] || '#9E9E9E';
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      basic: 'Básico',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      whatsapp: 'WhatsApp AI',
      reports: 'Reportes',
      critical: '⚠️ OBLIGATORIO',
    };
    return names[category] || category;
  };

  const openTutorial = async (tutorial: any) => {
    try {
      const response = await api.get(`/api/training/${tutorial._id}`);
      setSelectedTutorial(response.data);
      setShowTutorialModal(true);
    } catch (error) {
      console.error('Error loading tutorial:', error);
    }
  };

  return (
    <ScrollView style={styles.scrollContent}>
      <Text style={styles.pageTitle}>📚 Capacitación</Text>
      <Text style={styles.sectionTitle}>Aprende a usar Yappa</Text>

      {tutorials.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="school-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No hay tutoriales disponibles</Text>
        </View>
      ) : (
        tutorials.map((tutorial: any) => (
          <TouchableOpacity
            key={tutorial._id}
            style={styles.tutorialCard}
            onPress={() => openTutorial(tutorial)}
          >
            <View style={styles.tutorialHeader}>
              <View
                style={[
                  styles.tutorialIconContainer,
                  { backgroundColor: getCategoryColor(tutorial.category) + '20' },
                ]}
              >
                <Ionicons
                  name="book-outline"
                  size={24}
                  color={getCategoryColor(tutorial.category)}
                />
              </View>
              <View style={styles.tutorialInfo}>
                <Text style={styles.tutorialTitle}>{tutorial.title}</Text>
                <Text style={styles.tutorialDescription} numberOfLines={2}>
                  {tutorial.description}
                </Text>
              </View>
            </View>
            <View style={styles.tutorialFooter}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {getCategoryName(tutorial.category)}
                </Text>
              </View>
              <View style={styles.durationContainer}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.durationText}>{tutorial.duration_minutes} min</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Tutorial Detail Modal */}
      <Modal visible={showTutorialModal} animationType="slide" transparent={false}>
        <View style={styles.tutorialModalContainer}>
          <View style={styles.tutorialModalHeader}>
            <Text style={styles.tutorialModalTitle}>
              {selectedTutorial?.title || 'Tutorial'}
            </Text>
            <TouchableOpacity onPress={() => setShowTutorialModal(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.tutorialModalContent}>
            {selectedTutorial && (
              <>
                <View style={styles.tutorialModalMeta}>
                  <View
                    style={[
                      styles.categoryBadge,
                      {
                        backgroundColor: getCategoryColor(selectedTutorial.category),
                      },
                    ]}
                  >
                    <Text style={[styles.categoryBadgeText, { color: '#FFF' }]}>
                      {getCategoryName(selectedTutorial.category)}
                    </Text>
                  </View>
                  <View style={styles.durationContainer}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.durationText}>
                      {selectedTutorial.duration_minutes} minutos
                    </Text>
                  </View>
                </View>

                <Text style={styles.tutorialModalDescription}>
                  {selectedTutorial.description}
                </Text>

                <View style={styles.tutorialModalBody}>
                  <Text style={styles.tutorialModalBodyText}>
                    {selectedTutorial.content}
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
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
    backgroundColor: '#082E72',
    padding: 16,
    paddingTop: 48,
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 240,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#666',
  },
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    padding: 24,
    paddingBottom: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  kpiCard: {
    width: 'calc(25% - 12px)',
    minWidth: 200,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  kpiLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  kpiSubtext: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  comparisonCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  comparisonCol: {
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  comparisonValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  seasonalityCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  seasonalityBest: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  seasonalityValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00D2FF',
  },
  topItemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  topItemRank: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00D2FF',
    marginRight: 16,
    width: 40,
  },
  topItemContent: {
    flex: 1,
  },
  topItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  topItemStats: {
    fontSize: 14,
    color: '#666',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  activeTab: {
    backgroundColor: '#00D2FF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  productAnalyticsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00D2FF',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  productStats: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  productStat: {
    fontSize: 14,
    color: '#666',
  },
  productAlert: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  inventoryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  inventoryRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  inventoryStat: {
    fontSize: 14,
    color: '#666',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  customerCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00D2FF',
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerRank: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00D2FF',
    marginRight: 12,
    width: 30,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  customerDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  customerRevenue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00D2FF',
  },
  customerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  customerStat: {
    fontSize: 14,
    color: '#666',
  },
  supplierCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  supplierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  supplierRank: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9800',
    marginRight: 12,
    width: 30,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  supplierDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  supplierAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  supplierStats: {
    flexDirection: 'row',
    gap: 16,
  },
  supplierStat: {
    fontSize: 14,
    color: '#666',
  },
  uploadTypeGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  uploadTypeCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  uploadTypeActive: {
    borderColor: '#00D2FF',
    backgroundColor: '#f1f8f4',
  },
  uploadTypeText: {
    fontSize: 16,
    color: '#333',
    marginTop: 8,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#00D2FF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsCard: {
    backgroundColor: '#E0F7FA',
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  reportCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reportDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  reportMetrics: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  reportMetric: {
    fontSize: 14,
    color: '#00D2FF',
    fontWeight: '600',
  },
  reportInsights: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
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
    fontSize: 12,
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
    backgroundColor: '#00D2FF',
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
  reportExpandText: {
    fontSize: 12,
    color: '#00D2FF',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  reportModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  reportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  reportModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  reportModalContent: {
    flex: 1,
    padding: 20,
  },
  reportModalInfo: {
    marginBottom: 24,
  },
  reportModalDate: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  reportModalMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  reportModalMetricCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  reportModalMetricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  reportModalMetricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  reportModalInsights: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 12,
  },
  reportModalInsightsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  reportModalInsightsText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  floatingSupportButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00D2FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  supportModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  supportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  supportModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  supportTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  supportTab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  supportTabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#00D2FF',
  },
  supportTabText: {
    fontSize: 16,
    color: '#666',
  },
  supportTabTextActive: {
    color: '#00D2FF',
    fontWeight: '600',
  },
  supportModalContent: {
    flex: 1,
    padding: 20,
  },
  whatsappSupportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#25D366',
    marginBottom: 24,
  },
  whatsappSupportContent: {
    flex: 1,
    marginLeft: 16,
  },
  whatsappSupportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  whatsappSupportSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  supportDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  supportDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  supportDividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#999',
  },
  supportFormTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  supportLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  supportInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  supportTextArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  priorityButtonActive: {
    backgroundColor: '#00D2FF',
    borderColor: '#00D2FF',
  },
  priorityButtonText: {
    fontSize: 14,
    color: '#666',
  },
  priorityButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  supportSubmitButton: {
    flexDirection: 'row',
    backgroundColor: '#00D2FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  supportSubmitButtonDisabled: {
    opacity: 0.6,
  },
  supportSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  supportNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  faqTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  faqItem: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Training styles
  tutorialCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tutorialHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tutorialIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tutorialInfo: {
    flex: 1,
  },
  tutorialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tutorialDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tutorialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tutorialModalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tutorialModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tutorialModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  tutorialModalContent: {
    flex: 1,
    padding: 20,
  },
  tutorialModalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tutorialModalDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  tutorialModalBody: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
  },
  tutorialModalBodyText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
});
