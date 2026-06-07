import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import "react-native-reanimated";

import { AuthProvider } from "@/components/AuthContext";
import { CallProvider } from "@/context/CallContext";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <CallProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="splash" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(main-tabs)" />
          <Stack.Screen name="(counselor-tabs)" />
          <Stack.Screen name="member-login" />
          <Stack.Screen name="counselor-login" />
          <Stack.Screen name="article_detail" />
          <Stack.Screen name="counselor-register" />
          <Stack.Screen name="member-register" />
          <Stack.Screen name="member-information-form" />
          <Stack.Screen name="call-selection" />
          <Stack.Screen name="video-call-room" />
          <Stack.Screen name="schedule-session" />
          <Stack.Screen name="doctor_profile" />
          <Stack.Screen name="reviews" />
          <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
        </Stack>
      </CallProvider>
      <StatusBar barStyle="dark-content" translucent={false} backgroundColor="#FFFFFF" hidden={false} />
    </AuthProvider>
  );
}