import CustomButton from "@/components/buttons/CustomButton";
import { getToken } from "@/src/lib/authToken";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const defaultProductImage = require("../../assets/images/imagedefault.png");
const defaultUserImage = require("../../assets/images/default_user.png");

const API_BASE_URL = "https://omwekiatl.xyz/api";
const API_HOST = "https://omwekiatl.xyz";

type UsuarioPerfil = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  red_social?: string | null;
  foto_url?: string | null;
};

type Producto = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number | string;
  imagen_url?: string | null;
};

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const avatarBox = useMemo(() => {
    const size = Math.max(130, Math.min(150, width * 0.38));
    const img = Math.max(90, Math.min(100, size * 0.68));
    return { size, img };
  }, [width]);

  const formatearPrecio = (valor: number | string) => {
    const numero = Number(valor || 0);
    return numero.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    });
  };

  const normalizarUrl = (url?: string | null) => {
    if (!url) return "";
    const limpio = url.trim();
    if (!limpio) return "";
    if (limpio.startsWith("http://") || limpio.startsWith("https://")) {
      return limpio;
    }
    return `https://${limpio}`;
  };

  const normalizarUrlImagen = (url?: string | null) => {
    if (!url) return null;

    const limpio = url.trim();
    if (!limpio) return null;

    if (limpio.startsWith("http://") || limpio.startsWith("https://")) {
      return limpio
        .replace("127.0.0.1", "192.168.1.2")
        .replace("localhost", "192.168.1.2");
    }

    if (limpio.startsWith("/storage/")) {
      return `${API_HOST}${limpio}`;
    }

    if (limpio.startsWith("storage/")) {
      return `${API_HOST}/${limpio}`;
    }

    return limpio;
  };

  const mostrarLink = (url?: string | null) => {
    const urlNormalizada = normalizarUrl(url);
    if (!urlNormalizada) return "";

    try {
      const u = new URL(urlNormalizada);
      return `${u.hostname}${u.pathname}`.replace(/\/$/, "");
    } catch {
      return urlNormalizada;
    }
  };

  const abrirRedSocial = async () => {
    const url = normalizarUrl(perfil?.red_social);
    if (!url) {
      Alert.alert("Red social", "Este usuario no tiene un enlace registrado.");
      return;
    }

    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Enlace inválido", "No fue posible abrir el enlace registrado.");
      return;
    }

    await Linking.openURL(url);
  };

  const cargarPerfilYProductos = useCallback(async () => {
    try {
      const token = await getToken();

      if (!token) {
        Alert.alert("Sesión", "No se encontró el token del usuario.");
        return;
      }

      const perfilResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const perfilData = await perfilResponse.json();

      if (!perfilResponse.ok) {
        throw new Error(perfilData?.message || "No se pudo cargar el perfil.");
      }

      const usuario: UsuarioPerfil = {
        id: perfilData?.data?.id ?? perfilData?.id,
        nombre:
          perfilData?.data?.nickname ??
          perfilData?.nickname ??
          perfilData?.data?.nombre ??
          perfilData?.nombre ??
          "Sin nombre",
        descripcion:
          perfilData?.data?.descripcion ??
          perfilData?.descripcion ??
          "Este usuario no ha agregado una descripción.",
        red_social:
          perfilData?.data?.link ??
          perfilData?.link ??
          perfilData?.data?.red_social ??
          perfilData?.red_social ??
          null,
        foto_url: normalizarUrlImagen(
          perfilData?.data?.imagen ?? perfilData?.imagen ?? null
        ),
      };

      setPerfil(usuario);

      const productosResponse = await fetch(`${API_BASE_URL}/mis-productos`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const productosData = await productosResponse.json();

      if (!productosResponse.ok) {
        throw new Error(productosData?.message || "No se pudieron cargar los productos.");
      }

      const listaProductos: Producto[] = Array.isArray(productosData?.data)
        ? productosData.data.map((item: any) => ({
            id: item.id,
            nombre: item.nombre,
            descripcion: item.descripcion,
            precio: item.precio,
            imagen_url: normalizarUrlImagen(
              item.imagen_url ||
                item.imagen ||
                item.foto ||
                item?.imagenes?.[0]?.ruta ||
                item?.imagenes?.[0]?.imagen_url ||
                null
            ),
          }))
        : [];

      setProductos(listaProductos);
    } catch (error: any) {
      console.error("Error cargando perfil:", error);
      Alert.alert("Error", error?.message || "Ocurrió un error al cargar el perfil.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      cargarPerfilYProductos();
    }, [cargarPerfilYProductos])
  );

  const onRefresh = () => {
    setRefreshing(true);
    cargarPerfilYProductos();
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#57D657" />
          <Text style={{ marginTop: 12, color: "#6b7280" }}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 24 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ marginBottom: 8, alignItems: "flex-start" }}>
          <CustomButton
            variant="text-only"
            color="secondary"
            FontText="text-xl"
            onPress={() => router.back()}
            icon={<Ionicons name="arrow-back" size={20} color="#1C65E3" />}
            iconPosition="left"
          >
            Volver
          </CustomButton>
        </View>

        <Text className="text-center font-Opensans-bold" style={{ fontSize: 18, marginTop: 6 }}>
          TU PERFIL
        </Text>

        <View className="items-center" style={{ marginTop: 22 }}>
          <View
            style={{
              width: avatarBox.size,
              height: avatarBox.size,
              borderRadius: avatarBox.size / 2,
              backgroundColor: "#CDCDCD",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            {perfil?.foto_url ? (
              <Image
                source={{ uri: perfil.foto_url }}
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

          <Text
            className="font-Opensans-medium text-center w-full"
            style={{ marginTop: 14, fontSize: 18 }}
          >
            {perfil?.nombre || "Usuario"}
          </Text>

          <View
            style={{
              flexDirection: "row",
              width: "75%",
              justifyContent: "space-between",
              marginTop: 14,
            }}
          >
            <CustomButton
              variant="icon-only"
              color="sextary"
              onPress={abrirRedSocial}
              icon={<Ionicons name="share-social" size={20} color="#fff" />}
            />

            <CustomButton
              variant="icon-only"
              color="sextary"
              onPress={() => router.push("/editprofile" as any)}
              icon={<MaterialCommunityIcons name="account-edit" size={20} color="#fff" />}
            />

            <CustomButton
              variant="icon-only"
              color="sextary"
              onPress={() => router.push("/")}
              icon={<Ionicons name="bag-outline" size={20} color="#fff" />}
            />

            <CustomButton
              variant="icon-only"
              color="sextary"
              onPress={() => router.push("/(tabs)/Chats")}
              icon={<Ionicons name="chatbox-outline" size={20} color="#fff" />}
            />
          </View>

          <View style={{ width: "75%", marginTop: 18 }}>
            <Text className="text-center text-gray-600 leading-6">
              {perfil?.descripcion?.trim()
                ? perfil.descripcion
                : "Este usuario aún no ha agregado una descripción."}
            </Text>

            {!!perfil?.red_social && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 14,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#f5f5f5",
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 20,
                    maxWidth: "100%",
                  }}
                >
                  <Ionicons name="link-outline" size={16} color="#444" />
                  <Text
                    onPress={abrirRedSocial}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{
                      marginLeft: 6,
                      color: "#111",
                      fontSize: 14,
                      fontWeight: "500",
                      maxWidth: 220,
                    }}
                  >
                    {mostrarLink(perfil.red_social)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: "#d1d5db",
            marginVertical: 22,
            width: "100%",
          }}
        />

        <Text className="text-center font-Opensans-bold" style={{ fontSize: 16, marginBottom: 8 }}>
          Mis productos
        </Text>

        {productos.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#6b7280", marginTop: 12 }}>
            Aún no has publicado productos.
          </Text>
        ) : (
          <View className="flex-row flex-wrap" style={{ marginTop: 6 }}>
            {productos.map((producto) => (
              <View key={producto.id} className="w-1/2 p-2">
                
                <CustomButton
                  variant="card"
                  isOwner={true}
                  source={producto.imagen_url ? { uri: producto.imagen_url } : undefined}
                  defaultImage={defaultProductImage}
                  price={formatearPrecio(producto.precio)}
                  onPress={() => router.push(`/product/${producto.id}` as any)}
                  onCartPress={() => router.push(`/product/${producto.id}?modal=true` as any)}
                >
                  {producto.nombre}
                </CustomButton>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;