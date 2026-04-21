import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function CounselorTabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 62,
          borderTopWidth: 1,
          borderTopColor: '#ECECEC',
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 6,
          paddingTop: 6,
        },
        tabBarItemStyle: {
          minWidth: 60,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter',
          fontSize: 11,
          lineHeight: 14,
          fontWeight: '500',
          marginTop: 3,
        },
        tabBarActiveTintColor: '#30353B',
        tabBarInactiveTintColor: '#8E969F',
        sceneStyle: {
          backgroundColor: '#F3F5F8',
        },
        tabBarIcon: ({ color }) => {
          if (route.name === 'overview') {
            return <Feather name="grid" size={16} color={color} />;
          }

          if (route.name === 'schedule') {
            return <Feather name="calendar" size={16} color={color} />;
          }

          return <Feather name="user" size={16} color={color} />;
        },
      })}>
      <Tabs.Screen name="overview" options={{ title: 'Overview' }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule' }} />
      <Tabs.Screen name="profile" options={{ title: 'My Profile' }} />
    </Tabs>
  );
}
