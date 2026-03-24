import { getCurrentUserId, getToken } from "@/src/lib/authToken";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const API_BASE_URL = "https://tumercadosena.shop/api/api";

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
  white: "#FFFFFF",
  black: "#111827",
  gray50: "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray300: "#CBD5E1",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray700: "#334155",
  red100: "#FEE2E2",
  red600: "#DC2626",
  whatsappBlue: "#34B7F1",
  whatsappGray: "#9CA3AF",
};

const defaultUserImage = require("../../../assets/images/user_default.png");
const defaultProductImage = require("../../../assets/images/imagedefault.png");

type ApiChatUser = {
  id: number;
  nickname: string;
  imagen: string | null;
};

type ApiChatProduct = {
  id: number;
  nombre: string;
  precio: number | string;
  imagen: string | null;
};

type ApiChatItem = {
  id: number;
  usuario: ApiChatUser;
  producto: ApiChatProduct;
  comprador_id?: number | string | null;
  vendedor_id?: number | string | null;
  visto_comprador: boolean | number | string;
  visto_vendedor: boolean | number | string;
  ultimoMensajeTexto: string;
  fechaUltimoMensaje: string | null;
  ultimo_mensaje_es_comprador?: boolean | number | string | null;
  es_ultimo_mensaje_comprador?: boolean | number | string | null;
  last_message_is_buyer?: boolean | number | string | null;
};

type ChatItem = {
  id: number;
  otherUserId: number;
  otherUserName: string;
  otherUserImage: string | null;
  productId: number;
  productName: string;
  productPrice: number;
  productImage: string | null;
  lastMessage: string;
  lastMessageDate: string | null;
  isSeenByBuyer: boolean;
  isSeenBySeller: boolean;
  buyerId: number;
  sellerId: number;
  lastMessageIsBuyer: boolean | null;
};

function normalizeImage(uri?: string | null): string | null {
  if (!uri || typeof uri !== "string" || !uri.trim()) return null;
  return uri.trim();
}

function toBool(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeChat(item: ApiChatItem): ChatItem {
  return {
    id: Number(item.id) || 0,
    otherUserId: Number(item?.usuario?.id) || 0,
    otherUserName: item?.usuario?.nickname?.trim() || "Usuario",
    otherUserImage: normalizeImage(item?.usuario?.imagen),
    productId: Number(item?.producto?.id) || 0,
    productName: item?.producto?.nombre?.trim() || "Producto",
    productPrice: Number(item?.producto?.precio) || 0,
    productImage: normalizeImage(item?.producto?.imagen),
    lastMessage: item?.ultimoMensajeTexto?.trim() || "Sin mensajes aún",
    lastMessageDate: item?.fechaUltimoMensaje || null,
    isSeenByBuyer: toBool(item?.visto_comprador),
    isSeenBySeller: toBool(item?.visto_vendedor),
    buyerId: toNumber(item?.comprador_id),
    sellerId: toNumber(item?.vendedor_id),
    lastMessageIsBuyer:
      item?.ultimo_mensaje_es_comprador !== undefined &&
      item?.ultimo_mensaje_es_comprador !== null
        ? toBool(item.ultimo_mensaje_es_comprador)
        : item?.es_ultimo_mensaje_comprador !== undefined &&
            item?.es_ultimo_mensaje_comprador !== null
          ? toBool(item.es_ultimo_mensaje_comprador)
          : item?.last_message_is_buyer !== undefined &&
              item?.last_message_is_buyer !== null
            ? toBool(item.last_message_is_buyer)
            : null,
  };
}

function formatChatDate(dateString?: string | null): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();

  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) {
    return date.toLocaleTimeString("es-CO", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Ayer";

  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function DoubleCheck({ seen }: { seen: boolean }) {
  const color = seen ? COLORS.whatsappBlue : COLORS.whatsappGray;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 6,
        position: "relative",
        width: 18,
        height: 12,
      }}
    >
      <Ionicons
        name="checkmark"
        size={13}
        color={color}
        style={{
          position: "absolute",
          left: 0,
          top: -1,
        }}
      />
      <Ionicons
        name="checkmark"
        size={13}
        color={color}
        style={{
          position: "absolute",
          left: 5,
          top: -1,
        }}
      />
    </View>
  );
}

