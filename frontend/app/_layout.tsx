import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { InsightsProvider } from '../contexts/InsightsContext';
import { NotificationProvider } from '../contexts/NotificationContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <InsightsProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="admin" options={{ presentation: 'fullScreenModal' }} />
          </Stack>
        </InsightsProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
