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
  isInitialized: boolean;
}

const NotificationContext = createContext<NotificationContextData>({} as NotificationContextData);

// Configure notification handler at module level with error handling
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (error) {
  console.log('⚠️ Notification handler setup failed:', error);
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    let isMounted = true;
    
    const initNotifications = async () => {
      try {
        // Only initialize notifications if we're on a real device (not web)
        if (Platform.OS === 'web') {
          console.log('📱 Notifications not supported on web');
          setIsInitialized(true);
          return;
        }

        // Register for push notifications with comprehensive error handling
        await registerForPushNotifications();

        if (!isMounted) return;

        // Listener when notification is received (app in foreground)
        try {
          notificationListener.current = Notifications.addNotificationReceivedListener(
            (notification) => {
              console.log('📬 Notification received:', notification.request.content.title);
              if (isMounted) {
                setNotification(notification);
              }
            }
          );
        } catch (listenerError) {
          console.log('⚠️ Error setting up notification listener:', listenerError);
        }

        // Listener when user taps notification
        try {
          responseListener.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
              console.log('👆 Notification tapped:', response.notification.request.content.data);
              handleNotificationResponse(response);
            }
          );
        } catch (responseError) {
          console.log('⚠️ Error setting up response listener:', responseError);
        }

        setIsInitialized(true);
      } catch (error) {
        console.log('⚠️ Error initializing notifications (non-fatal):', error);
        // Mark as initialized even on error to prevent blocking the app
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    };

    // Wrap in try-catch and setTimeout to prevent blocking app startup
    setTimeout(() => {
      initNotifications().catch((err) => {
        console.log('⚠️ Notification init failed (non-fatal):', err);
        setIsInitialized(true);
      });
    }, 100);

    // Listener for app state changes
    let subscription: any;
    try {
      subscription = AppState.addEventListener('change', handleAppStateChange);
    } catch (error) {
      console.log('⚠️ AppState listener error:', error);
    }

    return () => {
      isMounted = false;
      try {
        notificationListener.current?.remove();
        responseListener.current?.remove();
        subscription?.remove();
      } catch (error) {
        console.log('⚠️ Cleanup error:', error);
      }
    };
  }, []);

  const registerForPushNotifications = async () => {
    try {
      // Set up Android notification channel
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        } catch (channelError) {
          console.log('⚠️ Error setting notification channel:', channelError);
        }
      }

      // Check/request permissions
      let finalStatus = 'undetermined';
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
      } catch (permError) {
        console.log('⚠️ Error checking permissions:', permError);
        return;
      }

      if (finalStatus !== 'granted') {
        console.log('⚠️ Push notification permissions not granted');
        return;
      }

      // Get push token - this can fail if Firebase is not configured
      // We catch this specifically to prevent crashes
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: '1d4993ea-b1c2-456d-bcf1-928c0dc0b80a',
        });
        setExpoPushToken(tokenData.data);
        console.log('📱 Push token:', tokenData.data);
      } catch (tokenError: any) {
        // This is expected to fail if Firebase is not configured
        // The app should continue to work without push notifications
        console.log('⚠️ Push token unavailable (Firebase may not be configured):', tokenError?.message || tokenError);
      }
    } catch (error) {
      console.log('⚠️ Error in registerForPushNotifications:', error);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    appState.current = nextAppState;
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    try {
      const data = response.notification.request.content.data;
      
      // Navigate based on notification type
      if (data?.screen === 'customers') {
        router.push('/customers?from=notification');
      } else if (data?.screen === 'inventory') {
        router.push('/(tabs)/inventory?from=notification');
      } else if (data?.screen === 'insights') {
        router.push('/insights');
      }
    } catch (error) {
      console.log('⚠️ Error handling notification response:', error);
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
          title: '🔔 Notificacion de Prueba',
          body: 'Las notificaciones de Yappa estan funcionando correctamente.',
          data: { test: true },
        },
        trigger: null,
      });
    } catch (error) {
      console.log('⚠️ Error sending test notification:', error);
    }
  };

  const checkInsightsAndNotify = async () => {
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
        isInitialized,
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
