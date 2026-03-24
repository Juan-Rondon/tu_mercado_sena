import CustomButton from "@/components/buttons/CustomButton";
import { getToken } from "@/src/lib/authToken";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
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
const PAGE_SIZE = 15;

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

type ApiPagination = {
  total?: number;
  per_page?: number;
  current_page?: number;
  last_page?: number;
};

const ProfileScreen = () => {
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const { colors } = useAppTheme();

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mostrarImagenPerfil, setMostrarImagenPerfil] = useState(false);
  const [productoAccionandoId, setProductoAccionandoId] = useState<number | null>(null);
  const [miUsuarioId, setMiUsuarioId] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const onEndReachedCalledDuringMomentum = useRef(false);

  const avatarBox = useMemo(() => {
    const size = Math.max(130, Math.min(150, width * 0.38));
    const img = Math.max(90, Math.min(100, size * 0.68));
    return { size, img };
  }, [width]);

  const parsedUserId = Number(userId);
  const userIdNumber =
    userId && Number.isFinite(parsedUserId) && parsedUserId > 0 ? parsedUserId : null;

  const viendoPerfilExterno = userIdNumber !== null;
  const esMiPerfil =
    miUsuarioId === null
      ? !viendoPerfilExterno
      : !viendoPerfilExterno || Number(userIdNumber) === Number(miUsuarioId);

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

    const limpio = String(url).trim().replace(/\s+/g, "");
    if (!limpio) return "";

    if (/^https?:\/\//i.test(limpio)) {
      return encodeURI(limpio);
    }

    return encodeURI(`https://${limpio}`);
  };

  const normalizarUrlImagen = (url?: string | null) => {
    if (!url) return null;

    const limpio = String(url).trim();
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

    if (limpio.startsWith("productos/")) {
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

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error("Error abriendo red social:", error);
      Alert.alert("Enlace inválido", "No fue posible abrir el enlace registrado.");
    }
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
    } catch {
      Alert.alert("Error", "No fue posible abrir las opciones para compartir.");
    }
  };

  const abrirImagenPerfil = () => {
    if (!perfil?.foto_url) return;
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
      data?.usuario_votado?.imagen ??
      null;

    return {
      id:
        Number(
          data?.id ??
            data?.usuario?.id ??
            data?.vendedor?.id ??
            data?.usuario_votado?.id ??
            0
        ) || 0,
      nombre:
        data?.nickname ??
        data?.nombre ??
        data?.usuario?.nickname ??
        data?.usuario?.nombre ??
        data?.vendedor?.nickname ??
        data?.vendedor?.nombre ??
        data?.usuario_votado?.nickname ??
        data?.usuario_votado?.nombre ??
        "Sin nombre",
      descripcion:
        data?.descripcion ??
        data?.usuario?.descripcion ??
        data?.vendedor?.descripcion ??
        data?.usuario_votado?.descripcion ??
        "Este usuario no ha agregado una descripción.",
      red_social:
        data?.link ??
        data?.red_social ??
        data?.usuario?.link ??
        data?.usuario?.red_social ??
        data?.vendedor?.link ??
        data?.vendedor?.red_social ??
        data?.usuario_votado?.link ??
        data?.usuario_votado?.red_social ??
        null,
      foto_url: normalizarUrlImagen(fotoOriginal),
    };
  };

  const resolverImagenProducto = (item: any) => {
    const foto = item?.fotos?.[0];

    if (foto?.url) {
      return normalizarUrlImagen(foto.url);
    }

    if (foto?.imagen) {
      return normalizarUrlImagen(`productos/${item.id}/${foto.imagen}`);
    }

    if (item?.imagen_url) {
      return normalizarUrlImagen(item.imagen_url);
    }

    if (item?.imagen) {
      return normalizarUrlImagen(item.imagen);
    }

    return null;
  };

  const mapearProductos = (lista: any[]): Producto[] => {
    return lista.map((item: any) => ({
      id: Number(item.id),
      nombre: item.nombre,
      descripcion: item.descripcion,
      precio: item.precio,
      imagen_url: resolverImagenProducto(item),
    }));
  };

  const extraerLista = (payload: any): any[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const extraerPagination = (payload: any): ApiPagination | null => {
    if (payload?.pagination) return payload.pagination;
    if (payload?.data?.pagination) return payload.data.pagination;
    return null;
  };

  const cargarPerfilBase = useCallback(async (token: string) => {
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

    const miId = Number(meData?.data?.id ?? meData?.id ?? 0) || null;
    setMiUsuarioId(miId);

    return {
      miId,
      meData,
    };
  }, []);

  const cargarProductosMiPerfil = useCallback(
    async (token: string, pageToLoad: number, reset = false) => {
      const response = await fetch(
        `${API_BASE_URL}/mis-productos?page=${pageToLoad}&per_page=${PAGE_SIZE}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "No se pudieron cargar los productos.");
      }

      const lista = extraerLista(data);
      const pagination = extraerPagination(data);

      const currentPage = Number(pagination?.current_page ?? pageToLoad);
      const serverLastPage = Number(pagination?.last_page ?? pageToLoad);

      setPage(currentPage);
      setLastPage(serverLastPage);
      setHasMore(currentPage < serverLastPage);

      const productosMapeados = mapearProductos(lista);

      if (reset) {
        setProductos(productosMapeados);
      } else {
        setProductos((prev) => {
          const ids = new Set(prev.map((item) => item.id));
          const nuevos = productosMapeados.filter((item) => !ids.has(item.id));
          return [...prev, ...nuevos];
        });
      }
    },
    []
  );

  const cargarProductosPerfilExterno = useCallback(
    async (token: string, vendedorId: number, pageToLoad: number, reset = false) => {
      const response = await fetch(
        `${API_BASE_URL}/vendedores/${vendedorId}?page=${pageToLoad}&per_page=${PAGE_SIZE}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "No se pudo cargar el perfil del vendedor.");
      }

      const dataVendedor = data?.data ?? data;
      const perfilMapeado = mapearPerfil(dataVendedor);
      setPerfil(perfilMapeado);

      const productosCrudos = Array.isArray(dataVendedor?.productos?.data)
        ? dataVendedor.productos.data
        : Array.isArray(dataVendedor?.productos)
        ? dataVendedor.productos
        : Array.isArray(dataVendedor?.vendedor?.productos?.data)
        ? dataVendedor.vendedor.productos.data
        : Array.isArray(dataVendedor?.vendedor?.productos)
        ? dataVendedor.vendedor.productos
        : [];

      const pagination =
        dataVendedor?.productos?.pagination ??
        dataVendedor?.productos?.meta ??
        data?.pagination ??
        null;

      if (pagination) {
        const currentPage = Number(
          pagination?.current_page ?? pagination?.currentPage ?? pageToLoad
        );
        const serverLastPage = Number(
          pagination?.last_page ?? pagination?.lastPage ?? pageToLoad
        );
        setPage(currentPage);
        setLastPage(serverLastPage);
        setHasMore(currentPage < serverLastPage);
      } else {
        setPage(1);
        setLastPage(1);
        setHasMore(false);
      }

      const productosMapeados = mapearProductos(productosCrudos);

      if (reset) {
        setProductos(productosMapeados);
      } else {
        setProductos((prev) => {
          const ids = new Set(prev.map((item) => item.id));
          const nuevos = productosMapeados.filter((item) => !ids.has(item.id));
          return [...prev, ...nuevos];
        });
      }
    },
    []
  );

  const cargarPerfilYProductos = useCallback(
    async (pageToLoad = 1, mode: "init" | "refresh" | "loadMore" = "init") => {
      try {
        const token = await getToken();

        if (!token) {
          Alert.alert("Sesión", "No se encontró el token del usuario.");
          return;
        }

        if (mode === "init") setLoading(true);
        if (mode === "refresh") setRefreshing(true);
        if (mode === "loadMore") setLoadingMore(true);

        const { miId, meData } = await cargarPerfilBase(token);

        if (!userIdNumber || (miId !== null && Number(userIdNumber) === Number(miId))) {
          const usuario = mapearPerfil(meData?.data ?? meData);
          setPerfil(usuario);
          await cargarProductosMiPerfil(token, pageToLoad, pageToLoad === 1);
          return;
        }

        await cargarProductosPerfilExterno(
          token,
          userIdNumber,
          pageToLoad,
          pageToLoad === 1
        );
      } catch (error: any) {
        Alert.alert("Error", error?.message || "Ocurrió un error al cargar el perfil.");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        setProductoAccionandoId(null);
      }
    },
    [cargarPerfilBase, cargarProductosMiPerfil, cargarProductosPerfilExterno, userIdNumber]
  );

  useFocusEffect(
    React.useCallback(() => {
      setPage(1);
      setLastPage(1);
      setHasMore(true);
      setProductos([]);
      cargarPerfilYProductos(1, "init");
    }, [cargarPerfilYProductos])
  );

  const onRefresh = () => {
    setPage(1);
    setLastPage(1);
    setHasMore(true);
    setRefreshing(true);
    cargarPerfilYProductos(1, "refresh");
  };

  const handleLoadMore = () => {
    if (loading || loadingMore || refreshing || !hasMore) return;
    if (page >= lastPage) return;

    cargarPerfilYProductos(page + 1, "loadMore");
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

      setPage(1);
      setLastPage(1);
      setHasMore(true);
      setProductos([]);
      cargarPerfilYProductos(1, "refresh");
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

  const renderHeader = () => (
    <>
      <View
        style={{
          marginBottom: 8,
          alignItems: "flex-start",
          paddingHorizontal: 16,
          paddingTop: 12,
        }}
      >
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

      <View style={{ paddingHorizontal: 16 }}>
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
                  icon={
                    <MaterialCommunityIcons name="account-edit" size={20} color="#fff" />
                  }
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
            ) : null}
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

        {productos.length === 0 && !loading ? (
          <Text
            style={{
              textAlign: "center",
              color: colors.textMuted,
              marginTop: 12,
              marginBottom: 12,
            }}
          >
            {esMiPerfil
              ? "Aún no has publicado productos."
              : "Este usuario aún no tiene productos publicados."}
          </Text>
        ) : null}
      </View>
    </>
  );

  if (loading && productos.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.success} />
          <Text style={{ marginTop: 12, color: colors.textMuted }}>
            Cargando perfil...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top", "bottom"]}
      >
        <FlatList
          data={productos}
          key={2}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <View className="w-1/2 p-2">
              <View style={{ position: "relative" }}>
                <CustomButton
                  variant="card"
                  isOwner={esMiPerfil}
                  source={item.imagen_url ? { uri: item.imagen_url } : undefined}
                  defaultImage={defaultProductImage}
                  price={formatearPrecio(item.precio)}
                  onPress={() =>
                    router.push({
                      pathname: "/product/[id]",
                      params: { id: String(item.id) },
                    })
                  }
                  onCartPress={() =>
                    router.push({
                      pathname: "/product/[id]",
                      params: { id: String(item.id), modal: "true" },
                    })
                  }
                >
                  {item.nombre}
                </CustomButton>

                {esMiPerfil && (
                  <Pressable
                    onPress={() => abrirMenuProducto(item)}
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
                    {productoAccionandoId === item.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
                    )}
                  </Pressable>
                )}
              </View>
            </View>
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 24 + insets.bottom,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onMomentumScrollBegin={() => {
            onEndReachedCalledDuringMomentum.current = false;
          }}
          onEndReached={() => {
            if (!onEndReachedCalledDuringMomentum.current) {
              handleLoadMore();
              onEndReachedCalledDuringMomentum.current = true;
            }
          }}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color={colors.success} />
                <Text style={{ marginTop: 8, color: colors.textMuted }}>
                  Cargando más productos...
                </Text>
              </View>
            ) : !hasMore && productos.length > 0 ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <Text style={{ color: colors.textMuted }}>
                  Ya no hay más productos para mostrar.
                </Text>
              </View>
            ) : (
              <View style={{ height: 12 }} />
            )
          }
        />
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