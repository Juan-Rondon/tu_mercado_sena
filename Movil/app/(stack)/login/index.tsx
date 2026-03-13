import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Alert, Keyboard, StyleSheet, Text, TouchableWithoutFeedback, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ResetPasswordFlow from "@/components/auth/ResetPasswordFlow";
import CustomButton from "@/components/buttons/CustomButton";
import Header from "@/components/headers/Header";
import CustomInput from "@/components/inputs/CustomInput";
import ResetPasswordSheet from "@/components/sheets/ResetPasswordSheet";
import { saveToken } from "@/src/lib/authToken";

const API_BASE_URL = "http://192.168.1.11:8000";
// const API_BASE_URL = "http://192.168.1.13:8000"; // casa juan 5g
//const API_BASE_URL = "http://192.168.1.7:8000"; // ip jean
// const API_BASE_URL = "http://192.168.18.4:8000"; IP Sebas

const LoginScreen = () => {
  const router = useRouter();
  const [openReset, setOpenReset] = useState(false);
  const { height, width } = useWindowDimensions();

  // estados para el formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // loading para evitar doble click
  const [loading, setLoading] = useState(false);

  // ALTURA VISUAL DEL HEADER (puedes cambiarla libremente)
  const headerHeight = Math.min(220, Math.max(180, height * 0.25));

  // POSICIÓN FIJA DEL CONTENIDO (NO CAMBIA)
  const CONTENT_OFFSET = 280;

  const titleSize = width < 360 ? 34 : width < 420 ? 40 : 46;

    const handleLogin = async () => {
  if (!email.trim() || !password.trim()) {
    Alert.alert("Faltan datos", "Por favor ingresa correo y contraseña.");
    return;
  }

  try {
    setLoading(true);

    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        password,
        device_name: "movil",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg =
        data?.message ||
        data?.errors?.email?.[0] ||
        data?.errors?.password?.[0] ||
        "No se pudo iniciar sesión.";
      Alert.alert("Error", msg);
      return;
    }

    const token = data?.data?.token;

    if (!token) {
      Alert.alert("Error", "El servidor no devolvió token.");
      return;
    }

    await saveToken(token);
    router.replace("/(tabs)/Home");
  } catch (e) {
    Alert.alert("Error", "No fue posible conectar con el servidor.");
  } finally {
    setLoading(false);
  }
};


  return (
    <SafeAreaView edges={["bottom"]} style={styles.safe}>
      <StatusBar style="light" translucent />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.root}>
        {/* HEADER (solo visual) */}
        <Header
          variant="normal"
          height={headerHeight}
          radius={70}
          color="sextary"
          titleSize={titleSize}
          showLogo={false}
          style={styles.headerShadow}
        >
          <View className="items-center px-6">
            <Text
              className="font-Opensans-bold text-white text-center"
              style={{
                marginTop: 5,
                fontSize: 40,
                textShadowColor: "rgba(0,0,0,0.35)",
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}
            >
              Iniciar Sesión
            </Text>

            <Text
              className="text-white text-lg text-center mt-5 font-semibold"
              style={{ fontSize: 20 }}
            >
              Por favor inicie sesión{"\n"}con una cuenta registrada
            </Text>
          </View>
        </Header>

        {/* ESPACIO FIJO DEL CONTENIDO (NO depende del header) */}
        <View style={{ height: CONTENT_OFFSET }} />

        {/* FORMULARIO (YA NO SE MUEVE) */}
        <View style={styles.form}>
          <Text className="text-2xl font-Opensans-medium text-black mb-2">
            Correo Institucional
          </Text>

          <CustomInput
            className="p-1.5"
            placeholder="Ejemplo@sena.edu.co"
            placeholderTextColor="#CDCDCD"
            type="email"
            icon={<Ionicons name="mail-outline" size={20} color="#9CA3AF" />}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          <Text className="text-2xl font-Opensans-medium text-black mt-6 mb-2">
            Contraseña
          </Text>

          <CustomInput
            className="p-1.5"
            placeholder="Ingrese su contraseña"
            placeholderTextColor="#CDCDCD"
            type="password"
            icon={<Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />}
            value={password}
            onChangeText={setPassword}
          />

          <View className="items-end mt-3">
            <CustomButton
              variant="text-only"
              color="secondary"
              FontText="text-xl"
              underline
              onPress={() => setOpenReset(true)}
            >
              ¿Olvidaste tu contraseña?
            </CustomButton>
          </View>

          <View className="items-center mt-8">
            <CustomButton
              variant="contained"
              onPress={handleLogin}
              className="w-full p-5 rounded-r-full rounded-l-full border border-[#2DC75C]"
              FontText="text-2xl"
              color="sextary"
            >
              {loading ? "Ingresando..." : "Iniciar Sesión"}
            </CustomButton>
          </View>

          <View className="mt-10 mb-6 border-t border-gray-300" />

          <View className="items-center">
            <Text className="text-xl text-gray-400 mb-1">
              ¿No tienes una cuenta?
            </Text>

            <CustomButton
              variant="text-only"
              color="secondary"
              FontText="text-xl"
              underline
              onPress={() => router.push("/(stack)/register")}
            >
              Registrarse
            </CustomButton>
          </View>
        </View>

        {/* FOOTER */}
        <View className="items-center pb-6">
          <Text className="text-xl text-gray-400">Versión 0.0.1</Text>
        </View>
      </View>
      </TouchableWithoutFeedback>

      <ResetPasswordSheet visible={openReset} onClose={() => setOpenReset(false)}>
        <ResetPasswordFlow onDone={() => setOpenReset(false)} />
      </ResetPasswordSheet>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  root: { flex: 1, backgroundColor: "#ffffff" },
  form: { flex: 1, paddingHorizontal: 24 },

  headerShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 18,
  },
});
