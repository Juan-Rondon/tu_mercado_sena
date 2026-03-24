import CustomButton from "@/components/buttons/CustomButton";
import { getToken } from "@/src/lib/authToken";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const API_BASE_URL = "https://tumercadosena.shop/api/api";
const API_HOST = "https://tumercadosena.shop";

const defaultUserImage = require("../../../assets/images/default_user.png");

const COLORS = {
  DEFAULT: "#32CD32",
  50: "#EAFAEA",
  100: "#C6F1C6",
  200: "#A1E8A1",
  300: "#7CDF7C",
  400: "#57D657",
  500: "#32CD32",
  600: "#29A829",
  700: "#208320",
  800: "#175E17",
  900: "#0E390E",
  950: "#051505",
  WHITE: "#FFFFFF",
  TEXT: "#111827",
  MUTED: "#6B7280",
  BORDER: "#E5E7EB",
  BG: "#F8FAFC",
  DANGER: "#DC2626",
  DANGER_SOFT: "#FEF2F2",
};

type FavoriteApiItem = {
  id: number;
  votante_id: number;
  usuario_votado: {
    id: number;
    nickname?: string | null;
    imagen?: string | null;
  };
};

type FavoriteUser = {
  id: number;
  nombre: string;
  nickname: string;
  imagen: string | null;
};

function normalizeImageUrl(path?: string | null): string | null {
  if (!path) return null;

  const clean = String(path).trim();
  if (!clean) return null;

  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  if (clean.startsWith("usuarios/")) {
    return `${API_HOST}/storage/${clean}`;
  }

  if (clean.startsWith("/storage/")) {
    return `${API_HOST}${clean}`;
  }

  if (clean.startsWith("storage/")) {
    return `${API_HOST}/${clean}`;
  }

  if (clean.startsWith("/")) {
    return `${API_HOST}${clean}`;
  }

  return `${API_HOST}/${clean}`;
}

function normalizeText(value?: string | null): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeFavorites(payload: any): FavoriteUser[] {
  const rawList: FavoriteApiItem[] = Array.isArray(payload?.favoritos)
    ? payload.favoritos
    : Array.isArray(payload?.data?.favoritos)
    ? payload.data.favoritos
    : Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
    ? payload
    : [];

  const normalized = rawList
    .map((item: FavoriteApiItem) => {
      const usuario = item?.usuario_votado;

      return {
        id: Number(usuario?.id ?? 0),
        nombre: usuario?.nickname?.trim() || "Usuario",
        nickname: usuario?.nickname?.trim() || "",
        imagen: normalizeImageUrl(usuario?.imagen || null),
      };
    })
    .filter((item: FavoriteUser) => !!item.id);

  const uniqueMap = new Map<number, FavoriteUser>();

  normalized.forEach((item: FavoriteUser) => {
    if (!uniqueMap.has(item.id)) {
      uniqueMap.set(item.id, item);
    }
  });

  return Array.from(uniqueMap.values());
}

