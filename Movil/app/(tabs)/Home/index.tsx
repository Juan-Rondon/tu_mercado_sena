import CustomButton from "@/components/buttons/CustomButton";
import SearchBar from "@/components/inputs/SearchBar";
import { getToken } from "@/src/lib/authToken";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType
} from "react-native";

const API_BASE_URL = "https://tumercadosena.shop/api/api";
const defaultUserImage = require("../../../assets/images/default_user.png");

type ApiProduct = {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  disponibles?: number;
  categoria_id?: number;
  categoria?: {
    id: number;
    nombre: string;
  };
  fotos?: {
    id: number;
    url: string;
  }[];
};

type PerfilResponse = {
  id: number;
  nombre?: string | null;
  nickname?: string | null;
  imagen?: string | null;
};

type Item = {
  id: string;
  title: string;
  price: string;
  imageSource?: ImageSourcePropType;
};

const formatCOP = (n: number) =>
  n.toLocaleString("es-CO", { style: "currency", currency: "COP" });

const limpiarNumero = (valor: string) => valor.replace(/\D/g, "");

const normalizarUrlImagen = (url?: string | null) => {
  if (!url) return null;

  const limpio = url.trim();
  if (!limpio) return null;

  if (limpio.startsWith("http://") || limpio.startsWith("https://")) {
    return limpio;
  }

  if (limpio.startsWith("/storage/") || limpio.startsWith("storage/")) {
    return `https://tumercadosena.shop/api${limpio.replace(/^\/+/, "")}`;
  }

  return limpio;
};

const mapProductosAItems = (productos: ApiProduct[]): Item[] => {
  return productos.map((p) => {
    let imageUrl: string | null = null;

    if (Array.isArray(p.fotos) && p.fotos.length > 0) {
      imageUrl = normalizarUrlImagen(p.fotos[0].url);
    }

    const imageSource: ImageSourcePropType | undefined = imageUrl
  ? { uri: imageUrl }
  : undefined;

    return {
      id: String(p.id),
      title: p.nombre,
      price: formatCOP(Number(p.precio)),
      imageSource,
    };
  });
};

