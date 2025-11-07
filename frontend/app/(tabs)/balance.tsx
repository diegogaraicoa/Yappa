import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BalanceScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Ionicons name="trending-up" size={32} color="#4CAF50" />
          <Text style={styles.cardTitle}>Balance</Text>
          <Text style={styles.cardDescription}>
            Aqu\u00ed podr\u00e1s ver tus ingresos, egresos y balance general.
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
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 16,
  },
});
