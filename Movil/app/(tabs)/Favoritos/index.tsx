import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  DEFAULT: "#32CD32",
  50: "#EAFAEA",
  100: "#C6F1C6",
  200: "#A1E8A1",
  300: "#7CDF7C",
  400: "#57D657",
  500: "#32CD32",
  600: "#29A829",
  700: "#208320",
  800: "#175E17",
  900: "#0E390E",
  950: "#051505",
};

const FavoritosScreen = () => {
  const router = useRouter();

  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const [dots, setDots] = useState("");

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    rotateAnim.setValue(0);
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "") return ".";
        if (prev === ".") return "..";
        if (prev === "..") return "...";
        return "";
      });
    }, 450);

    return () => clearInterval(interval);
  }, [floatAnim, pulseAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Animated.View
          style={{
            transform: [{ translateY: floatAnim }, { scale: pulseAnim }],
            marginBottom: 26,
          }}
        >
          <View
            style={{
              width: 122,
              height: 122,
              borderRadius: 61,
              backgroundColor: COLORS[100],
              justifyContent: "center",
              alignItems: "center",
              shadowColor: COLORS[700],
              shadowOpacity: 0.14,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 8 },
              elevation: 6,
            }}
          >
            <Animated.View
              style={{
                position: "absolute",
                transform: [{ rotate: spin }],
              }}
            >
              <Ionicons name="heart-outline" size={72} color={COLORS[300]} />
            </Animated.View>

            <View
              style={{
                width: 74,
                height: 74,
                borderRadius: 37,
                backgroundColor: "#FFFFFF",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="heart" size={34} color={COLORS[600]} />
            </View>
          </View>
        </Animated.View>

        <View
          style={{
            width: "100%",
            backgroundColor: "#FFFFFF",
            borderRadius: 26,
            paddingHorizontal: 24,
            paddingVertical: 30,
            shadowColor: COLORS[900],
            shadowOpacity: 0.08,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 8 },
            elevation: 5,
            borderWidth: 1,
            borderColor: COLORS[100],
          }}
        >
          <View
            style={{
              alignSelf: "center",
              backgroundColor: COLORS[50],
              borderColor: COLORS[200],
              borderWidth: 1,
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 999,
              marginBottom: 18,
            }}
          >
            <Text
              style={{
                color: COLORS[700],
                fontSize: 13,
                fontWeight: "800",
                letterSpacing: 0.4,
              }}
            >
              PRÓXIMAMENTE
            </Text>
          </View>

          <Text
            style={{
              fontSize: 25,
              fontWeight: "800",
              color: COLORS[900],
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            Estamos preparando tus favoritos
          </Text>

          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: COLORS[600],
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            Esta funcionalidad sigue en desarrollo{dots}
          </Text>

          <Text
            style={{
              fontSize: 15,
              lineHeight: 24,
              color: "#4B5563",
              textAlign: "center",
            }}
          >
            Muy pronto podrás guardar tus productos favoritos y acceder a ellos
            fácilmente desde este módulo, para revisarlos cuando quieras.
          </Text>

          <View
            style={{
              marginTop: 22,
              backgroundColor: COLORS[50],
              borderWidth: 1,
              borderColor: COLORS[100],
              borderRadius: 18,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: COLORS[100],
                justifyContent: "center",
                alignItems: "center",
                marginRight: 10,
              }}
            >
              <Ionicons name="bookmark-outline" size={18} color={COLORS[700]} />
            </View>

            <Text
              style={{
                flex: 1,
                fontSize: 14,
                color: "#4B5563",
                lineHeight: 20,
              }}
            >
              Estamos organizando esta sección para que puedas guardar y consultar
              tus vendedores de interés de forma rápida.
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/(tabs)/Home")}
            style={({ pressed }) => ({
              marginTop: 24,
              backgroundColor: pressed ? COLORS[700] : COLORS[500],
              paddingVertical: 16,
              borderRadius: 18,
              alignItems: "center",
              shadowColor: COLORS[700],
              shadowOpacity: pressed ? 0.14 : 0.22,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 5 },
              elevation: 3,
            })}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "800",
              }}
            >
              Volver al inicio
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default FavoritosScreen;