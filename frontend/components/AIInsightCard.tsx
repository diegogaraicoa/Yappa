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

export default function AIInsightCard() {
  const router = useRouter();
  const { insightsCount, criticalCount, lowStockCount, debtCount } = useInsights();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga inicial
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handlePress = () => {
    router.push('/insights');
  };

  // Determinar título y subtítulo basado en los tipos de alertas
  const getDisplayContent = () => {
    const hasAlerts = insightsCount > 0;
    
    if (!hasAlerts) {
      return {
        title: 'Tu negocio al día',
        subtitle: 'Ver análisis y reportes',
      };
    }

    // Prioridad: críticos > deudas > stock bajo
    if (criticalCount > 0 && debtCount > 0) {
      return {
        title: 'Tu YAPPA del día',
        subtitle: `${criticalCount} de stock · ${debtCount} de cobro`,
      };
    }
    
    if (criticalCount > 0 && lowStockCount > 0) {
      return {
        title: 'Revisar inventario',
        subtitle: `${criticalCount + lowStockCount} productos necesitan atención`,
      };
    }
    
    if (debtCount > 0 && lowStockCount > 0) {
      return {
        title: 'Tienes pendientes',
        subtitle: `${debtCount} cobros · ${lowStockCount} de stock`,
      };
    }

    if (criticalCount > 0) {
      return {
        title: 'Stock crítico',
        subtitle: `${criticalCount} ${criticalCount === 1 ? 'producto agotado' : 'productos agotados'}`,
      };
    }

    if (debtCount > 0) {
      return {
        title: 'Cobros pendientes',
        subtitle: `${debtCount} ${debtCount === 1 ? 'cliente debe' : 'clientes deben'}`,
      };
    }

    if (lowStockCount > 0) {
      return {
        title: 'Stock bajo',
        subtitle: `${lowStockCount} ${lowStockCount === 1 ? 'producto por acabarse' : 'productos por acabarse'}`,
      };
    }

    // Fallback genérico
    return {
      title: 'Sugerencias para ti',
      subtitle: `${insightsCount} ${insightsCount === 1 ? 'recomendación' : 'recomendaciones'}`,
    };
  };

  if (loading) {
    return (
      <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
        <View style={styles.iconContainer}>
          <ActivityIndicator size="small" color="#A66BFF" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Cargando...</Text>
        </View>
      </TouchableOpacity>
    );
  }

  const { title, subtitle } = getDisplayContent();
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
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
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
