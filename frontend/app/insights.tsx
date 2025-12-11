import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

interface Insight {
  id: string;
  type: string;
  category: string;
  icon: string;
  color: string;
  title: string;
  message: string;
  cta_text: string;
  cta_action: string;
  cta_data: any;
  priority: number;
  timestamp: string;
}

export default function InsightsScreen() {
  const router = useRouter();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await api.get('/api/ai/all-insights');
      setInsights(response.data.insights || []);
    } catch (error) {
      console.error('Error fetching insights:', error);
      setInsights([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInsights();
  };

  const handleAction = (insight: Insight) => {
    try {
      switch (insight.cta_action) {
        case 'navigate_to_product':
        case 'navigate_to_inventory':
          // Navegar a inventario con el producto resaltado
          if (insight.cta_data?.product_id) {
            router.push(`/(tabs)/inventory?highlight=${insight.cta_data.product_id}`);
          } else {
            router.push('/(tabs)/inventory');
          }
          break;
        case 'navigate_to_customers':
        case 'send_payment_reminder':
          // Navegar a clientes con el cliente resaltado
          if (insight.cta_data?.customer_id) {
            router.push(`/customers?highlight=${insight.cta_data.customer_id}`);
          } else {
            router.push('/customers');
          }
          break;
        case 'navigate_to_balance':
          router.push('/(tabs)/balance');
          break;
        case 'navigate_to_insights':
          // Ya estamos en insights, no hacer nada
          break;
        case 'view_insight_details':
          // Por ahora solo mostrar info en consola
          console.log('Insight details:', insight);
          break;
        default:
          console.log('Acción no reconocida:', insight.cta_action);
      }
    } catch (error) {
      console.error('Error en navegación:', error);
    }
  };

  const groupedInsights = insights.reduce((acc, insight) => {
    if (!acc[insight.category]) {
      acc[insight.category] = [];
    }
    acc[insight.category].push(insight);
    return acc;
  }, {} as Record<string, Insight[]>);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Insights IA</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A66BFF" />
          <Text style={styles.loadingText}>Cargando insights...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insights IA</Text>
        <View style={[styles.badge, { backgroundColor: '#A66BFF' }]}>
          <Text style={styles.badgeText}>{insights.length}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons name="sparkles" size={32} color="#A66BFF" />
          </View>
          <Text style={styles.heroTitle}>Tu Asistente IA</Text>
          <Text style={styles.heroSubtitle}>
            {insights.length === 0
              ? '¡Todo está perfecto! No hay insights por ahora.'
              : `${insights.length} recomendaciones para mejorar tu negocio`}
          </Text>
        </View>

        {insights.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyTitle}>Todo Bien</Text>
            <Text style={styles.emptyText}>
              No tienes alertas ni recomendaciones en este momento. Vuelve pronto para más insights.
            </Text>
          </View>
        ) : (
          Object.entries(groupedInsights).map(([category, categoryInsights]) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category}</Text>
              {categoryInsights.map((insight) => (
                <TouchableOpacity
                  key={insight.id}
                  style={[styles.insightCard, { borderLeftColor: insight.color }]}
                  onPress={() => handleAction(insight)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.cardIcon,
                        { backgroundColor: `${insight.color}20` },
                      ]}
                    >
                      <Text style={styles.iconEmoji}>{insight.icon}</Text>
                    </View>
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.cardTitle}>{insight.title}</Text>
                      <Text style={styles.cardMessage}>{insight.message}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.ctaButton, { backgroundColor: insight.color }]}
                    onPress={() => handleAction(insight)}
                  >
                    <Text style={styles.ctaText}>{insight.cta_text}</Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#757575',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#212121',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 24,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
    marginHorizontal: 20,
  },
  insightCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 24,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  cardMessage: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 6,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
