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

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  color: string;
  action: string;
}

interface QuickActionsProps {
  onActionsChange?: (hasActions: boolean) => void;
}

export default function QuickActions({ onActionsChange }: QuickActionsProps) {
  const router = useRouter();
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try:
      setLoading(true);
      const response = await api.get('/api/ai/quick-actions');
      const fetchedActions = response.data.actions || [];
      setActions(fetchedActions);
      
      // Notificar al padre si hay acciones
      if (onActionsChange) {
        onActionsChange(fetchedActions.length > 0);
      }
    } catch (error) {
      console.error('Error fetching quick actions:', error);
      setActions([]);
      if (onActionsChange) {
        onActionsChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'navigate_to_inventory':
        router.push('/inventory');
        break;
      case 'navigate_to_customers':
        router.push('/customers');
        break;
      case 'navigate_to_balance':
        router.push('/balance');
        break;
      case 'navigate_to_sales':
        router.push('/sales');
        break;
      case 'navigate_to_expenses':
        router.push('/expenses');
        break;
      default:
        console.log('Acción no reconocida:', action);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#00D2FF" />
      </View>
    );
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acciones Recomendadas</Text>
      <View style={styles.actionsRow}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionButton, { borderColor: action.color }]}
            onPress={() => handleAction(action.action)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${action.color}20` }]}>
              <Text style={styles.iconEmoji}>{action.icon}</Text>
            </View>
            <Text style={styles.actionLabel} numberOfLines={2}>
              {action.label}
            </Text>
            <View style={[styles.badge, { backgroundColor: action.color }]}>
              <Ionicons name="arrow-forward" size={12} color="#FFF" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconEmoji: {
    fontSize: 28,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#424242',
    textAlign: 'center',
    lineHeight: 18,
    flex: 1,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
});
