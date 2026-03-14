import { deleteToken } from "@/src/lib/authToken";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_HEIGHT = 72;

export default function Configuracion() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Seguro que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            await deleteToken();
            router.replace("/(stack)/welcome");
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,

          
          paddingBottom: TAB_HEIGHT + Math.max(insets.bottom, 12) + 40,
        }}
      >
        {/* CUENTA */}
        <Text className="text-lg font-bold mb-2">Cuenta</Text>

        <SettingItem
          icon="person-outline"
          title="Cuenta"
          onPress={() => router.push("/profile")}
        />

        {/* SEGURIDAD */}
        <Text className="text-lg font-bold mt-6 mb-2">Seguridad</Text>

        <SettingItem
          icon="lock-closed-outline"
          title="Cambiar contraseña"
          onPress={() => router.push("/security/changePassword")}
        />

        <SettingItem
          icon="eye-outline"
          title="Privacidad"
          subtitle="Quién puede ver tu perfil, actividad en línea"
          onPress={() => router.push("/security/privacy")}
        />

        <SettingItem
          icon="remove-circle-outline"
          title="Bloqueo de Usuarios"
          subtitle="Gestión de usuarios"
          onPress={() => router.push("/security/blockedUser")}
        />

        {/* PREFERENCIAS */}
        <Text className="text-lg font-bold mt-6 mb-2">Preferencias</Text>

        <SettingItem
          icon="notifications-outline"
          title="Notificaciones"
          subtitle="Sonido, vibración, recordatorios"
          onPress={() => router.push("/preferences/notifications")}
        />

        <SettingItem
          icon="moon-outline"
          title="Modo oscuro"
          subtitle="Tema claro u oscuro"
          onPress={() => router.push("/preferences/darkmode")}
        />

        {/* INFORMACIÓN */}
        <Text className="text-lg font-bold mt-6 mb-2">Información</Text>

        <SettingItem 
          icon="information-circle-outline" 
          title="Sobre nosotros" 
          onPress={() => router.push("/information/AboutUs")}
        />

        
        <SettingItem 
          icon="help-circle-outline" 
          title="Acerca de nosotros" 
          onPress={() => router.push("/information/AboutApp")}
        />

        <SettingItem 
          icon="document-text-outline" 
          title="Términos y condiciones" 
          onPress={() => router.push("/information/AboutUs")}
        />

        {/* LOGOUT */}
        <SettingItem
          icon="log-out-outline"
          title="Cerrar sesión"
          danger
          onPress={handleLogout}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingItem({ icon, title, subtitle, onPress, danger }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
        <Ionicons name={icon} size={24} color={danger ? "#DC2626" : "#111827"} />

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: danger ? "#DC2626" : "#111827" }}>
            {title}
          </Text>

          {!!subtitle && (
            <Text style={{ marginTop: 2, color: "#6B7280", fontSize: 13 }}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={22} color={danger ? "#DC2626" : "#111827"} />
    </TouchableOpacity>
  );
}
