import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function MainTabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 85,
          borderTopWidth: 1,
          borderTopColor: '#ECECEC',
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 6,
          paddingTop: 12,
          paddingBottom: 8,
        },
        tabBarItemStyle: {
          minWidth: 60,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter',
          fontSize: 12,
          lineHeight: 14,
          fontWeight: '500',
          marginTop: 8,
        },
        tabBarActiveTintColor: '#2F88E8',
        tabBarInactiveTintColor: '#8E969F',
        sceneStyle: {
          backgroundColor: '#FFFFFF',
        },
        tabBarIcon: ({ color }) => {
          if (route.name === 'home') {
            return <Feather name="home" size={16} color={color} />;
          }
          if (route.name === 'ai-chat') {
            return <Feather name="message-square" size={16} color={color} />;
          }
          if (route.name === 'counselors') {
            return <Feather name="users" size={16} color={color} />;
          }

          return <Feather name="user" size={16} color={color} />;
        },
      })}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="ai-chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="counselors" options={{ title: 'Counselors' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="articles" options={{ href: null }} />
      <Tabs.Screen name="articles_BACKUP_510" options={{ href: null }} />
      <Tabs.Screen name="articles_BASE_510" options={{ href: null }} />
      <Tabs.Screen name="articles_LOCAL_510" options={{ href: null }} />
      <Tabs.Screen name="articles_REMOTE_510" options={{ href: null }} />
    </Tabs>
  );
}
