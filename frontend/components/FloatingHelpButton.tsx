import React from 'react';
import { TouchableOpacity, StyleSheet, Linking, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FloatingHelpButton() {
  const handlePress = async () => {
    Alert.alert(
      '¿Necesitas ayuda?',
      'Elige una opción de soporte',
      [
        {
          text: 'WhatsApp',
          onPress: async () => {
            try {
              const url = 'https://wa.me/593999999999?text=Hola%2C%20necesito%20ayuda%20con%20YAPPA';
              const canOpen = await Linking.canOpenURL(url);
              if (canOpen) {
                await Linking.openURL(url);
              } else {
                Alert.alert('Error', 'No se pudo abrir WhatsApp');
              }
            } catch (error) {
              console.error('Error opening WhatsApp:', error);
              Alert.alert('Error', 'No se pudo abrir WhatsApp');
            }
          },
        },
        {
          text: 'Email',
          onPress: async () => {
            try {
              const url = 'mailto:soporte@yappa.app?subject=Ayuda%20YAPPA';
              const canOpen = await Linking.canOpenURL(url);
              if (canOpen) {
                await Linking.openURL(url);
              } else {
                Alert.alert('Error', 'No se pudo abrir el cliente de email');
              }
            } catch (error) {
              console.error('Error opening email:', error);
              Alert.alert('Error', 'No se pudo abrir el cliente de email');
            }
          },
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.floatingButton}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Ionicons name="help-circle" size={32} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00D2FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 1000,
  },
});