const FavoritosScreen = () => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [favoritos, setFavoritos] = useState<FavoriteUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const favoritosFiltrados = useMemo(() => {
  const query = normalizeText(search);

  if (!query) return favoritos;

  return favoritos.filter((item) => {
    const nombre = normalizeText(item.nombre);
    const nickname = normalizeText(item.nickname);

    return nombre.startsWith(query) || nickname.startsWith(query);
     });
    }, [favoritos, search]);

  const fetchFavoritos = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = await getToken();

      if (!token) {
        setFavoritos([]);
        throw new Error("No se encontró la sesión del usuario.");
      }

      const response = await fetch(`${API_BASE_URL}/favoritos`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();
      let json: any = {};

      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = {};
      }

      console.log("GET FAVORITOS STATUS:", response.status);
      console.log("GET FAVORITOS JSON:", json);

      if (!response.ok) {
        throw new Error(json?.message || "No se pudieron obtener los favoritos.");
      }

      const mapped = normalizeFavorites(json);
      setFavoritos(mapped);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Ocurrió un problema al cargar los favoritos."
      );
      setFavoritos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFavoritos();
    }, [fetchFavoritos])
  );

  const handleRefresh = useCallback(() => {
    fetchFavoritos(true);
  }, [fetchFavoritos]);

  const eliminarFavorito = useCallback(async (usuarioId: number) => {
    try {
      setRemovingId(usuarioId);

      const token = await getToken();

      if (!token) {
        throw new Error("No se encontró la sesión del usuario.");
      }

      const response = await fetch(`${API_BASE_URL}/favoritos/${usuarioId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();
      let json: any = {};

      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = {};
      }

      console.log("DELETE FAVORITO STATUS:", response.status);
      console.log("DELETE FAVORITO JSON:", json);

      if (!response.ok) {
        throw new Error(json?.message || "No se pudo eliminar de favoritos.");
      }

      setFavoritos((prev) => prev.filter((item) => item.id !== usuarioId));
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "No fue posible quitar este usuario de favoritos."
      );
    } finally {
      setRemovingId(null);
    }
  }, []);

  const confirmarEliminar = useCallback(
    (usuario: FavoriteUser) => {
      Alert.alert(
        "Eliminar favorito",
        `¿Deseas quitar a ${usuario.nickname || usuario.nombre} de tus favoritos?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => eliminarFavorito(usuario.id),
          },
        ]
      );
    },
    [eliminarFavorito]
  );

  const irAlPerfil = useCallback((usuarioId: number) => {
    router.push({
      pathname: "/profile",
      params: { userId: String(usuarioId) },
    });
  }, []);

  const renderEmptyState = useMemo(() => {
    if (loading) return null;

    if (search.trim() && favoritos.length > 0 && favoritosFiltrados.length === 0) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: tabBarHeight + insets.bottom + 24,
          }}
        >
          <View
            style={{
              width: 108,
              height: 108,
              borderRadius: 54,
              backgroundColor: COLORS[100],
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Ionicons name="search-outline" size={48} color={COLORS[700]} />
          </View>

          <Text
            style={{
              fontSize: 24,
              fontWeight: "800",
              color: COLORS[900],
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            Sin resultados
          </Text>

          <Text
            style={{
              fontSize: 15,
              lineHeight: 23,
              color: COLORS.MUTED,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            No encontramos favoritos que coincidan con “{search.trim()}”.
          </Text>

          <View style={{ width: "100%" }}>
            <CustomButton
              color="sextary"
              className="rounded-l-full rounded-r-full p-4"
              onPress={() => setSearch("")}
            >
              Limpiar búsqueda
            </CustomButton>
          </View>
        </View>
      );
    }

    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: tabBarHeight + insets.bottom + 24,
        }}
      >
        <View
          style={{
            width: 108,
            height: 108,
            borderRadius: 54,
            backgroundColor: COLORS[100],
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Ionicons name="heart-outline" size={52} color={COLORS[700]} />
        </View>

        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            color: COLORS[900],
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          Aún no tienes favoritos
        </Text>

        <Text
          style={{
            fontSize: 15,
            lineHeight: 23,
            color: COLORS.MUTED,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          Cuando agregues vendedores a favoritos, aparecerán aquí para que puedas
          consultarlos más rápido.
        </Text>

        <View style={{ width: "100%" }}>
          <CustomButton
            color="sextary"
            className="rounded-l-full rounded-r-full p-4"
            onPress={() => router.push("/(tabs)/Home")}
          >
            Explorar nuevos productos
          </CustomButton>
        </View>
      </View>
    );
  }, [loading, tabBarHeight, insets.bottom, search, favoritos.length, favoritosFiltrados.length]);

  const renderItem = ({ item }: { item: FavoriteUser }) => {
    const isRemoving = removingId === item.id;
    const displayLabel = item.nickname?.trim() ? item.nickname : item.nombre;

    return (
      <View
        style={{
          backgroundColor: COLORS.WHITE,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: COLORS[100],
          padding: 16,
          marginBottom: 14,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        }}
      >
        <CustomButton
          variant="text-only"
          className="p-0"
          onPress={() => irAlPerfil(item.id)}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Image
              source={item.imagen ? { uri: item.imagen } : defaultUserImage}
              defaultSource={defaultUserImage}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: COLORS[50],
                marginRight: 14,
              }}
              resizeMode="cover"
            />

            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: COLORS.TEXT,
                  marginBottom: 4,
                }}
              >
                {displayLabel}
              </Text>

              <View
                style={{
                  alignSelf: "flex-start",
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: COLORS[50],
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  marginTop: 2,
                }}
              >
                <Ionicons name="heart" size={14} color={COLORS[600]} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: COLORS[700],
                    marginLeft: 6,
                  }}
                >
                  En favoritos
                </Text>
              </View>
            </View>
          </View>
        </CustomButton>

        <View
          style={{
            flexDirection: "row",
            marginTop: 14,
            gap: 10,
          }}
        >
          <View style={{ flex: 1 }}>
            <CustomButton
              variant="contained"
              color="gray"
              className="rounded-xl border border-[#A1E8A1] p-3"
              onPress={() => irAlPerfil(item.id)}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="person-outline" size={18} color={COLORS[700]} />
                <Text
                  style={{
                    marginLeft: 8,
                    color: COLORS[700],
                    fontWeight: "700",
                    fontSize: 14,
                  }}
                >
                  Ver perfil
                </Text>
              </View>
            </CustomButton>
          </View>

          <View style={{ flex: 1 }}>
            {isRemoving ? (
              <View
                style={{
                  borderRadius: 14,
                  paddingVertical: 14,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: COLORS.DANGER_SOFT,
                  borderWidth: 1,
                  borderColor: "#FECACA",
                }}
              >
                <ActivityIndicator size="small" color={COLORS.DANGER} />
              </View>
            ) : (
              <CustomButton
                variant="contained"
                color="gray"
                className="rounded-xl border border-[#FECACA] p-3"
                onPress={() => confirmarEliminar(item)}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={COLORS.DANGER}
                  />
                  <Text
                    style={{
                      marginLeft: 8,
                      color: COLORS.DANGER,
                      fontWeight: "700",
                      fontSize: 14,
                    }}
                  >
                    Quitar
                  </Text>
                </View>
              </CustomButton>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BG }}>
      <View
        style={{
          paddingHorizontal: 18,
          paddingTop: 0,
          paddingBottom: 12,
          backgroundColor: COLORS.BG,
          marginTop: -20,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <CustomButton
            variant="icon-only"
            color="gray"
            className="rounded-full border border-[#E5E7EB] p-0 mr-4"
            style={{
              width: 42,
              height: 42,
            }}
            onPress={() => router.back()}
            icon={<Ionicons name="arrow-back" size={22} color={COLORS.TEXT} />}
          />

          <View style={{ flex: 1, paddingLeft: 2 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "800",
                color: COLORS[900],
              }}
            >
              Favoritos
            </Text>
            <Text
              style={{
                marginTop: 2,
                fontSize: 14,
                color: COLORS.MUTED,
              }}
            >
              Usuarios que guardaste para consultar luego
            </Text>
          </View>
        </View>

        <View
          style={{
            marginTop: 16,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: COLORS.WHITE,
            borderWidth: 1,
            borderColor: COLORS.BORDER,
            borderRadius: 16,
            paddingHorizontal: 14,
            height: 50,
          }}
        >
          <Ionicons name="search-outline" size={20} color={COLORS.MUTED} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre o usuario"
            placeholderTextColor={COLORS.MUTED}
            style={{
              flex: 1,
              marginLeft: 10,
              color: COLORS.TEXT,
              fontSize: 15,
              paddingVertical: 0,
            }}
          />

          {!!search.trim() && (
            <Ionicons
              name="close-circle"
              size={20}
              color={COLORS.MUTED}
              onPress={() => setSearch("")}
            />
          )}
        </View>
      </View>

      {loading ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <ActivityIndicator size="large" color={COLORS[600]} />
          <Text
            style={{
              marginTop: 14,
              fontSize: 15,
              color: COLORS.MUTED,
              textAlign: "center",
            }}
          >
            Cargando favoritos...
          </Text>
        </View>
      ) : favoritosFiltrados.length === 0 ? (
        renderEmptyState
      ) : (
        <FlatList
          data={favoritosFiltrados}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingTop: 6,
            paddingBottom: tabBarHeight + insets.bottom + 20,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS[600]}
            />
          }
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View
              style={{
                backgroundColor: COLORS.WHITE,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: COLORS[100],
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 16,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: COLORS[100],
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 10,
                }}
              >
                <Ionicons name="heart" size={18} color={COLORS[700]} />
              </View>

              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  lineHeight: 20,
                  color: COLORS.MUTED,
                }}
              >
                {search.trim() ? (
                  <>
                    Mostrando{" "}
                    <Text style={{ fontWeight: "800", color: COLORS[800] }}>
                      {favoritosFiltrados.length}
                    </Text>{" "}
                    resultado{favoritosFiltrados.length === 1 ? "" : "s"} de{" "}
                    <Text style={{ fontWeight: "800", color: COLORS[800] }}>
                      {favoritos.length}
                    </Text>
                    .
                  </>
                ) : (
                  <>
                    Tienes{" "}
                    <Text style={{ fontWeight: "800", color: COLORS[800] }}>
                      {favoritos.length}
                    </Text>{" "}
                    usuario{favoritos.length === 1 ? "" : "s"} en favoritos.
                  </>
                )}
              </Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 8 }} />}
        />
      )}
    </SafeAreaView>
  );
};

export default FavoritosScreen;