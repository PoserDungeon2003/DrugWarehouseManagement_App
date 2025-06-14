import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { useColorScheme } from '@/components/useColorScheme';
import { useGetProfile, useGetUser } from '@/hooks/useUser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import theme from '@/theme';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from 'react-native-paper-toast';
import { clearTokens } from '@/auth/authStorage';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const [queryClient] = useState(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 1, // 1 minutes
        },
      },
    });
  })

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const user = useGetUser();
  const token = user.data?.token; // Access token
  const { data: profile, isError, error, isLoading } = useGetProfile(token || '');
  const router = useRouter();

  // const isAuthenticated = token && token !== ""

  // useEffect(() => {
  //   if (!isLoading && !isAuthenticated) {
  //     router.replace(`/login?message=${encodeURIComponent(`Vui lòng đăng nhập`)}`);
  //   }
  // }, [isLoading, isAuthenticated, router]);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider value={DefaultTheme}>
        <PaperProvider theme={theme}>
          <ToastProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{
                title: 'Đăng nhập',
                headerShown: false,
              }}
              />
              <Stack.Screen name='profile' options={{
                title: 'Thông tin cá nhân',
                headerBackButtonDisplayMode: 'minimal',
              }} />
              <Stack.Screen name='inbound-details/[id]' options={{
                title: 'Chi tiết phiếu nhập',
              }} />
              <Stack.Screen name='outbound-details/[id]' options={{
                title: 'Chi tiết phiếu xuất',
              }} />
              <Stack.Screen name='lot-transfer-details/[id]' options={{
                title: 'Chi tiết phiếu chuyển kho',
              }} />
              <Stack.Screen name='create-inbound-reports/[id]' options={{
                title: 'Chi tiết báo cáo nhập kho',
              }} />
            </Stack>
          </ToastProvider>
        </PaperProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
