import CustomButton from "@/components/buttons/CustomButton";
import SearchBar from "@/components/inputs/SearchBar";
import { getToken } from "@/src/lib/authToken";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

const API_BASE_URL = "http://192.168.1.11:8000";

type ApiProduct = {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  disponibles?: number;
  fotos?: {
    id: number;
    url: string;
  }[];
};

type Item = {
  id: string;
  title: string;
  price: string;
  imageSource: any;
};

const formatCOP = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "COP" });

const HomeScreen = () => {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { width } = useWindowDimensions();

  const numColumns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;

  const LIST_PADDING = 16;
  const ITEM_PADDING = 8;
  const GAP = 8;

  const itemWidth =
    (width -
      LIST_PADDING * 0 -
      GAP * (numColumns - 1) -
      ITEM_PADDING * 2 * numColumns) /
    numColumns;

  const [rawProducts, setRawProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProducts = async (mode: "init" | "refresh" = "init") => {
    try {
      if (mode === "init") setLoading(true);
      if (mode === "refresh") setRefreshing(true);

      setErrorMsg(null);

      const token = await getToken();
      if (!token) {
        Alert.alert("Sesión requerida", "Debes iniciar sesión.");
        router.replace("/(stack)/login");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/productos`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMsg(json?.message || `Error ${res.status}`);
        return;
      }

      const list: ApiProduct[] = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
        ? json.data
        : [];

      setRawProducts(list);
    } catch (e) {
      setErrorMsg("No fue posible conectar con el servidor.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts("init");
  }, []);

  const onRefresh = () => fetchProducts("refresh");

const data: Item[] = useMemo(() => {
  const q = search.trim().toLowerCase();

  const filtered = q
    ? rawProducts.filter((p) => {
        const nombre = (p.nombre ?? "").toLowerCase();
        const desc = (p.descripcion ?? "").toLowerCase();
        return nombre.includes(q) || desc.includes(q);
      })
    : rawProducts;

  return filtered.map((p) => {
    console.log("PRODUCTO:", p);
    console.log("FOTOS:", p.fotos);

    let imageUrl: string | null = null;

    // 🔥 AQUÍ ESTA LA CLAVE
    if (Array.isArray(p.fotos) && p.fotos.length > 0) {
      imageUrl = p.fotos[0].url;
    }

    const imageSource = imageUrl ? { uri: imageUrl } : null;

    return {
      id: String(p.id),
      title: p.nombre,
      price: formatCOP(p.precio),
      imageSource,
    };
  });
}, [rawProducts, search]);

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={{ padding: 24, alignItems: "center" }}>
        <Text style={{ color: "#6B7280", textAlign: "center" }}>
          {errorMsg
            ? errorMsg
            : search.trim()
            ? "No se encontraron productos para tu búsqueda."
            : "Aún no hay productos cargados."}
        </Text>

        {errorMsg ? (
          <Text
            style={{ marginTop: 12, color: "#2563EB", fontWeight: "600" }}
            onPress={() => fetchProducts("init")}
          >
            Reintentar
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center p-4">
        <View style={{ flex: 1 }}>
          <SearchBar value={search} onChangeText={setSearch} noOuterPadding />
        </View>
      </View>

      {loading && data.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10, color: "#6B7280" }}>
            Cargando productos...
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          key={numColumns}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: LIST_PADDING, paddingBottom: 120 }}
          columnWrapperStyle={
            numColumns > 1
              ? { gap: GAP, justifyContent: "space-between" }
              : undefined
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmpty}
          renderItem={({ item }) => (
            <View style={{ width: itemWidth, padding: ITEM_PADDING }}>
              <CustomButton
                variant="card"
                isOwner={false}
                source={item.imageSource}
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
          )}
        />
      )}
    </View>
  );
};

export default HomeScreen;