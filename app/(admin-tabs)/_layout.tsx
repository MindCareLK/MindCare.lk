import { Feather, Ionicons } from '@expo/vector-icons';
import { Tabs, router, usePathname } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform, StatusBar } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const SIDEBAR_ITEMS = [
  { name: 'Dashboard', icon: 'grid', route: '/(admin-tabs)/dashboard' },
  { name: 'Content Library', icon: 'book-open', route: '/(admin-tabs)/content-library' },
  { name: 'Counselors', icon: 'briefcase', route: '/(admin-tabs)/counselors' },
  { name: 'Patients', icon: 'users', route: '/(admin-tabs)/members' },
  { name: 'Settings', icon: 'settings', route: '/(admin-tabs)/settings' },
];

export default function AdminTabsLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      if (auth) await signOut(auth);
      router.replace('/admin-login' as any);
    } catch (err) {
      console.log(err);
    }
  };

  const Sidebar = () => (
    <View style={styles.sidebar}>
      {/* Logo Area */}
      <View style={styles.logoContainer}>
        <View style={styles.logoIcon}>
          <View style={styles.logoDotsContainer}>
            <View style={styles.logoDot} />
            <View style={styles.logoDot} />
            <View style={styles.logoDot} />
            <View style={styles.logoDot} />
          </View>
        </View>
        <View>
          <Text style={styles.logoTitle}>MindEase</Text>
          <Text style={styles.logoSubtitle}>ADMIN PANEL</Text>
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navContainer}>
        {SIDEBAR_ITEMS.map((item, index) => {
          const cleanRoute = item.route.replace(/\/\([^)]+\)/, '');
          const isActive = pathname === cleanRoute;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => {
                if (item.route !== '#') router.push(item.route as any);
              }}
            >
              <Feather 
                name={item.icon as any} 
                size={20} 
                color={isActive ? '#3B82F6' : '#64748B'} 
                style={styles.navIcon}
              />
              <Text style={[styles.navText, isActive && styles.navTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.sidebarFooter}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={20} color="#EF4444" style={styles.navIcon} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      {isDesktop && <Sidebar />}
      
      <View style={styles.mainContent}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: isDesktop 
              ? { display: 'none' } 
              : {
                  backgroundColor: '#FFFFFF',
                  borderTopColor: '#E2E8F0',
                  height: 60,
                  paddingBottom: 8,
                },
            tabBarActiveTintColor: '#3B82F6',
            tabBarInactiveTintColor: '#64748B',
            tabBarLabelStyle: {
              fontFamily: 'Inter',
              fontSize: 10,
              fontWeight: '600',
            },
            sceneStyle: {
              backgroundColor: '#F8FAFC',
            },
          }}
        >
          <Tabs.Screen
            name="dashboard"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ color }) => <Feather name="grid" size={20} color={color} />,
            }}
          />
          <Tabs.Screen
            name="content-library"
            options={{
              title: 'Content',
              tabBarIcon: ({ color }) => <Feather name="book-open" size={20} color={color} />,
            }}
          />
          <Tabs.Screen
            name="counselors"
            options={{
              title: 'Counselors',
              tabBarIcon: ({ color }) => <Feather name="briefcase" size={20} color={color} />,
            }}
          />
          <Tabs.Screen
            name="members"
            options={{
              title: 'Patients',
              tabBarIcon: ({ color }) => <Feather name="users" size={20} color={color} />,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: ({ color }) => <Feather name="settings" size={20} color={color} />,
            }}
          />
          <Tabs.Screen
            name="appointments"
            options={{
              href: null,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
  },
  mainContent: {
    flex: 1,
  },
  sidebar: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    display: 'flex',
    flexDirection: 'column',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logoIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoDotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 20,
    height: 20,
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoDot: {
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  logoTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  logoSubtitle: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  navContainer: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: '#EFF6FF',
  },
  navIcon: {
    marginRight: 16,
  },
  navText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  navTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  sidebarFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  logoutText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
});
