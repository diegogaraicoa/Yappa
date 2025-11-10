import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ExploreScreen() {
  const router = useRouter();

  const exploreItems = [
    {
      id: 1,
      title: 'Clientes',
      icon: 'people',
      color: '#4CAF50',
      route: '/customers',
    },
    {
      id: 2,
      title: 'Proveedores',
      icon: 'briefcase',
      color: '#FF9800',
      route: '/suppliers',
    },
    {
      id: 3,
      title: 'Empleados',
      icon: 'person',
      color: '#2196F3',
      route: '/employees',
    },
    {
      id: 4,
      title: 'Configuración',
      icon: 'settings',
      color: '#607D8B',
      route: '/settings',
    },
    {
      id: 5,
      title: 'Reportes IA',
      icon: 'bulb',
      color: '#9C27B0',
      route: '/insights',
      badge: 'Próximamente',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Explorar</Text>
        <Text style={styles.subtitle}>Gestiona todos los aspectos de tu tienda</Text>

        <View style={styles.grid}>
          {exploreItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => {
                if (item.badge) {
                  // Placeholder - no navegar aún
                  return;
                }
                router.push(item.route as any);
              }}
            >
              <Ionicons name={item.icon as any} size={40} color={item.color} />
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#9C27B0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
});
