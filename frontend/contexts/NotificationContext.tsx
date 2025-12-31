import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

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
    let isMounted = true;
    
    const initNotifications = async () => {
      try {
        // Registrar para push notifications
        await registerForPushNotifications();

        if (!isMounted) return;

        // Listener cuando se recibe una notificación
        notificationListener.current = Notifications.addNotificationReceivedListener(
          (notification) => {
            console.log('📬 Notification received:', notification.request.content.title);
            setNotification(notification);
          }
        );

        // Listener cuando el usuario toca una notificación
        responseListener.current = Notifications.addNotificationResponseReceivedListener(
          (response) => {
            console.log('👆 Notification tapped:', response.notification.request.content.data);
            handleNotificationResponse(response);
          }
        );
      } catch (error) {
        console.log('⚠️ Error initializing notifications:', error);
      }
    };

    initNotifications();

    // Listener para cambios de estado de la app
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isMounted = false;
      notificationListener.current?.remove();
      responseListener.current?.remove();
      subscription.remove();
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, []);

  const registerForPushNotifications = async () => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('⚠️ Push notification permissions not granted');
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '1d4993ea-b1c2-456d-bcf1-928c0dc0b80a',
      });
      setExpoPushToken(tokenData.data);
      console.log('📱 Push token:', tokenData.data);
    } catch (error) {
      console.log('⚠️ Error getting push token:', error);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
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

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.log('⚠️ Error requesting permissions:', error);
      return false;
    }
  };

  const sendTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Notificación de Prueba',
          body: 'Las notificaciones de Yappa están funcionando correctamente.',
          data: { test: true },
        },
        trigger: null,
      });
    } catch (error) {
      console.log('⚠️ Error sending test notification:', error);
    }
  };

  const checkInsightsAndNotify = async () => {
    // Placeholder - can be implemented later
    console.log('Checking insights...');
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
