import { useAuthContext } from "@/components/AuthContext";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";

const Splash = () => {
  const router = useRouter();
  const { isAuthReady, currentUser, userRole } = useAuthContext();
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    // We only want to set up timers if auth has been resolved
    if (!isAuthReady) return;

    const timer1 = setTimeout(() => {
      setShowLoader(true);
    }, 2000);

    const timer2 = setTimeout(() => {
      if (currentUser) {
        if (userRole === 'admin') {
          router.replace('/(admin-tabs)/dashboard');
        } else if (userRole === 'counselor') {
          router.replace('/(counselor-tabs)/overview');
        } else if (userRole === 'member') {
          router.replace('/(main-tabs)/home');
        } else {
          router.replace("/(tabs)/role-selection");
        }
      } else {
        router.replace("/(tabs)/role-selection");
      }
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isAuthReady, currentUser, userRole, router]);

  return (
    <View style={styles.container}>
      {!showLoader ? (
        <Image source={require("../assets/Logo.png")} style={styles.logo} />
      ) : (
        <LottieView
          source={require("../assets/Loading.json")}
          autoPlay
          loop
          style={styles.loader}
        />
      )}
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
  },
  loader: {
    width: 150,
    height: 150,
  },
});
