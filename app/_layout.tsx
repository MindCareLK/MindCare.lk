import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider } from "@/components/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as SplashScreen from "expo-splash-screen"; 
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync(); // 👈 hides native splash once JS is ready
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="splash" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(main-tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(counselor-tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="member-login" options={{ headerShown: false }} />
          <Stack.Screen name="counselor-login" options={{ headerShown: false }} />
        <Stack.Screen name="articles" options={{ headerShown: false }} />
        <Stack.Screen name="article_detail" options={{ headerShown: false }} />
        <Stack.Screen
          name="counselor-register"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="member-register"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="member-information-form"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="call-selection" options={{ headerShown: false }} />
        <Stack.Screen name="video-call-room" options={{ headerShown: false }} />
        <Stack.Screen
          name="schedule-session"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="doctor_profile" options={{ headerShown: false }} />
        <Stack.Screen name="reviews" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      </AuthProvider>
      <StatusBar
        style="dark"
        translucent={false}
        backgroundColor="#FFFFFF"
        hidden={false}
      />
    </ThemeProvider>
  );
}
