import CustomButton from "@/components/buttons/CustomButton";
import { saveToken } from "@/src/lib/authToken";
import {
  clearPendingRegister,
  getPendingRegister,
} from "@/src/lib/pendingRegister";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// const API_BASE_URL = "http://192.168.1.13:8000"; // ip 5g casa juan
const API_BASE_URL = "https://omwekiatl.xyz";

export default function VerifyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // 🔐 datos recuperados del registro previo
  const [email, setEmail] = useState("");
  const [cuentaId, setCuentaId] = useState<number>(0);
  const [datosEncriptados, setDatosEncriptados] = useState("");

  // código de 6 caracteres
  const [clave, setClave] = useState("");

  // UI
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [infoVisible, setInfoVisible] = useState(true);

  /**
   * Cargar datos desde SecureStore
   */
  useEffect(() => {
    (async () => {
      const pending = await getPendingRegister();

      if (!pending) {
        Alert.alert(
          "Error",
          "Faltan datos del registro. Vuelve a registrarte."
        );
        router.replace("/(stack)/register");
        return;
      }

      setEmail(pending.email);
      setCuentaId(pending.cuenta_id);
      setDatosEncriptados(pending.datosEncriptados);
    })();
  }, []);

  /**
   * Validar código
   */
  const handleVerify = async () => {
    const code = clave.trim().toUpperCase();

    if (code.length !== 6) {
      Alert.alert("Código inválido", "Ingresa los 6 caracteres.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          cuenta_id: cuentaId,
          clave: code,
          datosEncriptados: datosEncriptados,
          device_name: "movil",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert(
          `Error ${res.status}`,
          data?.message ||
            JSON.stringify(data?.errors || data, null, 2)
        );
        return;
      }

      const token = data?.data?.token;
      if (!token) {
        Alert.alert("Error", "El servidor no devolvió token.");
        return;
      }

      await saveToken(token);
      await clearPendingRegister();

      router.replace("/(tabs)/Home");
    } catch (e) {
      Alert.alert("Error", "No fue posible conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reenviar clave
   */
  const handleResend = async () => {
    if (!cuentaId) return;

    try {
      setResending(true);

      const res = await fetch(
        `${API_BASE_URL}/api/auth/reenviar-clave-registro`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ cuenta_id: cuentaId }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        Alert.alert(
          "Error",
          data?.message || "No se pudo reenviar el código."
        );
        return;
      }

      Alert.alert("Listo", "Te reenviamos un nuevo código al correo.");
      setClave("");
    } catch (e) {
      Alert.alert("Error", "No fue posible conectar con el servidor.");
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* HEADER */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#2FBF2F" />
          </Pressable>
          <Text style={styles.headerTitle}>Verificación</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* CONTENIDO */}
        <View style={styles.container}>
          <Text style={styles.title}>Ingresa el código</Text>
          <Text style={styles.subtitle}>
            Enviamos un código de 6 caracteres a{"\n"}
            <Text style={{ fontWeight: "700" }}>{email}</Text>
          </Text>

          <TextInput
            value={clave}
            onChangeText={(text) =>
              setClave(
                text
                  .replace(/[^a-zA-Z0-9]/g, "")
                  .toUpperCase()
                  .slice(0, 6)
              )
            }
            autoCapitalize="characters"
            maxLength={6}
            style={styles.codeInput}
            placeholder="A3F7K2"
            placeholderTextColor="#9CA3AF"
            textAlign="center"
          />

          <View style={{ marginTop: 24 }}>
            <CustomButton
              variant="contained"
              onPress={handleVerify}
              className="w-full p-5 rounded-full"
              FontText="text-2xl"
              color="sextary"
            >
              {loading ? "Validando..." : "Validar código"}
            </CustomButton>
          </View>

          <View style={styles.resendRow}>
            <Text style={{ color: "#6B7280" }}>¿No te llegó?</Text>
            <Pressable onPress={handleResend} disabled={resending}>
              <Text style={{ color: "#2FBF2F", fontWeight: "700" }}>
                {resending ? "Reenviando..." : "Reenviar código"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* MODAL */}
        <Modal visible={infoVisible} transparent animationType="slide">
          <Pressable
            style={styles.backdrop}
            onPress={() => setInfoVisible(false)}
          />
          <View
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Código enviado ✅</Text>
            <Text style={styles.sheetText}>
              Ingresa el código y toca{" "}
              <Text style={{ fontWeight: "700" }}>“Validar código”</Text>.
            </Text>
            <Pressable
              onPress={() => setInfoVisible(false)}
              style={styles.sheetBtn}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                Entendido
              </Text>
            </Pressable>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
    backgroundColor: "#fff",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    color: "#6B7280",
    fontSize: 15,
    textAlign: "center",
  },
  codeInput: {
    marginTop: 22,
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#F5F5F7",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 6,
    color: "#111827",
  },
  resendRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: "#fff",
    padding: 18,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.15)",
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  sheetText: {
    marginTop: 10,
    textAlign: "center",
  },
  sheetBtn: {
    marginTop: 14,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#2FBF2F",
    alignItems: "center",
    justifyContent: "center",
  },
});
