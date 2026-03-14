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
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const API_BASE_URL = "https://omwekiatl.xyz";

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const modalScrollRef = useRef<ScrollView>(null);

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const imageHeight = Math.max(220, Math.min(320, width * 0.75));
  const cardWidth = Math.max(180, Math.min(220, width * 0.55));

  console.log("ID QUE LLEGA:", id);

  useEffect(() => {
    if (id) {
      fetchProduct();
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

  const fetchProduct = async () => {
    try {
      const token = await getToken();

      console.log("ID:", id);
      console.log("URL:", `${API_BASE_URL}/api/productos/${id}`);

      const response = await fetch(`${API_BASE_URL}/api/productos/${id}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();

      console.log("RESPUESTA API:", json);

      if (!response.ok) {
        console.log("ERROR BACKEND:", json);
        setLoading(false);
        return;
      }

      const p = json.data;

      setProduct({
        id: p.id,
        name: p.nombre,
        price: p.precio.toLocaleString("es-CO", {
          style: "currency",
          currency: "COP",
        }),
        seller: p.vendedor?.nickname ?? "Usuario",
        images: Array.isArray(p.fotos)
          ? p.fotos.map((foto: any) => ({
              uri: foto.url,
            }))
          : [],
      });

      setLoading(false);
    } catch (error) {
      console.log("ERROR:", error);
      setLoading(false);
    }
  };

  const handleModalScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(offsetX / width);
    setSelectedIndex(currentIndex);
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

          <Text className="mt-4 text-gray-600">Vendido por:</Text>

          <Text className="text-lg font-medium">{product.seller}</Text>

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
        </View>

        <Text className="text-xl font-bold mb-3" style={{ marginTop: 24 }}>
          Productos que quizás te interesen
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 8 }}
        >
          <View style={{ flexDirection: "row" }}>
            {[1, 2, 3].map((k) => (
              <View key={k} style={{ width: cardWidth, marginRight: 12 }}>
                <CustomButton
                  variant="card"
                  price="$0"
                  onPress={() => router.push("/(tabs)/Home")}
                >
                  Producto
                </CustomButton>
              </View>
            ))}
          </View>
        </ScrollView>
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