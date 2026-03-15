import CustomButton from "@/components/buttons/CustomButton";
import { getToken } from "@/src/lib/authToken";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

const API_BASE_URL = "https://tumercadosena.shop";
const defaultProductImage = require("../../assets/images/imagedefault.png");
const defaultUserImage = require("../../assets/images/default_user.png");

type ApiFoto = {
  id: number;
  url: string;
};

type ApiVendedor = {
  id?: number;
  nickname?: string | null;
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

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const modalScrollRef = useRef<ScrollView>(null);

  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<number | null>(null);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const imageHeight = Math.max(220, Math.min(320, width * 0.75));
  const cardWidth = Math.max(180, Math.min(220, width * 0.55));

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

    if (limpio.startsWith("usuarios/")) {
      return `${API_BASE_URL}/storage/${limpio}`;
    }

    if (limpio.startsWith("/storage/") || limpio.startsWith("storage/")) {
      return `${API_BASE_URL}/${limpio.replace(/^\/+/, "")}`;
    }

    if (limpio.startsWith("/")) {
      return `${API_BASE_URL}${limpio}`;
    }

    return limpio;
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

  const fetchProductAndSuggestions = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const meJson = await meResponse.json().catch(() => null);

      if (meResponse.ok) {
        const miId = meJson?.data?.id ?? meJson?.id ?? null;
        setMyUserId(miId);
      }

      const productResponse = await fetch(`${API_BASE_URL}/api/productos/${id}`, {
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
              .filter(Boolean)
          : [];

      const sellerImageUrl = normalizarUrlImagen(
        p?.vendedor?.imagen_url || p?.vendedor?.imagen || null
      );

      const sellerId = p.vendedor?.id ?? p.vendedor_id ?? null;
      const isOwner =
        sellerId !== null &&
        meJson &&
        Number(sellerId) === Number(meJson?.data?.id ?? meJson?.id ?? null);

      setProduct({
        id: p.id,
        name: p.nombre,
        description: p.descripcion ?? "",
        price: formatCOP(Number(p.precio || 0)),
        seller: p.vendedor?.nickname ?? "Usuario",
        sellerId,
        sellerImage: sellerImageUrl ? { uri: sellerImageUrl } : defaultUserImage,
        images,
        isOwner,
      });

      const relatedResponse = await fetch(`${API_BASE_URL}/api/productos`, {
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
          sellerIdActual !== null && sellerIdItem === sellerIdActual;

        return !mismoProducto && !mismoVendedor;
      });

      setRelatedProducts(mapProductosAItems(otrosUsuarios.slice(0, 10)));
    } catch (error) {
      console.log("ERROR:", error);
      setRelatedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleModalScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10 }}>Cargando producto...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No se pudo cargar el producto</Text>
      </View>
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
      >
        <View style={{ marginBottom: 12, alignItems: "flex-start" }}>
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
                    backgroundColor: "#f3f4f6",
                  }}
                  resizeMode="cover"
                />
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={{ paddingTop: 16 }}>
          <Text className="text-2xl font-bold mb-2">{product.name}</Text>

          <Text className="text-xl text-gray-700">{product.price}</Text>

          <Text className="mt-4 text-lg font-semibold text-gray-800">
            Descripción del producto
          </Text>

          <Text className="mt-1 text-base text-gray-600">
            {product.description?.trim()
              ? product.description
              : "Este producto no tiene descripción."}
          </Text>

          <Text className="mt-5 text-gray-600">Vendido por:</Text>

          <Pressable
            onPress={irAlPerfilVendedor}
            style={{
              marginTop: 10,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F9FAFB",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <Image
              source={product.sellerImage}
              defaultSource={defaultUserImage}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#E5E7EB",
              }}
              resizeMode="cover"
            />

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 17, fontWeight: "600", color: "#111827" }}>
                {product.seller}
              </Text>
              <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 2 }}>
                Ver perfil del vendedor
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>

          {product.isOwner ? (
            <Pressable
              style={{
                marginTop: 18,
                backgroundColor: "#1C65E3",
                paddingVertical: 14,
                borderRadius: 14,
              }}
              onPress={irAEditarProducto}
            >
              <Text
                style={{
                  color: "white",
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
                backgroundColor: "#16a34a",
                paddingVertical: 14,
                borderRadius: 14,
              }}
              onPress={() => router.push("/(tabs)/Chats")}
            >
              <Text
                style={{
                  color: "white",
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: "600",
                }}
              >
                Chatear con el vendedor
              </Text>
            </Pressable>
          )}
        </View>

        <Text className="text-xl font-bold mb-3" style={{ marginTop: 24 }}>
          Productos que quizás te interesen
        </Text>

        {relatedProducts.length === 0 ? (
          <Text style={{ color: "#6B7280" }}>
            No hay productos de otros usuarios para mostrar.
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 8 }}
          >
            <View style={{ flexDirection: "row" }}>
              {relatedProducts.map((item) => (
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