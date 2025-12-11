import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../utils/api';

interface AIInsight {
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
}

export default function AIInsightCard() {
  const router = useRouter();
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsight();
  }, []);

  const fetchInsight = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/ai/insight-of-the-day');
      setInsight(response.data);
    } catch (error) {
      console.error('Error fetching AI insight:', error);
      setInsight(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = () => {
    if (!insight) return;

    switch (insight.cta_action) {
      case 'navigate_to_product':
        router.push(`/inventory`);
        break;
      case 'navigate_to_insights':
      case 'view_insight_details':
        router.push('/insights');
        break;
      case 'navigate_to_balance':
        router.push('/balance');
        break;
      case 'navigate_to_inventory':
        router.push('/inventory');
        break;
      case 'navigate_to_customers':
        router.push('/customers');
        break;
      case 'send_payment_reminder':
        // TODO: Implementar envío de recordatorio
        alert('Funcionalidad próximamente');
        break;
      default:
        console.log('Acción no reconocida:', insight.cta_action);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#A66BFF" />
      </View>
    );
  }

  if (!insight) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: insight.color }]}
      onPress={handleAction}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${insight.color}20` }]}>
            <Text style={styles.iconEmoji}>{insight.icon}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.category}>{insight.category}</Text>
            <Text style={styles.title}>{insight.title}</Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: insight.color }]}>
          <Ionicons name="sparkles" size={12} color="#FFF" />
          <Text style={styles.badgeText}>IA</Text>
        </View>
      </View>

      {/* Message */}
      <Text style={styles.message}>{insight.message}</Text>

      {/* CTA Button */}
      <TouchableOpacity
        style={[styles.ctaButton, { backgroundColor: insight.color }]}
        onPress={handleAction}
      >
        <Text style={styles.ctaText}>{insight.cta_text}</Text>
        <Ionicons name="arrow-forward" size={16} color="#FFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
    marginHorizontal: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
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
  headerText: {
    flex: 1,
  },
  category: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  message: {
    fontSize: 15,
    color: '#424242',
    lineHeight: 22,
    marginBottom: 16,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
