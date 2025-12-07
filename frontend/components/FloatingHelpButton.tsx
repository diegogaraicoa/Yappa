import React from 'react';
import { TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../utils/showAlert';

export default function FloatingHelpButton() {
  const handlePress = () => {
    console.log('FloatingHelpButton pressed!');
    
    showAlert(
      'Necesitas ayuda?',
      'Elige una opción de soporte',
      [
        {
          text: 'WhatsApp',
          onPress: () => {
            const url = 'https://wa.me/593999999999?text=Hola%2C%20necesito%20ayuda%20con%20YAPPA';
            Linking.openURL(url).catch((err) => {
              console.error('Error opening WhatsApp:', err);
              showAlert('Error', 'No se pudo abrir WhatsApp');
            });
          },
        },
        {
          text: 'Email',
          onPress: () => {
            const url = 'mailto:soporte@yappa.app?subject=Ayuda%20YAPPA';
            Linking.openURL(url).catch((err) => {
              console.error('Error opening email:', err);
              showAlert('Error', 'No se pudo abrir el cliente de email');
            });
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
