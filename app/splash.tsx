import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";

const Splash = () => {
  const router = useRouter();
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setShowLoader(true);
    }, 2000);

    const timer2 = setTimeout(() => {
      router.replace("/(main-tabs)/home"); // change to your screen name
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

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
