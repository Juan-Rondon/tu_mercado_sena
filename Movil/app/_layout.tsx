import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View } from "react-native";
import SplashAnimated from "../components/splash/SplashAnimated";
import "./global.css";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "OpenSans-Bold": require("../assets/fonts/OpenSans-Bold.ttf"),
    "OpenSans-Light": require("../assets/fonts/OpenSans-Light.ttf"),
    "OpenSans-Medium": require("../assets/fonts/OpenSans-Medium.ttf"),
  });

  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    const hideNativeSplash = async () => {
      if (fontsLoaded && !nativeSplashHidden) {
        await SplashScreen.hideAsync();
        setNativeSplashHidden(true);
      }
    };

    hideNativeSplash();
  }, [fontsLoaded, nativeSplashHidden]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="welcome" options={{ animation: "none" }} />
        <Stack.Screen name="login" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="register" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="(tabs)" options={{ animation: "slide_from_right" }} />
      </Stack>

      {showAnimatedSplash && (
        <SplashAnimated onFinish={() => setShowAnimatedSplash(false)} />
      )}
    </View>
  );
}