function ChatCard({
  item,
  currentUserId,
  onPress,
  onDelete,
}: {
  item: ChatItem;
  currentUserId: number;
  onPress: () => void;
  onDelete: () => void;
}) {
  const iAmBuyer =
    currentUserId > 0 && item.buyerId > 0 && currentUserId === item.buyerId;

  const iAmSeller =
    currentUserId > 0 && item.sellerId > 0 && currentUserId === item.sellerId;

  const isMyLastMessage =
    item.lastMessageIsBuyer === null
      ? false
      : (iAmBuyer && item.lastMessageIsBuyer) || (iAmSeller && !item.lastMessageIsBuyer);

  const myLastMessageSeen =
    iAmBuyer ? item.isSeenBySeller : iAmSeller ? item.isSeenByBuyer : false;

  const handleLongPress = () => {
    Alert.alert("Opciones del chat", "Selecciona una acción", [
      {
        text: "Reportar chat",
        onPress: () => {},
      },
      {
  text: "Eliminar chat",
  style: "destructive",
  onPress: () => {
    Alert.alert(
      "No disponible",
      "Por ahora no se puede eliminar el chat porque el servidor lo deja cerrado y después no permite volver a escribir."
    );
  },
},
      {
        text: "Cancelar",
        style: "cancel",
      },
    ]);
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={handleLongPress}
      delayLongPress={300}
      style={({ pressed }) => ({
        backgroundColor: COLORS.white,
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: pressed ? COLORS[200] : COLORS.gray200,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        opacity: pressed ? 0.96 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Image
          source={item.otherUserImage ? { uri: item.otherUserImage } : defaultUserImage}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            marginRight: 12,
            backgroundColor: COLORS.gray100,
          }}
        />

        <View style={{ flex: 1, minWidth: 0 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontSize: 16,
                fontWeight: "800",
                color: COLORS.black,
                marginRight: 10,
              }}
            >
              {item.otherUserName}
            </Text>

            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: COLORS.gray500,
              }}
            >
              {formatChatDate(item.lastMessageDate)}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <Image
              source={item.productImage ? { uri: item.productImage } : defaultProductImage}
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                backgroundColor: COLORS.gray100,
                marginRight: 8,
              }}
            />
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: "700",
                color: COLORS[600],
                marginLeft: -27,
              }}
            >
              {item.productName}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {isMyLastMessage ? <DoubleCheck seen={myLastMessageSeen} /> : null}

            <Text
              numberOfLines={2}
              style={{
                flex: 1,
                fontSize: 14,
                lineHeight: 20,
                color: COLORS.gray600,
                fontWeight: "400",
                marginLeft: isMyLastMessage ? 4 : 0,
              }}
            >
              {item.lastMessage}
            </Text>
          </View>
        </View>

        <View style={{ marginLeft: 10, justifyContent: "center" }}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
        </View>
      </View>
    </Pressable>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState(0);
  const [deletingChatId, setDeletingChatId] = useState<number | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const uid = await getCurrentUserId();
        if (mounted) setCurrentUserId(toNumber(uid));
      } catch {
        if (mounted) setCurrentUserId(0);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const loadChats = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setErrorMessage("");

      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/chats`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const msg = json?.message || json?.error || "No se pudieron cargar los chats.";
        throw new Error(msg);
      }

      const rawList: ApiChatItem[] = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
          ? json.data
          : [];

      const normalized: ChatItem[] = rawList
        .map((item: ApiChatItem) => normalizeChat(item))
        .filter((item: ChatItem) => item.id > 0)
        .sort((a: ChatItem, b: ChatItem) => {
          const dateA = a.lastMessageDate ? new Date(a.lastMessageDate).getTime() : 0;
          const dateB = b.lastMessageDate ? new Date(b.lastMessageDate).getTime() : 0;
          return dateB - dateA;
        });

      setChats(normalized);
    } catch (error: any) {
      setErrorMessage(error?.message || "Ocurrió un error cargando tus chats.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const deleteChat = useCallback(async (chatId: number) => {
    try {
      setDeletingChatId(chatId);

      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const msg = json?.message || json?.error || "No se pudo eliminar el chat.";
        throw new Error(msg);
      }

      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Error eliminando el chat.");
    } finally {
      setDeletingChatId(null);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadChats(false);
  }, [loadChats]);

  useFocusEffect(
    useCallback(() => {
      loadChats(true);
    }, [loadChats])
  );

  useEffect(() => {
    pollingRef.current = setInterval(() => {
      if (!deletingChatId) {
        loadChats(false);
      }
    }, 4000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [loadChats, deletingChatId]);

  const filteredChats = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return chats;

    return chats.filter((chat) => {
      return (
        chat.otherUserName.toLowerCase().includes(term) ||
        chat.productName.toLowerCase().includes(term) ||
        chat.lastMessage.toLowerCase().includes(term)
      );
    });
  }, [chats, search]);

  const bottomSpacing = Math.max(insets.bottom + 90, 120);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: COLORS.gray50 }}
      edges={["top", "left", "right"]}
    >
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 12,
          backgroundColor: COLORS.gray50,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "900",
                color: COLORS[900],
              }}
            >
              Chats
            </Text>
            <Text
              style={{
                marginTop: 4,
                fontSize: 15,
                color: COLORS.gray500,
                fontWeight: "600",
              }}
            >
              Tus conversaciones de compra y venta
            </Text>
          </View>

          <Pressable
            onPress={() => loadChats(false)}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: pressed ? COLORS[100] : COLORS.white,
              borderWidth: 1,
              borderColor: COLORS.gray200,
              justifyContent: "center",
              alignItems: "center",
            })}
          >
            <Ionicons name="refresh-outline" size={21} color={COLORS[700]} />
          </Pressable>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: COLORS.white,
            borderWidth: 1,
            borderColor: COLORS.gray200,
            borderRadius: 18,
            paddingHorizontal: 14,
            height: 54,
          }}
        >
          <Ionicons name="search-outline" size={20} color={COLORS.gray400} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por usuario, producto o mensaje"
            placeholderTextColor={COLORS.gray400}
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 15,
              color: COLORS.black,
            }}
          />
          {search.trim().length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray400} />
            </Pressable>
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
              color: COLORS.gray500,
              fontWeight: "600",
            }}
          >
            Cargando conversaciones...
          </Text>
        </View>
      ) : errorMessage ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              width: 82,
              height: 82,
              borderRadius: 41,
              backgroundColor: COLORS.red100,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <Ionicons name="alert-circle-outline" size={42} color={COLORS.red600} />
          </View>

          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: COLORS.black,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            No fue posible cargar los chats
          </Text>

          <Text
            style={{
              fontSize: 15,
              lineHeight: 22,
              color: COLORS.gray500,
              textAlign: "center",
              marginBottom: 18,
            }}
          >
            {errorMessage}
          </Text>

          <Pressable
            onPress={() => loadChats(true)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? COLORS[700] : COLORS[500],
              borderRadius: 16,
              paddingHorizontal: 20,
              paddingVertical: 14,
            })}
          >
            <Text
              style={{
                color: COLORS.white,
                fontSize: 15,
                fontWeight: "800",
              }}
            >
              Reintentar
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: bottomSpacing,
            flexGrow: 1,
          }}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                backgroundColor: COLORS.gray200,
                marginVertical: 10,
                marginLeft: 2,
              }}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS[600]}
            />
          }
          renderItem={({ item }) => (
            <ChatCard
              item={item}
              currentUserId={currentUserId}
              onPress={() => {
                router.push({
                  pathname: "/chatUser/[id]",
                  params: {
                    id: String(item.id),
                    otherUserId: String(item.otherUserId),
                    otherUserName: item.otherUserName,
                    otherUserImage: item.otherUserImage ?? "",
                  },
                });
              }}
              onDelete={() => deleteChat(item.id)}
            />
          )}
          ListFooterComponent={<View style={{ height: 24 }} />}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 24,
                paddingBottom: bottomSpacing / 2,
              }}
            >
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: COLORS[50],
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 18,
                }}
              >
                <Ionicons name="chatbubbles-outline" size={46} color={COLORS[600]} />
              </View>

              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: COLORS.black,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                {search.trim() ? "No encontramos coincidencias" : "Aún no tienes chats"}
              </Text>

              <Text
                style={{
                  fontSize: 15,
                  lineHeight: 22,
                  color: COLORS.gray500,
                  textAlign: "center",
                }}
              >
                {search.trim()
                  ? "Prueba con otro nombre, producto o palabra clave."
                  : "Cuando contactes a un comprador o vendedor, la conversación aparecerá aquí."}
              </Text>

              <Pressable
                onPress={() => router.push("/(tabs)/Home")}
                style={({ pressed }) => ({
                  marginTop: 20,
                  backgroundColor: pressed ? COLORS[700] : COLORS[500],
                  borderRadius: 16,
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                })}
              >
                <Text
                  style={{
                    color: COLORS.white,
                    fontSize: 15,
                    fontWeight: "800",
                  }}
                >
                  Ir al inicio
                </Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}