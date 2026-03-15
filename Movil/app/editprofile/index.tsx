import CustomButton from "@/components/buttons/CustomButton";
import CustomInput from "@/components/inputs/CustomInput";
import { getToken } from "@/src/lib/authToken";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const API_BASE_URL = "https://tumercadosena.shop/api";
const defaultUserImage = require("../../assets/images/default_user.png");

type PerfilResponse = {
  id: number;
  nickname?: string | null;
  descripcion?: string | null;
  link?: string | null;
  imagen?: string | null;
};

type ImagenSeleccionada = {
  uri: string;
  name: string;
  type: string;
};

const EditProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [nickname, setNickname] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [link, setLink] = useState("");
  const [fotoActual, setFotoActual] = useState<string | null>(null);
  const [nuevaFoto, setNuevaFoto] = useState<ImagenSeleccionada | null>(null);

  const [initialNickname, setInitialNickname] = useState("");
  const [initialDescripcion, setInitialDescripcion] = useState("");
  const [initialLink, setInitialLink] = useState("");
  const [initialFotoActual, setInitialFotoActual] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const avatarBox = useMemo(() => {
    const size = Math.max(140, Math.min(160, width * 0.4));
    const img = Math.max(95, Math.min(110, size * 0.7));
    return { size, img };
  }, [width]);

  const normalizarUrlImagen = (url?: string | null) => {
    if (!url) return null;
    const limpio = url.trim();
    if (!limpio) return null;

    if (limpio.startsWith("http://") || limpio.startsWith("https://")) {
      return limpio;
    }

    if (limpio.startsWith("/storage/")) {
      return `https://tumercadosena.shop${limpio}`;
    }

    return limpio;
  };

  const hayCambiosSinGuardar = useMemo(() => {
    return (
      nickname.trim() !== initialNickname.trim() ||
      descripcion.trim() !== initialDescripcion.trim() ||
      link.trim() !== initialLink.trim() ||
      fotoActual !== initialFotoActual ||
      nuevaFoto !== null
    );
  }, [
    nickname,
    descripcion,
    link,
    fotoActual,
    nuevaFoto,
    initialNickname,
    initialDescripcion,
    initialLink,
    initialFotoActual,
  ]);

  const confirmarSalida = () => {
    if (!hayCambiosSinGuardar) {
      router.back();
      return;
    }

    Alert.alert(
      "¿Salir sin guardar?",
      "Tienes cambios sin guardar. ¿Estás seguro de que deseas salir?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => router.back(),
        },
      ],
      { cancelable: true }
    );
  };

  const cargarPerfil = useCallback(async () => {
    try {
      const token = await getToken();

      if (!token) {
        Alert.alert("Sesión", "No se encontró el token del usuario.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "No se pudo cargar el perfil.");
      }

      const perfil: PerfilResponse = {
        id: data?.data?.id ?? data?.id,
        nickname: data?.data?.nickname ?? data?.nickname ?? "",
        descripcion: data?.data?.descripcion ?? data?.descripcion ?? "",
        link: data?.data?.link ?? data?.link ?? "",
        imagen: data?.data?.imagen ?? data?.imagen ?? null,
      };

      const imagenNormalizada = normalizarUrlImagen(perfil.imagen);

      setUsuarioId(perfil.id);
      setNickname(perfil.nickname || "");
      setDescripcion(perfil.descripcion || "");
      setLink(perfil.link || "");
      setFotoActual(imagenNormalizada);

      setInitialNickname(perfil.nickname || "");
      setInitialDescripcion(perfil.descripcion || "");
      setInitialLink(perfil.link || "");
      setInitialFotoActual(imagenNormalizada);

      setNuevaFoto(null);
    } catch (error: any) {
      console.error("Error cargando perfil:", error);
      Alert.alert("Error", error?.message || "No se pudo cargar la información del perfil.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarPerfil();
  };

  const tomarFoto = async () => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();

    if (!permiso.granted) {
      Alert.alert(
        "Permiso requerido",
        "Debes permitir acceso a la cámara para tomar una foto."
      );
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (resultado.canceled || !resultado.assets?.length) return;

    const asset = resultado.assets[0];

    setNuevaFoto({
      uri: asset.uri,
      name: asset.fileName || `perfil_${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
    });
  };

  const seleccionarDesdeGaleria = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permiso.granted) {
      Alert.alert(
        "Permiso requerido",
        "Debes permitir acceso a la galería para seleccionar una foto."
      );
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (resultado.canceled || !resultado.assets?.length) return;

    const asset = resultado.assets[0];

    setNuevaFoto({
      uri: asset.uri,
      name: asset.fileName || `perfil_${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
    });
  };

  const mostrarOpcionesImagen = () => {
    Alert.alert(
      "Cambiar foto de perfil",
      "Selecciona una opción",
      [
        {
          text: "Tomar foto",
          onPress: tomarFoto,
        },
        {
          text: "Seleccionar foto",
          onPress: seleccionarDesdeGaleria,
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const guardarCambios = async () => {
    try {
      if (!usuarioId) {
        Alert.alert("Error", "No se pudo identificar el usuario.");
        return;
      }

      const token = await getToken();

      if (!token) {
        Alert.alert("Sesión", "No se encontró el token del usuario.");
        return;
      }

      setSaving(true);

      const formData = new FormData();
      formData.append("_method", "PATCH");

      formData.append("nickname", nickname.trim());
      formData.append("descripcion", descripcion.trim());
      formData.append("link", link.trim());

      if (nuevaFoto) {
        formData.append("imagen", {
          uri: nuevaFoto.uri,
          name: nuevaFoto.name,
          type: nuevaFoto.type,
        } as any);
      }

      const response = await fetch(`${API_BASE_URL}/editar-perfil/${usuarioId}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "No se pudo actualizar el perfil.");
      }

      const imagenActualizada = normalizarUrlImagen(data?.imagen ?? fotoActual);

      setInitialNickname(nickname.trim());
      setInitialDescripcion(descripcion.trim());
      setInitialLink(link.trim());
      setInitialFotoActual(imagenActualizada);
      setFotoActual(imagenActualizada);
      setNuevaFoto(null);

      Alert.alert("Éxito", "Perfil actualizado correctamente.");
      router.back();
    } catch (error: any) {
      console.error("Error actualizando perfil:", error);
      Alert.alert("Error", error?.message || "No se pudo actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#57D657" />
          <Text style={{ marginTop: 12, color: "#6b7280" }}>Cargando datos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 120 + insets.bottom,
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={{ marginBottom: 8, alignItems: "flex-start" }}>
            <CustomButton
              variant="text-only"
              color="secondary"
              FontText="text-xl"
              onPress={confirmarSalida}
              icon={<Ionicons name="arrow-back" size={20} color="#1C65E3" />}
              iconPosition="left"
            >
              Volver
            </CustomButton>
          </View>

          <Text className="text-center font-Opensans-bold" style={{ fontSize: 18, marginTop: 6 }}>
            EDITAR PERFIL
          </Text>

          <View style={{ alignItems: "center", marginTop: 24 }}>
            <View
              style={{
                width: avatarBox.size,
                height: avatarBox.size,
                position: "relative",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: avatarBox.size,
                  height: avatarBox.size,
                  borderRadius: avatarBox.size / 2,
                  backgroundColor: "#E5E7EB",
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                }}
              >
                {nuevaFoto ? (
                  <Image
                    source={{ uri: nuevaFoto.uri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : fotoActual ? (
                  <Image
                    source={{ uri: fotoActual }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={defaultUserImage}
                    style={{ width: avatarBox.img, height: avatarBox.img }}
                    resizeMode="contain"
                  />
                )}
              </View>

              <View
                style={{
                  position: "absolute",
                  right: 2,
                  bottom: 2,
                  zIndex: 30,
                  elevation: 10,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                }}
              >
                <CustomButton
                  variant="icon-only"
                  color="sextary"
                  onPress={mostrarOpcionesImagen}
                  icon={<Ionicons name="camera-outline" size={18} color="#fff" />}
                />
              </View>
            </View>

            <Text
              style={{
                marginTop: 12,
                color: "#6B7280",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              Toca el ícono para cambiar la foto
            </Text>
          </View>

          <View style={{ marginTop: 28, gap: 16 }}>
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                Nickname
              </Text>

              <CustomInput
                type="text"
                value={nickname}
                onChangeText={setNickname}
                placeholder="Escribe tu nickname"
                containerStyle={{
                  borderRadius: 14,
                  backgroundColor: "#F5F5F7",
                }}
                icon={<MaterialCommunityIcons name="account-outline" size={20} color="#9CA3AF" />}
              />
            </View>

            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                Descripción
              </Text>

              <View
                style={{
                  backgroundColor: "#F5F5F7",
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <TextInput
                  value={descripcion}
                  onChangeText={setDescripcion}
                  placeholder="Cuéntanos algo sobre ti"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={{
                    minHeight: 110,
                    fontSize: 16,
                    color: "#1a202a",
                  }}
                />
              </View>
            </View>

            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                Red social o enlace
              </Text>

              <CustomInput
                type="text"
                value={link}
                onChangeText={setLink}
                placeholder="https://instagram.com/tuusuario"
                autoCapitalize="none"
                containerStyle={{
                  borderRadius: 14,
                  backgroundColor: "#F5F5F7",
                }}
                icon={<Ionicons name="link-outline" size={20} color="#9CA3AF" />}
              />
            </View>
          </View>

          <View style={{ marginTop: 28, gap: 12 }}>
            <CustomButton
              color="sextary"
              onPress={guardarCambios}
              disabled={saving}
              icon={
                saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialCommunityIcons
                    name="content-save-outline"
                    size={18}
                    color="#000000"
                  />
                )
              }
              iconPosition="left"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </CustomButton>

            <CustomButton
              color="gray"
              onPress={confirmarSalida}
              FontText="text-base"
            >
              Cancelar
            </CustomButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;