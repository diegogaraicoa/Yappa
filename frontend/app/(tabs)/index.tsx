import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [alertCount, setAlertCount] = useState(0);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesi\u00f3n',
      '\u00bfEst\u00e1s seguro de que quieres cerrar sesi\u00f3n?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      id: 'sale',
      title: '+ Venta',
      icon: 'add-circle',
      color: '#4CAF50',
      action: () => router.push('/sale'),
    },
    {
      id: 'expense',
      title: '- Gastos',
      icon: 'remove-circle',
      color: '#f44336',
      action: () => router.push('/expense'),
    },
    {
      id: 'debts',
      title: 'Deudas',
      icon: 'document-text',
      color: '#FF9800',
      action: () => router.push('/debts'),
    },
    {
      id: 'inventory',
      title: 'Inventario',
      icon: 'cube',
      color: '#2196F3',
      action: () => router.push('/(tabs)/inventory'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="storefront" size={24} color="#fff" />
          <Text style={styles.storeName}>{user?.store_name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>Bienvenido</Text>
        <Text style={styles.emailText}>{user?.email}</Text>

        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuCard, { borderColor: item.color }]}
              onPress={item.action}
            >
              <Ionicons name={item.icon as any} size={48} color={item.color} />
              <Text style={[styles.menuTitle, { color: item.color }]}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#2196F3" />
          <Text style={styles.infoText}>
            Selecciona una opci\u00f3n para comenzar a gestionar tu tienda
          </Text>
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
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  menuCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 12,
  },
});
