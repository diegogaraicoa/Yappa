import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type InsightType = 'low_stock' | 'out_of_stock' | 'debt' | 'inactive_customer' | 'high_performer';

interface ContextualInsightBannerProps {
  type: InsightType;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: object;
}

const insightConfig: Record<InsightType, { icon: string; bgColor: string; iconColor: string; borderColor: string }> = {
  out_of_stock: {
    icon: 'alert-circle',
    bgColor: '#FFEBEE',
    iconColor: '#D32F2F',
    borderColor: '#EF9A9A',
  },
  low_stock: {
    icon: 'warning',
    bgColor: '#FFF8E1',
    iconColor: '#F9A825',
    borderColor: '#FFE082',
  },
  debt: {
    icon: 'cash',
    bgColor: '#FFF3E0',
    iconColor: '#E65100',
    borderColor: '#FFCC80',
  },
  inactive_customer: {
    icon: 'time',
    bgColor: '#E3F2FD',
    iconColor: '#1976D2',
    borderColor: '#90CAF9',
  },
  high_performer: {
    icon: 'trophy',
    bgColor: '#E8F5E9',
    iconColor: '#2E7D32',
    borderColor: '#A5D6A7',
  },
};

export default function ContextualInsightBanner({
  type,
  title,
  message,
  actionLabel,
  onAction,
  style,
}: ContextualInsightBannerProps) {
  const config = insightConfig[type];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.bgColor, borderColor: config.borderColor },
        style,
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={config.icon as any} size={24} color={config.iconColor} />
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: config.iconColor }]}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {actionLabel && onAction && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: config.iconColor }]} 
            onPress={onAction}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: '#424242',
    lineHeight: 18,
  },
  actionButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
