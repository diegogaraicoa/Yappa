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
import { useInsights } from '../contexts/InsightsContext';

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
  const { insightsCount } = useInsights();
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

  const handlePress = () => {
    router.push('/insights');
  };

  if (loading) {
    return (
      <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
        <ActivityIndicator size="small" color="#A66BFF" />
      </TouchableOpacity>
    );
  }

  // Versión simplificada - siempre muestra algo útil
  const displayTitle = insight?.title || 'Datos de mi Negocio';
  const hasAlerts = insightsCount > 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Left side - Icon */}
      <View style={styles.iconContainer}>
        <Ionicons name="sparkles" size={22} color="#A66BFF" />
      </View>

      {/* Center - Text */}
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {hasAlerts ? displayTitle : 'Tu negocio al día'}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {hasAlerts 
            ? `${insightsCount} ${insightsCount === 1 ? 'sugerencia' : 'sugerencias'} para ti`
            : 'Ver análisis y reportes'
          }
        </Text>
      </View>

      {/* Right side - Badge & Arrow */}
      <View style={styles.rightContainer}>
        {hasAlerts && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{insightsCount}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#757575',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#A66BFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
});
