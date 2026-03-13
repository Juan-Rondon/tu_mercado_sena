import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "@/components/buttons/CustomButton";
import Header from "@/components/headers/Header";
import CustomInput from "@/components/inputs/CustomInput";
import ResetPasswordSheet from "@/components/sheets/ResetPasswordSheet";
import { savePendingRegister } from "@/src/lib/pendingRegister";

// const API_BASE_URL = "http://192.168.1.13:8000"; // ip 5g casa juan
const API_BASE_URL = "http://192.168.1.11:8000";

const RegisterScreen = () => {
  const router = useRouter();
  const [openReset, setOpenReset] = useState(false);
  const { height, width } = useWindowDimensions();

  // estados formulario
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [description, setDescription] = useState("");
  const [socialLink, setSocialLink] = useState("");

  const [loading, setLoading] = useState(false);

  const headerHeight = Math.min(220, Math.max(180, height * 0.25));
  const CONTENT_OFFSET = 260;
  const titleSize = width < 360 ? 34 : width < 420 ? 40 : 46;

  // Validación de contraseña segura (en vivo)
  const passwordRules = useMemo(() => {
    return {
      minLen: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const passwordScore = useMemo(() => {
    return Object.values(passwordRules).filter(Boolean).length;
  }, [passwordRules]);

  const passwordIsStrong = useMemo(() => {
    return (
      passwordRules.minLen &&
      passwordRules.hasUpper &&
      passwordRules.hasLower &&
      passwordRules.hasNumber
      // passwordRules.hasSpecial
    );
  }, [passwordRules]);

  // Color dinámico del borde
  const passwordBorderColor = useMemo(() => {
    if (password.length === 0) return "#E5E7EB"; // gris
    if (passwordIsStrong) return "#22C55E"; // verde
    if (passwordScore >= 3) return "#F59E0B"; // amarillo
    return "#EF4444"; // rojo
  }, [password, passwordIsStrong, passwordScore]);

  // Confirmación: color del borde
  const confirmBorderColor = useMemo(() => {
    if (passwordConfirm.length === 0) return "#E5E7EB";
    if (passwordConfirm === password) return "#22C55E";
    return "#EF4444";
  }, [passwordConfirm, password]);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !passwordConfirm.trim()) {
      Alert.alert("Faltan datos", "Completa los campos obligatorios.");
      return;
    }

    // Primero: contraseña segura
    if (!passwordIsStrong) {
      Alert.alert(
        "Contraseña no segura",
        "Debe tener mínimo 8 caracteres y contener:\n• 1 mayúscula\n• letras minúsculas\n• 1 número\n• 1 carácter especial (ej: !@#$%)"
      );
      return;
    }

    if (password !== passwordConfirm) {
      Alert.alert("Contraseñas no coinciden", "Verifica la confirmación de contraseña.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/api/auth/iniciar-registro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          password_confirmation: passwordConfirm,
          nickname: name.trim(),
          estado_id: 1,
          rol_id: 1,
          descripcion: description.trim() || null,
          link_red_social: socialLink.trim() || null,
          notifica_correo: true,
          notifica_push: false,
          uso_datos: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert(
          `Error ${res.status}`,
          data?.message ||
            JSON.stringify(data?.errors || data, null, 2) ||
            "No se pudo iniciar el registro."
        );
        return;
      }

      const cuentaId = data?.data?.cuenta_id;
      const datosEncriptados = data?.data?.datosEncriptados;

      if (!cuentaId || !datosEncriptados) {
        Alert.alert("Error", "Respuesta inesperada del servidor.");
        return;
      }

      await savePendingRegister({
        email: email.trim(),
        cuenta_id: cuentaId,
        datosEncriptados,
      });

      router.replace("/verify");
    } catch (e) {
      Alert.alert("Error", "No fue posible conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safe}>
      <StatusBar style="light" translucent />

      <View style={styles.root}>
        {/* HEADER */}
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
              Registrarse
            </Text>

            <Text
              className="text-white text-lg text-center mt-5 font-semibold"
              style={{ fontSize: 20 }}
            >
              Por favor registrese{"\n"}con su correo institucional
            </Text>
          </View>
        </Header>

        <View style={{ height: CONTENT_OFFSET }} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 40,
              flexGrow: 1,
            }}
          >
            <Text className="text-2xl font-Opensans-medium text-black mb-2">
              Nombre de Usuario *
            </Text>

            <CustomInput
              className="p-1.5"
              placeholder="Nombre de Usuario"
              placeholderTextColor="#CDCDCD"
              type="text"
              icon={<Ionicons name="person-outline" size={20} color="#9CA3AF" />}
              value={name}
              onChangeText={setName}
            />

            <Text className="text-2xl font-Opensans-medium text-black mt-3 mb-2">
              Correo Institucional *
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

            <Text className="text-2xl font-Opensans-medium text-black mt-3 mb-2">
              Contraseña *
            </Text>

            {/* Borde dinámico */}
            <CustomInput
              className="p-1.5"
              placeholder="Ingrese su contraseña"
              placeholderTextColor="#CDCDCD"
              type="password"
              icon={<Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />}
              value={password}
              onChangeText={setPassword}
              containerStyle={{ borderWidth: 2, borderColor: passwordBorderColor }}
            />

            {/* Checklist en vivo */}
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: passwordRules.minLen ? "#22C55E" : "#EF4444" }}>
                • Mínimo 8 caracteres
              </Text>
              <Text style={{ color: passwordRules.hasUpper ? "#22C55E" : "#EF4444" }}>
                • Al menos 1 mayúscula
              </Text>
              <Text style={{ color: passwordRules.hasLower ? "#22C55E" : "#EF4444" }}>
                • Letras minúsculas
              </Text>
              <Text style={{ color: passwordRules.hasNumber ? "#22C55E" : "#EF4444" }}>
                • Al menos 1 número
              </Text>
              {/* <Text style={{ color: passwordRules.hasSpecial ? "#22C55E" : "#EF4444" }}>
                • Al menos 1 carácter especial
              </Text> */}
            </View>

            <Text className="text-2xl font-Opensans-medium text-black mt-3 mb-2">
              Confirmar Contraseña *
            </Text>

            <CustomInput
              className="p-1.5"
              placeholder="Ingrese su contraseña nuevamente"
              placeholderTextColor="#CDCDCD"
              type="password"
              icon={<Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              containerStyle={{ borderWidth: 2, borderColor: confirmBorderColor }}
            />

            <Text className="text-2xl font-Opensans-medium text-black mt-3 mb-2">
              Descripción (Opcional)
            </Text>

            <View style={styles.descriptionContainer}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Cuéntanos algo sobre ti..."
                placeholderTextColor="#CDCDCD"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={styles.descriptionInput}
              />
            </View>

            <Text className="text-2xl font-Opensans-medium text-black mt-3 mb-2">
              Link red social (Opcional)
            </Text>

            <CustomInput
              className="p-1.5"
              placeholder="https://instagram.com/tu_usuario"
              placeholderTextColor="#CDCDCD"
              type="string"
              icon={<Ionicons name="link" size={20} color="#9CA3AF" />}
              value={socialLink}
              onChangeText={setSocialLink}
              autoCapitalize="none"
            />

            <View style={{ height: 30 }} />

            <CustomButton
              variant="contained"
              onPress={handleRegister}
              className="w-full p-5 rounded-r-full rounded-l-full border border-[#2DC75C]"
              FontText="text-2xl"
              color="sextary"
            >
              {loading ? "Creando..." : "Registrar Cuenta"}
            </CustomButton>

            <View className="mt-6 border-t border-gray-300" />

            <View className="items-center mt-6">
              <Text className="text-xl text-gray-400 mb-1">
                ¿Ya tienes una cuenta?
              </Text>

              <CustomButton
                variant="text-only"
                color="secondary"
                FontText="text-xl"
                underline
                onPress={() => router.push("/(stack)/login")}
              >
                Iniciar Sesión
              </CustomButton>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <ResetPasswordSheet visible={openReset} onClose={() => setOpenReset(false)} />
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  root: { flex: 1, backgroundColor: "#ffffff" },

  headerShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 18,
  },

  descriptionContainer: {
    backgroundColor: "#F5F5F7",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  descriptionInput: {
    minHeight: 100,
    fontSize: 16,
    color: "#1a202a",
  },
});