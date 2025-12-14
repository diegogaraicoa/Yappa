import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import pushNotificationService from '../utils/pushNotifications';

interface NotificationContextData {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  requestPermissions: () => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
  checkInsightsAndNotify: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextData>({} as NotificationContextData);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();
  const appState = useRef(AppState.currentState);
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Registrar para push notifications
    registerForPushNotifications();

    // Listener cuando se recibe una notificación
    notificationListener.current = pushNotificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification received:', notification.request.content.title);
        setNotification(notification);
      }
    );

    // Listener cuando el usuario toca una notificación
    responseListener.current = pushNotificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification tapped:', response.notification.request.content.data);
        handleNotificationResponse(response);
      }
    );

    // Listener para cambios de estado de la app
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Verificar insights periódicamente (cada 5 minutos)
    startPeriodicCheck();

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
      subscription.remove();
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, []);

  const registerForPushNotifications = async () => {
    const token = await pushNotificationService.registerForPushNotifications();
    if (token) {
      setExpoPushToken(token);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    // Cuando la app vuelve al primer plano, verificar insights
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('📱 App came to foreground, checking insights...');
      pushNotificationService.checkAndNotifyInsights();
    }
    appState.current = nextAppState;
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    
    // Navegar según el tipo de notificación
    if (data.screen === 'customers') {
      router.push('/customers?from=notification');
    } else if (data.screen === 'inventory') {
      router.push('/(tabs)/inventory?from=notification');
    } else if (data.screen === 'insights') {
      router.push('/insights');
    }
  };

  const startPeriodicCheck = () => {
    // Verificar insights cada 5 minutos
    checkInterval.current = setInterval(() => {
      if (appState.current === 'active') {
        pushNotificationService.checkAndNotifyInsights();
      }
    }, 5 * 60 * 1000); // 5 minutos

    // También verificar al inicio
    setTimeout(() => {
      pushNotificationService.checkAndNotifyInsights();
    }, 10000); // 10 segundos después de iniciar
  };

  const requestPermissions = async (): Promise<boolean> => {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  };

  const sendTestNotification = async () => {
    await pushNotificationService.scheduleLocalNotification(
      '🔔 Notificación de Prueba',
      'Las notificaciones de Yappa están funcionando correctamente.',
      { test: true }
    );
  };

  const checkInsightsAndNotify = async () => {
    await pushNotificationService.checkAndNotifyInsights();
  };

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        requestPermissions,
        sendTestNotification,
        checkInsightsAndNotify,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
