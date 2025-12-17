import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Linking, Modal, View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../utils/showAlert';

export default function FloatingHelpButton() {
  const [showModal, setShowModal] = useState(false);

  const handleWhatsApp = () => {
    const url = 'https://wa.me/593999999999?text=Hola%2C%20necesito%20ayuda%20con%20YAPPA';
    Linking.openURL(url).catch((err) => {
      console.error('Error opening WhatsApp:', err);
      showAlert('Error', 'No se pudo abrir WhatsApp');
    });
    setShowModal(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="headset" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>¿Necesitas ayuda?</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={28} color="#212121" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <TouchableOpacity style={styles.optionButton} onPress={handleWhatsApp}>
                <View style={styles.optionIcon}>
                  <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>WhatsApp</Text>
                  <Text style={styles.optionSubtitle}>Chatea con nosotros</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionButton} onPress={handleEmail}>
                <View style={styles.optionIcon}>
                  <Ionicons name="mail" size={28} color="#00D2FF" />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Email</Text>
                  <Text style={styles.optionSubtitle}>soporte@yappa.app</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <View style={styles.faqSection}>
                <Text style={styles.faqTitle}>Preguntas Frecuentes</Text>
                
                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>¿Cómo registro una venta?</Text>
                  <Text style={styles.faqAnswer}>Ve a la pantalla principal y presiona "Nueva Venta"</Text>
                </View>

                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>¿Cómo veo mis reportes?</Text>
                  <Text style={styles.faqAnswer}>Ve a Explorar → Datos de mi Negocio</Text>
                </View>

                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>¿Cómo uso WhatsApp?</Text>
                  <Text style={styles.faqAnswer}>Ve a Explorar → Capacitación para aprender</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  modalBody: {
    padding: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#757575',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  faqSection: {
    marginBottom: 20,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
});
