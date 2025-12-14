import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

interface TimelineItem {
  id: string;
  type: string;
  category: string;
  icon: string;
  color: string;
  title: string;
  message: string;
  created_at: string;
  resolved: boolean;
  resolved_at: string | null;
  resolved_action?: string;
  entity_id?: string;
  entity_type?: string;
}

interface TimelineStats {
  total: number;
  resolved: number;
  pending: number;
}

export default function InsightsTimelineScreen() {
  const router = useRouter();
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [stats, setStats] = useState<TimelineStats>({ total: 0, resolved: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  const loadTimeline = useCallback(async () => {
    try {
      const response = await api.get(`/api/ai/insights-timeline?days=30&status=${filter}`);
      setTimeline(response.data.timeline || []);
      setStats(response.data.stats || { total: 0, resolved: 0, pending: 0 });
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTimeline();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (item: TimelineItem) => {
    if (item.resolved) {
      return (
        <View style={[styles.statusBadge, styles.statusResolved]}>
          <Ionicons name="checkmark-circle" size={12} color="#4CAF50" />
          <Text style={styles.statusTextResolved}>Resuelto</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, styles.statusPending]}>
        <Ionicons name="time" size={12} color="#FF9800" />
        <Text style={styles.statusTextPending}>Pendiente</Text>
      </View>
    );
  };

  const handleItemPress = (item: TimelineItem) => {
    if (item.entity_type === 'product') {
      router.push('/(tabs)/inventory');
    } else if (item.entity_type === 'customer') {
      router.push('/customers');
    }
  };

  // Agrupar por fecha
  const groupedTimeline = timeline.reduce((groups: Record<string, TimelineItem[]>, item) => {
    const dateKey = formatDate(item.created_at);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
    return groups;
  }, {});

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A66BFF" />
        <Text style={styles.loadingText}>Cargando historial...</Text>
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
        <Text style={styles.headerTitle}>Historial de Insights</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxPending]}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxResolved]}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.resolved}</Text>
          <Text style={styles.statLabel}>Resueltos</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            Pendientes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'resolved' && styles.filterTabActive]}
          onPress={() => setFilter('resolved')}
        >
          <Text style={[styles.filterText, filter === 'resolved' && styles.filterTextActive]}>
            Resueltos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Timeline */}
      <ScrollView
        style={styles.timelineContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#A66BFF']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {Object.keys(groupedTimeline).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>¡Todo al día!</Text>
            <Text style={styles.emptyText}>
              No hay insights {filter === 'pending' ? 'pendientes' : filter === 'resolved' ? 'resueltos' : ''} en los últimos 30 días.
            </Text>
          </View>
        ) : (
          Object.entries(groupedTimeline).map(([date, items]) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{date}</Text>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.timelineItem,
                    item.resolved && styles.timelineItemResolved
                  ]}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.7}
                >
                  {/* Timeline Line */}
                  <View style={styles.timelineLine}>
                    <View style={[styles.timelineDot, { backgroundColor: item.resolved ? '#4CAF50' : item.color }]} />
                    <View style={styles.timelineConnector} />
                  </View>
                  
                  {/* Content */}
                  <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemTitleRow}>
                        <Text style={styles.itemIcon}>{item.icon}</Text>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                      </View>
                      {getStatusBadge(item)}
                    </View>
                    
                    <Text style={styles.itemMessage}>{item.message}</Text>
                    
                    <View style={styles.itemFooter}>
                      <Text style={styles.itemTime}>{formatTime(item.created_at)}</Text>
                      {item.resolved && item.resolved_at && (
                        <Text style={styles.resolvedTime}>
                          ✓ Resuelto {formatDate(item.resolved_at)} {formatTime(item.resolved_at)}
                        </Text>
                      )}
                    </View>
                    
                    <View style={[styles.categoryBadge, { backgroundColor: `${item.color}20` }]}>
                      <Text style={[styles.categoryText, { color: item.color }]}>{item.category}</Text>
                    </View>
                  </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#757575',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statBoxPending: {
    backgroundColor: '#FFF3E0',
  },
  statBoxResolved: {
    backgroundColor: '#E8F5E9',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#A66BFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  filterTextActive: {
    color: '#FFF',
  },
  timelineContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
    textAlign: 'center',
  },
  dateGroup: {
    marginTop: 20,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 12,
    paddingLeft: 28,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineItemResolved: {
    opacity: 0.8,
  },
  timelineLine: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  timelineConnector: {
    flex: 1,
    width: 2,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
  },
  itemContent: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
  },
  statusResolved: {
    backgroundColor: '#E8F5E9',
  },
  statusTextPending: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FF9800',
  },
  statusTextResolved: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4CAF50',
  },
  itemMessage: {
    fontSize: 13,
    color: '#424242',
    lineHeight: 18,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  itemTime: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  resolvedTime: {
    fontSize: 11,
    color: '#4CAF50',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
