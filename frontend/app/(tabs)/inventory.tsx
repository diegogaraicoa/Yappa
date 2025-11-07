import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function InventoryScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Ionicons name="cube" size={32} color="#2196F3" />
          <Text style={styles.cardTitle}>Inventario</Text>
          <Text style={styles.cardDescription}>
            Gestiona tus productos, categor\u00edas y stock.
          </Text>
          <Text style={styles.comingSoon}>Pr\u00f3ximamente</Text>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  cardDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  comingSoon: {
    fontSize: 18,
    color: '#2196F3',
    fontWeight: '600',
    marginTop: 16,
  },
});
