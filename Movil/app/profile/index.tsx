import CustomButton from "@/components/buttons/CustomButton";
import { getToken } from "@/src/lib/authToken";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
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
  Share,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const defaultProductImage = require("../../assets/images/imagedefault.png");
const defaultUserImage = require("../../assets/images/default_user.png");

const API_BASE_URL = "https://tumercadosena.shop/api/api";
const API_HOST = "https://tumercadosena.shop";

const ESTADO_ELIMINADO_ID = 3;

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
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const { colors } = useAppTheme();

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mostrarImagenPerfil, setMostrarImagenPerfil] = useState(false);
  const [productoAccionandoId, setProductoAccionandoId] = useState<number | null>(null);
  const [miUsuarioId, setMiUsuarioId] = useState<number | null>(null);

  const avatarBox = useMemo(() => {
    const size = Math.max(130, Math.min(150, width * 0.38));
    const img = Math.max(90, Math.min(100, size * 0.68));
    return { size, img };
  }, [width]);

  const userIdNumber = userId ? Number(userId) : null;
  const viendoPerfilExterno = !!userIdNumber;
  const esMiPerfil =
    !viendoPerfilExterno || (miUsuarioId !== null && userIdNumber === miUsuarioId);

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

    if (
      limpio.includes("/tmp/php") ||
      limpio.startsWith("/tmp/") ||
      limpio.startsWith("tmp/")
    ) {
      return null;
    }

    if (limpio.startsWith("http://") || limpio.startsWith("https://")) {
      return limpio;
    }

    if (limpio.startsWith("/storage/")) {
      return `${API_HOST}${limpio}`;
    }

    if (limpio.startsWith("storage/")) {
      return `${API_HOST}/${limpio}`;
    }

    if (limpio.startsWith("usuarios/")) {
      return `${API_HOST}/storage/${limpio}`;
    }

    if (limpio.startsWith("/")) {
      return `${API_HOST}${limpio}`;
    }

    return `${API_HOST}/${limpio}`;
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

  const compartirPerfil = async () => {
    try {
      if (!perfil?.id) {
        Alert.alert("Perfil", "No fue posible generar el enlace del perfil.");
        return;
      }

      const nombre = perfil?.nombre?.trim() || "Usuario";
      const perfilUrl = `${API_HOST}/perfil/${perfil.id}`;
      const mensaje = `Mira el perfil de ${nombre} en Tu Mercado SENA:\n${perfilUrl}`;

      await Share.share(
        {
          title: `Perfil de ${nombre}`,
          message: mensaje,
        },
        {
          dialogTitle: `Compartir perfil de ${nombre}`,
          subject: `Perfil de ${nombre}`,
        }
      );
    } catch (error) {
      Alert.alert("Error", "No fue posible abrir las opciones para compartir.");
    }
  };

  const abrirImagenPerfil = () => {
    setMostrarImagenPerfil(true);
  };

  const cerrarImagenPerfil = () => {
    setMostrarImagenPerfil(false);
  };

  const mapearPerfil = (data: any): UsuarioPerfil => {
    const fotoOriginal =
      data?.imagen ??
      data?.foto_url ??
      data?.imagen_url ??
      data?.foto ??
      data?.usuario?.imagen ??
      data?.usuario?.foto_url ??
      data?.usuario?.imagen_url ??
      data?.usuario?.foto ??
      data?.vendedor?.imagen ??
      data?.vendedor?.foto_url ??
      data?.vendedor?.imagen_url ??
      data?.vendedor?.foto ??
      null;

    return {
      id: data?.id ?? data?.usuario?.id ?? data?.vendedor?.id,
      nombre:
        data?.nickname ??
        data?.nombre ??
        data?.usuario?.nickname ??
        data?.usuario?.nombre ??
        data?.vendedor?.nickname ??
        data?.vendedor?.nombre ??
        "Sin nombre",
      descripcion:
        data?.descripcion ??
        data?.usuario?.descripcion ??
        data?.vendedor?.descripcion ??
        "Este usuario no ha agregado una descripción.",
      red_social:
        data?.link ??
        data?.red_social ??
        data?.usuario?.link ??
        data?.usuario?.red_social ??
        data?.vendedor?.link ??
        data?.vendedor?.red_social ??
        null,
      foto_url: normalizarUrlImagen(fotoOriginal),
    };
  };

  const mapearProductos = (lista: any[]): Producto[] => {
    return lista.map((item: any) => ({
      id: item.id,
      nombre: item.nombre,
      descripcion: item.descripcion,
      precio: item.precio,
      imagen_url: item?.fotos?.[0]?.url || null,
    }));
  };

  const cargarPerfilYProductos = useCallback(async () => {
    try {
      const token = await getToken();

      if (!token) {
        Alert.alert("Sesión", "No se encontró el token del usuario.");
        return;
      }

      setLoading(true);

      const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const meData = await meResponse.json().catch(() => null);

      if (!meResponse.ok) {
        throw new Error(meData?.message || "No se pudo cargar la información del usuario.");
      }

      const miId = meData?.data?.id ?? meData?.id ?? null;
      setMiUsuarioId(miId);

      if (!userIdNumber || (miId !== null && Number(userIdNumber) === Number(miId))) {
        const usuario = mapearPerfil(meData?.data ?? meData);
        setPerfil(usuario);

        const productosResponse = await fetch(`${API_BASE_URL}/mis-productos`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const productosData = await productosResponse.json().catch(() => null);

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

        setProductos(mapearProductos(lista));
        return;
      }

      const perfilExternoResponse = await fetch(`${API_BASE_URL}/vendedores/${userIdNumber}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const perfilExternoData = await perfilExternoResponse.json().catch(() => null);

      if (!perfilExternoResponse.ok) {
        throw new Error(
          perfilExternoData?.message || "No se pudo cargar el perfil del vendedor."
        );
      }

      const dataVendedor = perfilExternoData?.data ?? perfilExternoData;
      setPerfil(mapearPerfil(dataVendedor));

      const listaExterna = Array.isArray(dataVendedor?.productos)
        ? dataVendedor.productos
        : Array.isArray(dataVendedor?.vendedor?.productos)
        ? dataVendedor.vendedor.productos
        : [];

      setProductos(mapearProductos(listaExterna));
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Ocurrió un error al cargar el perfil.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setProductoAccionandoId(null);
    }
  }, [userIdNumber]);

  useFocusEffect(
    React.useCallback(() => {
      cargarPerfilYProductos();
    }, [cargarPerfilYProductos])
  );

  const onRefresh = () => {
    setRefreshing(true);
    cargarPerfilYProductos();
  };

  const irAEditarProducto = (productoId: number) => {
    router.push({
      pathname: "/Vender" as any,
      params: {
        edit: "true",
        productId: String(productoId),
      },
    });
  };

  const eliminarProductoPorEstado = async (productoId: number) => {
    try {
      const token = await getToken();

      if (!token) {
        Alert.alert("Sesión", "No se encontró el token del usuario.");
        return;
      }

      setProductoAccionandoId(productoId);

      const response = await fetch(`${API_BASE_URL}/productos/${productoId}/estado`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          estado_id: ESTADO_ELIMINADO_ID,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "No fue posible cambiar el estado del producto."
        );
      }

      Alert.alert("Éxito", "Producto eliminado correctamente.");
      cargarPerfilYProductos();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No fue posible eliminar el producto.");
      setProductoAccionandoId(null);
    }
  };

  const abrirMenuProducto = (producto: Producto) => {
    Alert.alert(producto.nombre, "Selecciona una acción", [
      {
        text: "Editar",
        onPress: () => irAEditarProducto(producto.id),
      },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Eliminar producto",
            "¿Seguro que deseas eliminar este producto?",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Eliminar",
                style: "destructive",
                onPress: () => eliminarProductoPorEstado(producto.id),
              },
            ]
          );
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.success} />
          <Text style={{ marginTop: 12, color: colors.textMuted }}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 24 + insets.bottom,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <View style={{ marginBottom: 8, alignItems: "flex-start" }}>
            <CustomButton
              variant="text-only"
              color="secondary"
              FontText="text-xl"
              onPress={() => router.back()}
              icon={<Ionicons name="arrow-back" size={20} color={colors.primary} />}
              iconPosition="left"
            >
              Volver
            </CustomButton>
          </View>

          <Text
            className="text-center font-Opensans-bold"
            style={{ fontSize: 18, marginTop: 6, color: colors.text }}
          >
            {esMiPerfil ? "TU PERFIL" : "PERFIL DEL VENDEDOR"}
          </Text>

          <View className="items-center" style={{ marginTop: 22 }}>
            <Pressable onPress={abrirImagenPerfil}>
              <View
                style={{
                  width: avatarBox.size,
                  height: avatarBox.size,
                  borderRadius: avatarBox.size / 2,
                  backgroundColor: colors.surface,
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: colors.border,
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
            </Pressable>

            <Text
              className="font-Opensans-medium text-center w-full"
              style={{ marginTop: 14, fontSize: 18, color: colors.text }}
            >
              {perfil?.nombre || "Usuario"}
            </Text>

            <View style={{ width: "75%", marginTop: 18 }}>
              <Text style={{ color: colors.textMuted }} className="text-center leading-6">
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
                      backgroundColor: colors.card,
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 20,
                      maxWidth: "100%",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Ionicons name="link-outline" size={16} color={colors.textMuted} />
                    <Text
                      onPress={abrirRedSocial}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={{
                        marginLeft: 6,
                        color: colors.text,
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

              {esMiPerfil ? (
                <View
                  style={{
                    flexDirection: "row",
                    width: "100%",
                    justifyContent: "space-between",
                    marginTop: 18,
                  }}
                >
                  <CustomButton
                    variant="icon-only"
                    color="sextary"
                    onPress={compartirPerfil}
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
                    onPress={() => router.push("/" as any)}
                    icon={<Ionicons name="bag-outline" size={20} color="#fff" />}
                  />

                  <CustomButton
                    variant="icon-only"
                    color="sextary"
                    onPress={() => router.push("/(tabs)/Chats" as any)}
                    icon={<Ionicons name="chatbox-outline" size={20} color="#fff" />}
                  />
                </View>
              ) : (
                <View style={{ marginTop: 18 }}>
                  <Pressable
                    style={{
                      backgroundColor: colors.success,
                      paddingVertical: 14,
                      borderRadius: 14,
                    }}
                    onPress={() => router.push("/(tabs)/Chats" as any)}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        textAlign: "center",
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      Chatear con el vendedor
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginVertical: 22,
              width: "100%",
            }}
          />

          <Text
            className="text-center font-Opensans-bold"
            style={{ fontSize: 16, marginBottom: 8, color: colors.text }}
          >
            {esMiPerfil ? "Mis productos" : "Productos publicados"}
          </Text>

          {productos.length === 0 ? (
            <Text style={{ textAlign: "center", color: colors.textMuted, marginTop: 12 }}>
              {esMiPerfil
                ? "Aún no has publicado productos."
                : "Este usuario aún no tiene productos publicados."}
            </Text>
          ) : (
            <View className="flex-row flex-wrap" style={{ marginTop: 6 }}>
              {productos.map((producto) => (
                <View key={producto.id} className="w-1/2 p-2">
                  <View style={{ position: "relative" }}>
                    <CustomButton
                      variant="card"
                      isOwner={esMiPerfil}
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

                    {esMiPerfil && (
                      <Pressable
                        onPress={() => abrirMenuProducto(producto)}
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          backgroundColor: "rgba(0,0,0,0.55)",
                          justifyContent: "center",
                          alignItems: "center",
                          zIndex: 20,
                        }}
                      >
                        {productoAccionandoId === producto.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
                        )}
                      </Pressable>
                    )}
                  </View>
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
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default ProfileScreen;