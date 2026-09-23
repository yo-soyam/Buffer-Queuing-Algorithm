import { Tabs, usePathname } from 'expo-router';
import DevNavigationButton from '../components/dev-navigation-button';
import BottomNavBar from '../components/bottom-nav-bar';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const bufferPaperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#004d99',
    secondary: '#515d84',
    secondaryContainer: '#dbeafe',
    onSecondaryContainer: '#004d99',
    surface: '#ffffff',
    surfaceVariant: '#f0f5fc',
    surfaceContainer: '#f8fafc',
    surfaceContainerHigh: '#ffffff',
    background: '#ffffff',
  },
};

export default function TabLayout() {
  const pathname = usePathname();
  const hideNavBar =
    pathname === '/' ||
    pathname === '/index' ||
    pathname.startsWith('/workflows') ||
    pathname.startsWith('/create-workflow');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={bufferPaperTheme}>
        <Tabs
          tabBar={() => (hideNavBar ? null : <BottomNavBar />)}
          screenOptions={{ headerShown: false }}
          backBehavior="none"
        >
          <Tabs.Screen name="index" options={{ href: null }} />
          <Tabs.Screen name="customer-dashboard" />
          <Tabs.Screen name="live-queue-ticket" />
          <Tabs.Screen name="scan-qr" />
          <Tabs.Screen name="alerts" />
          <Tabs.Screen name="profile" />
        </Tabs>
        <DevNavigationButton />
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
