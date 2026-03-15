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
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const defaultProductImage = require("../../assets/images/imagedefault.png");
const defaultUserImage = require("../../assets/images/default_user.png");

const API_BASE_URL = "https://tumercadosena.shop/api";
const API_HOST = "https://tumercadosena.shop";

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
  const { width, height } = useWindowDimensions();

  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mostrarImagenPerfil, setMostrarImagenPerfil] = useState(false);

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
    console.log("normalizarUrlImagen - entrada:", url);

    if (!url) {
      console.log("normalizarUrlImagen - salida:", null);
      return null;
    }

    const limpio = url.trim();
    if (!limpio) {
      console.log("normalizarUrlImagen - salida:", null);
      return null;
    }

    if (
      limpio.includes("/tmp/php") ||
      limpio.startsWith("/tmp/") ||
      limpio.startsWith("tmp/")
    ) {
      console.log("normalizarUrlImagen - ruta temporal detectada, salida:", null);
      return null;
    }

    if (limpio.startsWith("http://") || limpio.startsWith("https://")) {
      console.log("normalizarUrlImagen - salida:", limpio);
      return limpio;
    }

    if (limpio.startsWith("/storage/")) {
      const salida = `${API_HOST}${limpio}`;
      console.log("normalizarUrlImagen - salida:", salida);
      return salida;
    }

    if (limpio.startsWith("storage/")) {
      const salida = `${API_HOST}/${limpio}`;
      console.log("normalizarUrlImagen - salida:", salida);
      return salida;
    }

    if (limpio.startsWith("/")) {
      const salida = `${API_HOST}${limpio}`;
      console.log("normalizarUrlImagen - salida:", salida);
      return salida;
    }

    const salida = `${API_HOST}/${limpio}`;
    console.log("normalizarUrlImagen - salida:", salida);
    return salida;
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

  const abrirImagenPerfil = () => {
    console.log("Tap en imagen de perfil");
    console.log("URL actual imagen perfil:", perfil?.foto_url);
    console.log("¿Tiene foto real?:", !!perfil?.foto_url);
    setMostrarImagenPerfil(true);
  };

  const cerrarImagenPerfil = () => {
    console.log("Cerrar modal imagen perfil");
    setMostrarImagenPerfil(false);
  };

  const cargarPerfilYProductos = useCallback(async () => {
    try {
      const token = await getToken();

      console.log("========== DEBUG TOKEN PERFIL ==========");
      console.log("Token encontrado:", !!token);
      console.log("=======================================");

      if (!token) {
        Alert.alert("Sesión", "No se encontró el token del usuario.");
        return;
      }

      setLoading(true);

      const perfilResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("========== DEBUG RESPUESTA PERFIL ==========");
      console.log("Status perfil:", perfilResponse.status);
      console.log("OK perfil:", perfilResponse.ok);
      console.log("===========================================");

      const perfilData = await perfilResponse.json().catch(() => null);

      console.log("========== DEBUG IMAGEN PERFIL ==========");
      console.log("perfilData completo:", JSON.stringify(perfilData, null, 2));
      console.log("=========================================");

      if (!perfilResponse.ok) {
        throw new Error(perfilData?.message || "No se pudo cargar el perfil.");
      }

      const fotoOriginal =
        perfilData?.data?.imagen ??
        perfilData?.imagen ??
        perfilData?.data?.foto_url ??
        perfilData?.foto_url ??
        perfilData?.data?.imagen_url ??
        perfilData?.imagen_url ??
        perfilData?.data?.foto ??
        perfilData?.foto ??
        null;

      const fotoNormalizada = normalizarUrlImagen(fotoOriginal);

      console.log("foto original backend:", fotoOriginal);
      console.log("foto normalizada:", fotoNormalizada);

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
        foto_url: fotoNormalizada,
      };

      console.log("usuario final seteado:", usuario);

      setPerfil(usuario);

      const productosResponse = await fetch(`${API_BASE_URL}/mis-productos`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const productosData = await productosResponse.json().catch(() => null);

      console.log("PRODUCTOS API:", productosData);

      if (!productosResponse.ok) {
        throw new Error(
          productosData?.message || "No se pudieron cargar los productos."
        );
      }

      const lista = Array.isArray(productosData)
        ? productosData
        : Array.isArray(productosData?.data)
        ? productosData.data
        : [];

      const listaProductos: Producto[] = lista.map((item: any) => {
        const imagenUrl = normalizarUrlImagen(
          item?.fotos?.[0]?.url || item.imagen_url || item.imagen || null
        );

        console.log("URL producto:", imagenUrl);

        return {
          id: item.id,
          nombre: item.nombre,
          descripcion: item.descripcion,
          precio: item.precio,
          imagen_url: imagenUrl,
        };
      });

      console.log("PRODUCTOS PROCESADOS:", listaProductos);

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
    console.log("Refresh manual perfil");
    setRefreshing(true);
    cargarPerfilYProductos();
  };

  console.log("Render imagen perfil:", {
    foto_url: perfil?.foto_url,
    tieneFoto: !!perfil?.foto_url,
    mostrarImagenPerfil,
  });

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
    <>
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
            <Pressable onPress={abrirImagenPerfil}>
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
                    onLoadStart={() => {
                      console.log("Imagen perfil: inicia carga");
                      console.log("URI:", perfil.foto_url);
                    }}
                    onLoad={() => {
                      console.log("Imagen perfil: cargó correctamente");
                      console.log("URI:", perfil.foto_url);
                    }}
                    onLoadEnd={() => {
                      console.log("Imagen perfil: terminó proceso de carga");
                      console.log("URI:", perfil.foto_url);
                    }}
                    onError={(e) => {
                      console.log("ERROR FOTO PERFIL:", e.nativeEvent);
                      console.log("URL FALLIDA PERFIL:", perfil.foto_url);
                    }}
                  />
                ) : (
                  <Image
                    source={defaultUserImage}
                    style={{ width: avatarBox.img, height: avatarBox.img }}
                    resizeMode="contain"
                    onLoad={() => {
                      console.log("Imagen por defecto de perfil cargada");
                    }}
                    onLoadStart={() => {
                      console.log("Imagen por defecto de perfil: inicia carga");
                    }}
                    onLoadEnd={() => {
                      console.log("Imagen por defecto de perfil: terminó proceso");
                    }}
                    onError={(e) => {
                      console.log("ERROR IMAGEN DEFAULT PERFIL:", e.nativeEvent);
                    }}
                  />
                )}
              </View>
            </Pressable>

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
                    onCartPress={() =>
                      router.push(`/product/${producto.id}?modal=true` as any)
                    }
                  >
                    {producto.nombre}
                  </CustomButton>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={mostrarImagenPerfil}
        transparent
        animationType="fade"
        onRequestClose={cerrarImagenPerfil}
      >
        <Pressable
          onPress={cerrarImagenPerfil}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.95)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              width: width,
              height: height,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 16,
            }}
          >
            <Pressable
              onPress={cerrarImagenPerfil}
              style={{
                position: "absolute",
                top: 60,
                right: 24,
                zIndex: 20,
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: 999,
                padding: 8,
              }}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>

            <Image
              source={perfil?.foto_url ? { uri: perfil.foto_url } : defaultUserImage}
              style={{
                width: "100%",
                height: "75%",
              }}
              resizeMode="contain"
              onLoadStart={() => {
                console.log("Modal imagen perfil: inicia carga");
                console.log("URI modal:", perfil?.foto_url ?? "defaultUserImage");
              }}
              onLoad={() => {
                console.log("Modal imagen perfil: cargó correctamente");
                console.log("URI modal:", perfil?.foto_url ?? "defaultUserImage");
              }}
              onLoadEnd={() => {
                console.log("Modal imagen perfil: terminó proceso");
                console.log("URI modal:", perfil?.foto_url ?? "defaultUserImage");
              }}
              onError={(e) => {
                console.log("ERROR MODAL FOTO PERFIL:", e.nativeEvent);
                console.log("URL FALLIDA MODAL PERFIL:", perfil?.foto_url);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default ProfileScreen;