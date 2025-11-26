import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const exploreItems = [
    {
      id: 0,
      title: 'Capacitación',
      description: 'Aprende a usar YAPPA',
      icon: 'school-outline',
      iconFilled: 'school',
      color: '#E91E63',
      bgColor: '#FCE4EC',
      route: '/training',
    },
    {
      id: 1,
      title: 'Clientes',
      description: 'Gestiona tu cartera',
      icon: 'people-outline',
      iconFilled: 'people',
      color: '#4CAF50',
      bgColor: '#E8F5E9',
      route: '/customers',
    },
    {
      id: 2,
      title: 'Proveedores',
      description: 'Administra proveedores',
      icon: 'briefcase-outline',
      iconFilled: 'briefcase',
      color: '#FF9800',
      bgColor: '#FFF3E0',
      route: '/suppliers',
    },
    {
      id: 3,
      title: 'Alertas',
      description: 'Configura notificaciones',
      icon: 'settings-outline',
      iconFilled: 'settings',
      color: '#607D8B',
      bgColor: '#ECEFF1',
      route: '/settings',
    },
    {
      id: 4,
      title: 'Datos de mi Negocio',
      description: 'Estadísticas y análisis',
      icon: 'analytics-outline',
      iconFilled: 'analytics',
      color: '#9C27B0',
      bgColor: '#F3E5F5',
      route: '/insights',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>YAPPA</Text>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Explorar</Text>
          <Text style={styles.subtitle}>
            Gestiona todos los aspectos de tu negocio
          </Text>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {exploreItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              {/* Badge */}
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}

              {/* Icon Container */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: item.bgColor },
                ]}
              >
                <Ionicons
                  name={item.iconFilled as any}
                  size={32}
                  color={item.color}
                />
              </View>

              {/* Text Content */}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>

              {/* Arrow */}
              <View style={styles.arrowContainer}>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#BDBDBD"
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  appName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Welcome Section
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#757575',
    lineHeight: 24,
  },

  // Grid
  grid: {
    paddingHorizontal: 20,
    gap: 12,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    position: 'relative',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
    lineHeight: 20,
  },
  arrowContainer: {
    marginLeft: 8,
  },

  // Badge
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E91E63',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