const HomeScreen = () => {
  const [search, setSearch] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [ordenPrecio, setOrdenPrecio] = useState<"asc" | "desc" | "">("");

  const [rawProducts, setRawProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [userImage, setUserImage] = useState<string | null>(null);

  const router = useRouter();
  const { width } = useWindowDimensions();

  const numColumns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;

  const LIST_PADDING = 16;
  const ITEM_PADDING = 8;
  const GAP = 8;

  const itemWidth =
    (width - GAP * (numColumns - 1) - ITEM_PADDING * 2 * numColumns) /
    numColumns;

  const fetchPerfil = async () => {
    try {
      const token = await getToken();

      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) return;

      const perfil: PerfilResponse = {
        id: json?.data?.id ?? json?.id,
        nombre: json?.data?.nombre ?? json?.nombre ?? "",
        nickname: json?.data?.nickname ?? json?.nickname ?? "",
        imagen: json?.data?.imagen ?? json?.imagen ?? null,
      };

      setUserImage(normalizarUrlImagen(perfil.imagen));
    } catch (error) {
      console.log("No se pudo cargar el perfil en home");
    }
  };

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

      const res = await fetch(`${API_BASE_URL}/productos`, {
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
    fetchPerfil();
  }, []);

  const onRefresh = () => {
    fetchProducts("refresh");
    fetchPerfil();
  };

  const limpiarFiltros = () => {
    setSearch("");
    setPrecioMin("");
    setPrecioMax("");
    setCategoriaSeleccionada("");
    setOrdenPrecio("");
  };

  const categoriasDisponibles = useMemo(() => {
    const mapa = new Map<string, string>();

    rawProducts.forEach((p) => {
      const nombreCategoria = p.categoria?.nombre?.trim();
      if (nombreCategoria) {
        mapa.set(nombreCategoria, nombreCategoria);
      }
    });

    return Array.from(mapa.values()).sort((a, b) => a.localeCompare(b));
  }, [rawProducts]);

  const data: Item[] = useMemo(() => {
    let productos = [...rawProducts];

    const q = search.trim().toLowerCase();
    const min = Number(limpiarNumero(precioMin) || 0);
    const max = Number(limpiarNumero(precioMax) || 0);

    if (q) {
      productos = productos.filter((p) => {
        const nombre = (p.nombre ?? "").toLowerCase();
        const desc = (p.descripcion ?? "").toLowerCase();
        const categoria = (p.categoria?.nombre ?? "").toLowerCase();

        return (
          nombre.includes(q) ||
          desc.includes(q) ||
          categoria.includes(q)
        );
      });
    }

    if (min > 0) {
      productos = productos.filter((p) => Number(p.precio) >= min);
    }

    if (max > 0) {
      productos = productos.filter((p) => Number(p.precio) <= max);
    }

    if (categoriaSeleccionada.trim()) {
      productos = productos.filter(
        (p) =>
          (p.categoria?.nombre ?? "").toLowerCase() ===
          categoriaSeleccionada.toLowerCase()
      );
    }

    if (ordenPrecio === "asc") {
      productos.sort((a, b) => Number(a.precio) - Number(b.precio));
    }

    if (ordenPrecio === "desc") {
      productos.sort((a, b) => Number(b.precio) - Number(a.precio));
    }

    return mapProductosAItems(productos);
  }, [
    rawProducts,
    search,
    precioMin,
    precioMax,
    categoriaSeleccionada,
    ordenPrecio,
  ]);

  const hayFiltros =
    search.trim() ||
    precioMin.trim() ||
    precioMax.trim() ||
    categoriaSeleccionada.trim() ||
    ordenPrecio;

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={{ padding: 24, alignItems: "center" }}>
        <Text style={{ color: "#6B7280", textAlign: "center" }}>
          {errorMsg
            ? errorMsg
            : hayFiltros
            ? "No se encontraron productos con esos filtros."
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
      <FlatList
        data={data}
        key={numColumns}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        columnWrapperStyle={
          numColumns > 1
            ? {
                gap: GAP,
                justifyContent: "space-between",
                paddingHorizontal: LIST_PADDING,
              }
            : undefined
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 8 }}>
            <View style={styles.searchRow}>
              <View style={{ flex: 1 }}>
                <SearchBar
                  value={search}
                  onChangeText={setSearch}
                  noOuterPadding
                  placeholder="Buscar productos..."
                />
              </View>

              <Pressable
                onPress={() => router.push("/profile")}
                style={styles.avatarButton}
              >
                <Image
                  source={userImage ? { uri: userImage } : defaultUserImage}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              </Pressable>
            </View>

            <View style={styles.filtersBox}>
              <Text style={styles.filtersTitle}>Filtros</Text>

              <View style={styles.priceRow}>
                <View style={{ flex: 1 }}>
                  <SearchBar
                    value={precioMin}
                    onChangeText={(text) => setPrecioMin(limpiarNumero(text))}
                    noOuterPadding
                    placeholder="Precio mínimo"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <SearchBar
                    value={precioMax}
                    onChangeText={(text) => setPrecioMax(limpiarNumero(text))}
                    noOuterPadding
                    placeholder="Precio máximo"
                  />
                </View>
              </View>

              {categoriasDisponibles.length > 0 ? (
                <View style={{ marginBottom: 10 }}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    <CustomButton
                      variant="contained"
                      className={`rounded-full px-4 py-2 ${
                        categoriaSeleccionada === "" ? "bg-sextary-600" : "bg-gray-200"
                      }`}
                      onPress={() => setCategoriaSeleccionada("")}
                    >
                      <Text
                        className={`text-center ${
                          categoriaSeleccionada === "" ? "text-white" : "text-black"
                        }`}
                      >
                        Todas
                      </Text>
                    </CustomButton>

                    {categoriasDisponibles.map((categoria) => {
                      const activa = categoriaSeleccionada === categoria;

                      return (
                        <CustomButton
                          key={categoria}
                          variant="contained"
                          className={`rounded-full px-4 py-2 ${
                            activa ? "bg-sextary-600" : "bg-gray-200"
                          }`}
                          onPress={() => setCategoriaSeleccionada(categoria)}
                        >
                          <Text
                            className={`text-center ${
                              activa ? "text-white" : "text-black"
                            }`}
                          >
                            {categoria}
                          </Text>
                        </CustomButton>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                <CustomButton
                  variant="contained"
                  className={`rounded-full px-4 py-2 ${
                    ordenPrecio === "asc" ? "bg-sextary-600" : "bg-gray-200"
                  }`}
                  onPress={() =>
                    setOrdenPrecio((prev) => (prev === "asc" ? "" : "asc"))
                  }
                >
                  <Text
                    className={`text-center ${
                      ordenPrecio === "asc" ? "text-white" : "text-black"
                    }`}
                  >
                    Precio ↑
                  </Text>
                </CustomButton>

                <CustomButton
                  variant="contained"
                  className={`rounded-full px-4 py-2 ${
                    ordenPrecio === "desc" ? "bg-sextary-600" : "bg-gray-200"
                  }`}
                  onPress={() =>
                    setOrdenPrecio((prev) => (prev === "desc" ? "" : "desc"))
                  }
                >
                  <Text
                    className={`text-center ${
                      ordenPrecio === "desc" ? "text-white" : "text-black"
                    }`}
                  >
                    Precio ↓
                  </Text>
                </CustomButton>

                <CustomButton
                  variant="contained"
                  className="rounded-full px-4 py-2 bg-red-500"
                  onPress={limpiarFiltros}
                >
                  <Text className="text-white text-center">Limpiar</Text>
                </CustomButton>
              </ScrollView>
            </View>
          </View>
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
        ListFooterComponent={
          loading && data.length === 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator />
              <Text style={{ marginTop: 10, color: "#6B7280" }}>
                Cargando productos...
              </Text>
            </View>
          ) : (
            <View style={{ height: 20 }} />
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  avatarButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  filtersBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  filtersTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  resultsText: {
    color: "#6B7280",
    fontSize: 13,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 50,
  },
});

export default HomeScreen;