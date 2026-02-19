import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from './error-boundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider value={NAV_THEME['dark']}>
        <StatusBar style="light" backgroundColor="#0a0f1e" />
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
