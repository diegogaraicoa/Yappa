import { Platform, Alert } from 'react-native';

/**
 * Cross-platform alert que funciona en web y móvil
 */
export const showAlert = (
  title: string,
  message?: string,
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>
) => {
  if (Platform.OS === 'web') {
    // En web, usar window.confirm o window.alert
    const fullMessage = message ? `${title}\n\n${message}` : title;
    
    if (buttons && buttons.length > 1) {
      // Si hay múltiples botones, usar confirm
      const result = window.confirm(fullMessage);
      
      // Buscar el botón correcto basado en el resultado
      if (result && buttons[0]?.onPress) {
        buttons[0].onPress();
      } else if (!result && buttons[1]?.onPress) {
        buttons[1].onPress();
      }
    } else {
      // Si solo hay un botón o ninguno, usar alert
      window.alert(fullMessage);
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    // En móvil, usar Alert nativo
    Alert.alert(title, message, buttons);
  }
};
