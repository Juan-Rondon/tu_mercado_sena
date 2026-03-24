import CustomButton from "@/components/buttons/CustomButton";
import { getToken } from "@/src/lib/authToken";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const API_BASE_URL = "https://tumercadosena.shop/api/api";
const defaultProductImage = require("../../assets/images/imagedefault.png");
const defaultUserImage = require("../../assets/images/default_user.png");

type ApiFoto = {
  id: number;
  url: string;
};

type ApiVendedor = {
  id?: number;
  nickname?: string | null;
  nombre?: string | null;
  imagen?: string | null;
  imagen_url?: string | null;
};

type ApiProducto = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  vendedor_id?: number;
  vendedor?: ApiVendedor;
  fotos?: ApiFoto[];
  imagen?: string | null;
  imagen_url?: string | null;
};

type RelatedItem = {
  id: string;
  title: string;
  price: string;
  imageSource?: ImageSourcePropType;
};

type FavoriteApiItem = {
  id: number;
  votante_id: number;
  usuario_votado?: {
    id: number;
    nickname?: string | null;
    imagen?: string | null;
  };
};

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useAppTheme();

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const modalScrollRef = useRef<ScrollView>(null);

  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [openingChat, setOpeningChat] = useState(false);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const imageHeight = Math.max(220, Math.min(320, width * 0.75));
  const cardWidth = Math.max(180, Math.min(220, width * 0.55));
  const visibleRelatedProducts = relatedProducts.slice(0, 3);

  useEffect(() => {
    if (id) {
      fetchProductAndSuggestions();
    }
  }, [id]);

  useEffect(() => {
    if (viewerVisible && modalScrollRef.current && product?.images?.length) {
      setTimeout(() => {
        modalScrollRef.current?.scrollTo({
          x: width * selectedIndex,
          animated: false,
        });
      }, 50);
    }
  }, [viewerVisible, selectedIndex, width, product]);

  const formatCOP = (n: number) =>
    n.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
    });

  const normalizarUrlImagen = (url?: string | null) => {
    if (!url) return null;

    const limpio = String(url).trim();
    if (!limpio) return null;

    if (limpio.startsWith("http://") || limpio.startsWith("https://")) {
      return limpio;
    }

    const apiHost = API_BASE_URL.replace(/\/api$/, "");

    if (limpio.startsWith("usuarios/")) {
      return `${apiHost}/storage/${limpio}`;
    }

    if (limpio.startsWith("/storage/")) {
      return `${apiHost}${limpio}`;
    }

    if (limpio.startsWith("storage/")) {
      return `${apiHost}/${limpio}`;
    }

    if (limpio.startsWith("/")) {
      return `${apiHost}${limpio}`;
    }

    return `${apiHost}/${limpio}`;
  };

  const mapProductosAItems = (productos: ApiProducto[]): RelatedItem[] => {
    return productos.map((p) => {
      let imageUrl: string | null = null;

      if (Array.isArray(p.fotos) && p.fotos.length > 0) {
        imageUrl = normalizarUrlImagen(p.fotos[0].url);
      } else {
        imageUrl = normalizarUrlImagen(p.imagen_url || p.imagen || null);
      }

      const imageSource: ImageSourcePropType | undefined = imageUrl
        ? { uri: imageUrl }
        : undefined;

      return {
        id: String(p.id),
        title: p.nombre,
        price: formatCOP(Number(p.precio || 0)),
        imageSource,
      };
    });
  };

  const obtenerListaFavoritos = (payload: any): FavoriteApiItem[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.favoritos)) return payload.favoritos;
    if (Array.isArray(payload?.data?.favoritos)) return payload.data.favoritos;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const extraerIdsFavoritos = (payload: any): number[] => {
    const lista = obtenerListaFavoritos(payload);

    return lista
      .map((item: any) =>
        Number(
          item?.usuario_votado?.id ??
            item?.votado_id ??
            item?.usuario?.id ??
            item?.usuario_id ??
            0
        )
      )
      .filter((n: number) => Number.isFinite(n) && n > 0);
  };

  const consultarEstadoFavorito = async (
    token: string,
    sellerId: number | null,
    isOwner: boolean
  ) => {
    if (!token || !sellerId || isOwner) {
      setIsFavorite(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/favoritos`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json().catch(() => null);

      console.log("GET FAVORITOS STATUS:", response.status);
      console.log("GET FAVORITOS JSON:", json);

      if (!response.ok) {
        setIsFavorite(false);
        return;
      }

      const favoritosIds = extraerIdsFavoritos(json);
      setIsFavorite(favoritosIds.includes(Number(sellerId)));
    } catch (error) {
      console.log("ERROR CONSULTANDO FAVORITOS:", error);
      setIsFavorite(false);
    }
  };

  const fetchProductAndSuggestions = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      if (!token) {
        setLoading(false);
        setProduct(null);
        return;
      }

      const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const meJson = await meResponse.json().catch(() => null);
      console.log("AUTH ME STATUS:", meResponse.status);
      console.log("AUTH ME JSON:", meJson);

      const miId = Number(meJson?.data?.id ?? meJson?.id ?? 0) || null;
      setMyUserId(miId);

      const productResponse = await fetch(`${API_BASE_URL}/productos/${id}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const productJson = await productResponse.json().catch(() => null);

      console.log("RESPUESTA API PRODUCTO:", productJson);

      if (!productResponse.ok) {
        setLoading(false);
        return;
      }

      const p: ApiProducto = productJson?.data;

      const images =
        Array.isArray(p?.fotos) && p.fotos.length > 0
          ? p.fotos
              .map((foto) => {
                const uri = normalizarUrlImagen(foto?.url);
                return uri ? { uri } : null;
              })
              .filter(Boolean) as { uri: string }[]
          : normalizarUrlImagen(p?.imagen_url || p?.imagen || null)
          ? [{ uri: normalizarUrlImagen(p?.imagen_url || p?.imagen || null)! }]
          : [];

      const sellerImageUrl = normalizarUrlImagen(
        p?.vendedor?.imagen_url || p?.vendedor?.imagen || null
      );

      const sellerId = p?.vendedor?.id ?? p?.vendedor_id ?? null;

      const isOwner =
        sellerId !== null &&
        miId !== null &&
        Number(sellerId) === Number(miId);

      setProduct({
        id: p.id,
        name: p.nombre,
        description: p.descripcion ?? "",
        price: formatCOP(Number(p.precio || 0)),
        seller: p.vendedor?.nickname ?? p.vendedor?.nombre ?? "Usuario",
        sellerId: sellerId ? Number(sellerId) : null,
        sellerImage: sellerImageUrl ? { uri: sellerImageUrl } : defaultUserImage,
        images,
        isOwner,
      });

      await consultarEstadoFavorito(
        token,
        sellerId ? Number(sellerId) : null,
        isOwner
      );

      const relatedResponse = await fetch(`${API_BASE_URL}/productos`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const relatedJson = await relatedResponse.json().catch(() => null);

      console.log("RESPUESTA API RELACIONADOS:", relatedJson);

      if (!relatedResponse.ok) {
        setRelatedProducts([]);
        setLoading(false);
        return;
      }

      const lista: ApiProducto[] = Array.isArray(relatedJson)
        ? relatedJson
        : Array.isArray(relatedJson?.data)
        ? relatedJson.data
        : [];

      const sellerIdActual = p.vendedor?.id ?? p.vendedor_id ?? null;

      const otrosUsuarios = lista.filter((item) => {
        const mismoProducto = Number(item.id) === Number(p.id);
        const sellerIdItem = item.vendedor?.id ?? item.vendedor_id ?? null;
        const mismoVendedor =
          sellerIdActual !== null &&
          sellerIdItem !== null &&
          Number(sellerIdItem) === Number(sellerIdActual);

        return !mismoProducto && !mismoVendedor;
      });

      setRelatedProducts(mapProductosAItems(otrosUsuarios.slice(0, 10)));
    } catch (error) {
      console.log("ERROR:", error);
      setRelatedProducts([]);
      setIsFavorite(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorito = async () => {
    try {
      if (favoriteLoading) return;

      if (!product?.sellerId) {
        Alert.alert(
          "No fue posible actualizar favoritos",
          "No se encontró el vendedor."
        );
        return;
      }

      if (!myUserId) {
        Alert.alert(
          "No fue posible actualizar favoritos",
          "No se pudo identificar tu usuario."
        );
        return;
      }

      if (product?.isOwner) {
        return;
      }

      setFavoriteLoading(true);

      const token = await getToken();

      if (!token) {
        Alert.alert(
          "No fue posible actualizar favoritos",
          "No se encontró la sesión del usuario."
        );
        return;
      }

      if (isFavorite) {
        const response = await fetch(
          `${API_BASE_URL}/favoritos/${Number(product.sellerId)}`,
          {
            method: "DELETE",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const json = await response.json().catch(() => null);

        console.log("DELETE FAVORITO STATUS:", response.status);
        console.log("DELETE FAVORITO JSON:", json);

        if (!response.ok) {
          const msg =
            json?.message ||
            json?.error ||
            "No fue posible eliminar el usuario de favoritos.";
          Alert.alert("Error", msg);
          return;
        }

        setIsFavorite(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/favoritos/${Number(product.sellerId)}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            votante_id: Number(myUserId),
            votado_id: Number(product.sellerId),
          }),
        }
      );

      const json = await response.json().catch(() => null);

      console.log("POST FAVORITO STATUS:", response.status);
      console.log("POST FAVORITO JSON:", json);

      if (!response.ok) {
        const msg =
          json?.message ||
          json?.error ||
          "No fue posible agregar el usuario a favoritos.";
        Alert.alert("Error", msg);
        return;
      }

      setIsFavorite(true);
    } catch (error) {
      console.log("ERROR TOGGLE FAVORITO:", error);
      Alert.alert(
        "Error",
        "Ocurrió un error inesperado al actualizar favoritos."
      );
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleModalScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(offsetX / width);
    setSelectedIndex(currentIndex);
  };

  const irAlPerfilVendedor = () => {
    if (!product?.sellerId) return;

    router.push({
      pathname: "/profile",
      params: { userId: String(product.sellerId) },
    });
  };

  const irAEditarProducto = () => {
    if (!product?.id) return;

    router.push({
      pathname: "/Vender" as any,
      params: {
        edit: "true",
        productId: String(product.id),
      },
    });
  };

  const irAlHome = () => {
    router.push("/(tabs)/Home" as any);
  };

  const irAChatConVendedor = async () => {
    try {
      if (openingChat) return;

      console.log("CLICK CHAT");
      console.log("product?.sellerId:", product?.sellerId);
      console.log("product?.id:", product?.id);
      console.log("myUserId:", myUserId);

      if (!product?.sellerId || !product?.id) {
        Alert.alert(
          "No fue posible abrir el chat",
          "Falta información del producto o del vendedor."
        );
        return;
      }

      if (!myUserId) {
        Alert.alert(
          "No fue posible abrir el chat",
          "No se pudo identificar tu usuario."
        );
        return;
      }

      if (Number(product.sellerId) === Number(myUserId)) {
        Alert.alert(
          "Chat no disponible",
          "No puedes iniciar un chat contigo mismo."
        );
        return;
      }

      setOpeningChat(true);

      const token = await getToken();
      if (!token) {
        Alert.alert(
          "No fue posible abrir el chat",
          "No se encontró la sesión del usuario."
        );
        return;
      }

      let chatId: number | null = null;

      const chatsResponse = await fetch(`${API_BASE_URL}/chats`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const chatsJson = await chatsResponse.json().catch(() => null);

      console.log("CHATS STATUS:", chatsResponse.status);
      console.log("CHATS JSON:", chatsJson);

      if (chatsResponse.ok) {
        const listaChats = Array.isArray(chatsJson)
          ? chatsJson
          : Array.isArray(chatsJson?.data)
          ? chatsJson.data
          : [];

        const chatExistente = listaChats.find((chat: any) => {
          const usuarioId = Number(chat?.usuario?.id ?? 0);
          return usuarioId === Number(product.sellerId);
        });

        console.log("CHAT EXISTENTE:", chatExistente);

        if (chatExistente?.id) {
          chatId = Number(chatExistente.id);
        }
      }

      if (!chatId) {
        const createResponse = await fetch(
          `${API_BASE_URL}/productos/${Number(product.id)}/chats`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const createJson = await createResponse.json().catch(() => null);

        console.log("CREATE STATUS:", createResponse.status);
        console.log("CREATE JSON:", createJson);

        if (!createResponse.ok) {
          const msg =
            createJson?.message ||
            createJson?.error ||
            "No fue posible iniciar el chat con el vendedor.";
          Alert.alert("No fue posible abrir el chat", msg);
          return;
        }

        chatId = Number(createJson?.data?.id ?? createJson?.id ?? 0) || null;
      }

      console.log("CHAT ID FINAL:", chatId);

      if (!chatId) {
        Alert.alert(
          "No fue posible abrir el chat",
          "No se pudo obtener el identificador del chat."
        );
        return;
      }

      router.push({
        pathname: "/chatUser/[id]",
        params: {
          id: String(chatId),
          otherUserId: String(product.sellerId),
          otherUserName: String(product.seller ?? "Vendedor"),
          otherUserImage:
            typeof product?.sellerImage?.uri === "string"
              ? product.sellerImage.uri
              : "",
        },
      });
    } catch (error) {
      console.log("ERROR ABRIENDO CHAT CON VENDEDOR:", error);
      Alert.alert(
        "No fue posible abrir el chat",
        "Ocurrió un error inesperado."
      );
    } finally {
      setOpeningChat(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ marginTop: 10, color: colors.textMuted }}>
            Cargando producto...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.text }}>No se pudo cargar el producto</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 24 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 12, alignItems: "flex-start" }}>
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

        {Array.isArray(product.images) && product.images.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {product.images.map((img: any, index: number) => (
              <Pressable
                key={index}
                onPress={() => {
                  setSelectedIndex(index);
                  setViewerVisible(true);
                }}
              >
                <Image
                  source={img}
                  style={{
                    width: width * 0.85,
                    height: imageHeight,
                    borderRadius: 16,
                    marginRight: 12,
                    backgroundColor: colors.surface,
                  }}
                  resizeMode="cover"
                />
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={{ paddingTop: 16 }}>
          <Text
            style={{ color: colors.text }}
            className="text-2xl font-bold mb-2"
          >
            {product.name}
          </Text>

          <Text style={{ color: colors.textMuted }} className="text-xl">
            {product.price}
          </Text>

          <Text
            style={{ color: colors.text }}
            className="mt-4 text-lg font-semibold"
          >
            Descripción del producto
          </Text>

          <Text
            style={{ color: colors.textMuted }}
            className="mt-1 text-base"
          >
            {product.description?.trim()
              ? product.description
              : "Este producto no tiene descripción."}
          </Text>

          <Text style={{ color: colors.textMuted }} className="mt-5">
            Vendido por:
          </Text>

          <View
            style={{
              marginTop: 10,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <Pressable
              onPress={irAlPerfilVendedor}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Image
                source={product.sellerImage}
                defaultSource={defaultUserImage}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.surface,
                }}
                resizeMode="cover"
              />

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {product.seller}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textMuted,
                    marginTop: 2,
                  }}
                >
                  Ver perfil del vendedor
                </Text>
              </View>
            </Pressable>

            {!product.isOwner && (
              <Pressable
                onPress={toggleFavorito}
                disabled={favoriteLoading}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  justifyContent: "center",
                  alignItems: "center",
                  marginLeft: 10,
                  backgroundColor: isFavorite
                    ? "rgba(255, 59, 48, 0.12)"
                    : colors.surface,
                  opacity: favoriteLoading ? 0.7 : 1,
                }}
              >
                {favoriteLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name={isFavorite ? "heart" : "heart-outline"}
                    size={22}
                    color={isFavorite ? "#FF3B30" : colors.textMuted}
                  />
                )}
              </Pressable>
            )}

            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
              style={{ marginLeft: 8 }}
            />
          </View>

          {product.isOwner ? (
            <Pressable
              style={{
                marginTop: 18,
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: 14,
              }}
              onPress={irAEditarProducto}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: "600",
                }}
              >
                Editar producto
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={{
                marginTop: 18,
                backgroundColor: openingChat ? colors.textMuted : colors.success,
                paddingVertical: 14,
                borderRadius: 14,
                opacity: openingChat ? 0.85 : 1,
              }}
              onPress={irAChatConVendedor}
              disabled={openingChat}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: "600",
                }}
              >
                {openingChat ? "Abriendo chat..." : "Chatear con el vendedor"}
              </Text>
            </Pressable>
          )}
        </View>

        <Text
          style={{ color: colors.text }}
          className="text-xl font-bold mb-3 mt-8"
        >
          Productos que quizás te interesen
        </Text>

        {relatedProducts.length === 0 ? (
          <Text style={{ color: colors.textMuted }}>
            No hay productos de otros usuarios para mostrar.
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 8 }}
          >
            <View style={{ flexDirection: "row" }}>
              {visibleRelatedProducts.map((item) => (
                <View key={item.id} style={{ width: cardWidth, marginRight: 12 }}>
                  <CustomButton
                    variant="card"
                    isOwner={false}
                    source={item.imageSource}
                    defaultImage={defaultProductImage}
                    price={item.price}
                    onPress={() =>
                      router.push({
                        pathname: "/product/[id]",
                        params: { id: item.id },
                      })
                    }
                    onCartPress={() =>
                      router.push({
                        pathname: "/product/[id]",
                        params: { id: item.id, modal: "true" },
                      })
                    }
                  >
                    {item.title}
                  </CustomButton>
                </View>
              ))}

              <Pressable
                onPress={irAlHome}
                style={{
                  width: cardWidth,
                  marginRight: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  minHeight: 205,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 20,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.surface,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name="grid-outline" size={26} color={colors.primary} />
                </View>

                <Text
                  style={{
                    color: colors.text,
                    fontSize: 17,
                    fontWeight: "700",
                    textAlign: "center",
                    marginBottom: 6,
                  }}
                >
                  Ver más...
                </Text>

                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: 14,
                    textAlign: "center",
                  }}
                >
                  Ir al inicio para ver más productos
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        )}
      </ScrollView>

      <Modal
        visible={viewerVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <Pressable
            onPress={() => setViewerVisible(false)}
            style={{
              position: "absolute",
              top: insets.top + 12,
              right: 16,
              zIndex: 20,
              backgroundColor: "rgba(255,255,255,0.15)",
              width: 42,
              height: 42,
              borderRadius: 21,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>

          <Text
            style={{
              position: "absolute",
              top: insets.top + 20,
              left: 16,
              zIndex: 20,
              color: "#fff",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            {selectedIndex + 1} / {product.images.length}
          </Text>

          <ScrollView
            ref={modalScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleModalScroll}
            contentContainerStyle={{ alignItems: "center" }}
          >
            {product.images.map((img: any, index: number) => (
              <View
                key={index}
                style={{
                  width: width,
                  height: height,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Image
                  source={img}
                  style={{
                    width: width,
                    height: height * 0.8,
                  }}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}