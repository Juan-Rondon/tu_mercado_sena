import CustomButton from "@/components/buttons/CustomButton";
import CustomInput from "@/components/inputs/CustomInput";
import { getToken, getCurrentUserId } from "@/src/lib/authToken";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const API_BASE_URL = "https://tumercadosena.shop/api/api";
const API_HOST = "https://tumercadosena.shop";

const COLORS = {
  DEFAULT: "#32CD32",
  50: "#EAFAEA",
  100: "#C6F1C6",
  200: "#A1E8A1",
  300: "#7CDF7C",
  400: "#57D657",
  500: "#25D366",
  600: "#29A829",
  700: "#208320",
  800: "#175E17",
  900: "#0E390E",
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
  blue50: "#EFF6FF",
  blue600: "#2563EB",
  red100: "#FEE2E2",
  red600: "#DC2626",
};

const defaultUserImage = require("../../assets/images/user_default.png");
const defaultProductImage = require("../../assets/images/imagedefault.png");

type RawMessage = Record<string, any>;
type RawChatDetail = Record<string, any>;

type MessageItem = {
  id: number;
  text: string;
  image: string | null;
  createdAt: string | null;
  senderId: number | null;
  isBuyerMessage: boolean;
  isMine: boolean;
};

type ChatHeaderData = {
  chatId: number;
  compradorId: number;
  vendedorId: number;
  otherUserId: number;
  otherUserName: string;
  otherUserImage: string | null;
  productId: number;
  productName: string;
  productImage: string | null;
  vistoComprador: boolean;
  vistoVendedor: boolean;
};

function getNested(obj: any, path: string) {
  try {
    return path.split(".").reduce((acc, key) => acc?.[key], obj);
  } catch {
    return undefined;
  }
}

function firstString(...values: any[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return "";
}

function firstNumber(...values: any[]): number {
  for (const value of values) {
    const n = Number(value);
    if (!Number.isNaN(n) && Number.isFinite(n)) return n;
  }
  return 0;
}

function normalizeImage(uri?: string | null): string | null {
  if (!uri || typeof uri !== "string") return null;

  const clean = uri.trim();
  if (!clean) return null;

  if (
    clean.includes("/tmp/php") ||
    clean.startsWith("/tmp/") ||
    clean.startsWith("tmp/")
  ) {
    return null;
  }

  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  if (clean.startsWith("/storage/")) {
    return `${API_HOST}${clean}`;
  }

  if (clean.startsWith("storage/")) {
    return `${API_HOST}/${clean}`;
  }

  if (clean.startsWith("usuarios/")) {
    return `${API_HOST}/storage/${clean}`;
  }

  if (clean.startsWith("productos/")) {
    return `${API_HOST}/storage/${clean}`;
  }

  if (clean.startsWith("/")) {
    return `${API_HOST}${clean}`;
  }

  return `${API_HOST}/${clean.replace(/^\/+/, "")}`;
}

function formatMessageTime(dateString?: string | null): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatHeaderDate(dateString?: string | null): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildHeaderFromDto(
  raw: RawChatDetail,
  params: {
    otherUserId?: string;
    otherUserName?: string;
    otherUserImage?: string;
  },
  currentUserId: number
): ChatHeaderData {
  const data = raw?.data ?? raw;

  const compradorId = firstNumber(
    data?.comprador_id,
    getNested(data, "comprador.id"),
    getNested(data, "usuario_comprador.id")
  );

  const vendedorId = firstNumber(
    data?.vendedor_id,
    getNested(data, "producto.vendedor.id"),
    getNested(data, "vendedor.id")
  );

  const paramOtherUserIdRaw = firstNumber(params.otherUserId);
  const paramOtherUserId =
    paramOtherUserIdRaw > 0 && paramOtherUserIdRaw !== currentUserId
      ? paramOtherUserIdRaw
      : 0;

  const paramOtherUserName = firstString(params.otherUserName);
  const paramOtherUserImage = normalizeImage(params.otherUserImage);

  const productId = firstNumber(getNested(data, "producto.id"));
  const productName = firstString(getNested(data, "producto.nombre"), "Producto");
  const productImage = normalizeImage(
    firstString(
      getNested(data, "producto.imagen"),
      getNested(data, "producto.fotos.0.imagen"),
      getNested(data, "producto.fotos.0.url")
    )
  );

  const vendedorName = firstString(
  getNested(data, "producto.vendedor.nickname"),
  getNested(data, "producto.vendedor.nombre"),
  getNested(data, "vendedor.nickname"),
  getNested(data, "vendedor.nombre")
);

  const vendedorImage = normalizeImage(
    firstString(
      getNested(data, "producto.vendedor.imagen"),
      getNested(data, "vendedor.imagen")
    )
  );

  const compradorName = firstString(
  getNested(data, "comprador.nickname"),
  getNested(data, "comprador.nombre"),
  getNested(data, "usuario_comprador.nickname"),
  getNested(data, "usuario_comprador.nombre")
);

  const compradorImage = normalizeImage(
    firstString(
      getNested(data, "comprador.imagen"),
      getNested(data, "usuario_comprador.imagen")
    )
  );

  let resolvedOtherUserId = 0;
  let resolvedOtherUserName = "";
  let resolvedOtherUserImage: string | null = null;

  if (currentUserId > 0) {
    if (currentUserId === vendedorId) {
      resolvedOtherUserId = compradorId;
      resolvedOtherUserName = compradorName;
      resolvedOtherUserImage = compradorImage;
    } else if (currentUserId === compradorId) {
      resolvedOtherUserId = vendedorId;
      resolvedOtherUserName = vendedorName;
      resolvedOtherUserImage = vendedorImage;
    }
  }

  if (!resolvedOtherUserId && paramOtherUserId > 0) {
    resolvedOtherUserId = paramOtherUserId;
  }

  if (!resolvedOtherUserId) {
    if (vendedorId > 0 && vendedorId !== currentUserId) {
      resolvedOtherUserId = vendedorId;
    } else if (compradorId > 0 && compradorId !== currentUserId) {
      resolvedOtherUserId = compradorId;
    }
  }

  if (!resolvedOtherUserName) {
    if (resolvedOtherUserId === compradorId) {
      resolvedOtherUserName = paramOtherUserName || compradorName || "Comprador";
    } else if (resolvedOtherUserId === vendedorId) {
      resolvedOtherUserName = paramOtherUserName || vendedorName || "Vendedor";
    } else {
      resolvedOtherUserName = paramOtherUserName || "Usuario";
    }
  }

  if (!resolvedOtherUserImage) {
    if (resolvedOtherUserId === compradorId) {
      resolvedOtherUserImage = paramOtherUserImage || compradorImage || null;
    } else if (resolvedOtherUserId === vendedorId) {
      resolvedOtherUserImage = paramOtherUserImage || vendedorImage || null;
    } else {
      resolvedOtherUserImage = paramOtherUserImage || null;
    }
  }

  return {
    chatId: firstNumber(data?.id, raw?.id),
    compradorId,
    vendedorId,
    otherUserId: resolvedOtherUserId,
    otherUserName: resolvedOtherUserName || "Usuario",
    otherUserImage: resolvedOtherUserImage,
    productId,
    productName,
    productImage,
    vistoComprador:
      data?.visto_comprador === true ||
      data?.visto_comprador === 1 ||
      data?.visto_comprador === "1",
    vistoVendedor:
      data?.visto_vendedor === true ||
      data?.visto_vendedor === 1 ||
      data?.visto_vendedor === "1",
  };
}

function normalizeMessages(
  raw: RawChatDetail,
  currentUserIsBuyer: boolean | null
): MessageItem[] {
  const data = raw?.data ?? raw;

  const messageList =
    getNested(data, "mensajes.data") ||
    getNested(data, "mensajes") ||
    getNested(data, "messages.data") ||
    getNested(data, "messages") ||
    [];

  if (!Array.isArray(messageList)) return [];

  return messageList
    .map((msg: RawMessage) => {
      const id = firstNumber(msg.id, msg.mensaje_id);
      const text = firstString(msg.mensaje, msg.texto, msg.text, "");
      const image = normalizeImage(firstString(msg.imagen, msg.image, msg.archivo, msg.foto));
      const createdAt =
        firstString(msg.fecha_registro, msg.created_at, msg.fecha, msg.timestamp) || null;

      const isBuyerMessage =
        typeof msg.es_comprador === "boolean"
          ? msg.es_comprador
          : msg.es_comprador === 1 ||
            msg.es_comprador === "1" ||
            msg.es_comprador === "true";

      const isMine =
        currentUserIsBuyer === null ? false : isBuyerMessage === currentUserIsBuyer;

      return {
        id,
        text,
        image,
        createdAt,
        senderId: null,
        isBuyerMessage,
        isMine,
      };
    })
    .filter((msg) => msg.id > 0 && (msg.text || msg.image));
}

function MessageBubble({
  item,
  showSeenStatus = false,
  seen = false,
}: {
  item: MessageItem;
  showSeenStatus?: boolean;
  seen?: boolean;
}) {
  return (
    <View
      style={{
        width: "100%",
        alignItems: item.isMine ? "flex-end" : "flex-start",
        marginBottom: 10,
      }}
    >
      <View
        style={{
          maxWidth: "80%",
          alignSelf: item.isMine ? "flex-end" : "flex-start",
          backgroundColor: item.isMine ? COLORS[500] : COLORS.white,
          borderRadius: 18,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderWidth: item.isMine ? 0 : 1,
          borderColor: COLORS.gray200,
          shadowColor: "#000",
          shadowOpacity: 0.04,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }}
      >
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={{
              width: 220,
              height: 220,
              borderRadius: 12,
              marginBottom: item.text ? 8 : 0,
              backgroundColor: COLORS.gray100,
            }}
            resizeMode="cover"
          />
        ) : null}

        {item.text ? (
          <Text
            style={{
              fontSize: 14,
              lineHeight: 20,
              fontWeight: "bold",
              color: item.isMine ? "#FFFFFF" : COLORS.black,
            }}
          >
            {item.text}
          </Text>
        ) : null}

        <View
          style={{
            marginTop: 6,
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: item.isMine ? "#515752" : COLORS.gray500,
              textAlign: "right",
              fontWeight: "600",
            }}
          >
            {formatMessageTime(item.createdAt)}
          </Text>

          {item.isMine && showSeenStatus ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginLeft: 6,
              }}
            >
              <View
                style={{
                  position: "relative",
                  width: 18,
                  height: 12,
                }}
              >
                <Ionicons
                  name="checkmark"
                  size={13}
                  color={seen ? "#0022FF" : "#FFFFFF"}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: -1,
                  }}
                />
                <Ionicons
                  name="checkmark"
                  size={13}
                  color={seen ? "#0022FF" : "#FFFFFF"}
                  style={{
                    position: "absolute",
                    left: 5,
                    top: -1,
                  }}
                />
              </View>

              {seen ? (
                <Text
                  style={{
                    marginLeft: 4,
                    fontSize: 11,
                    fontWeight: "700",
                    color: "#0022FF",
                  }}
                >
                  Visto
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function ChatDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    id,
    otherUserId: otherUserIdParam,
    otherUserName: otherUserNameParam,
    otherUserImage: otherUserImageParam,
  } = useLocalSearchParams<{
    id: string;
    otherUserId?: string;
    otherUserName?: string;
    otherUserImage?: string;
  }>();

  const flatListRef = useRef<FlatList<MessageItem>>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [header, setHeader] = useState<ChatHeaderData | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number>(0);

  const chatId = Array.isArray(id) ? id[0] : id;
  const otherUserId = Array.isArray(otherUserIdParam) ? otherUserIdParam[0] : otherUserIdParam;
  const otherUserName = Array.isArray(otherUserNameParam) ? otherUserNameParam[0] : otherUserNameParam;
  const otherUserImage = Array.isArray(otherUserImageParam) ? otherUserImageParam[0] : otherUserImageParam;

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const uid = await getCurrentUserId();
        if (mounted) {
          setCurrentUserId(firstNumber(uid));
        }
      } catch {
        if (mounted) {
          setCurrentUserId(0);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const currentUserIsBuyer = useMemo(() => {
    if (!header?.compradorId || !header?.vendedorId || !currentUserId) return null;

    if (currentUserId === header.compradorId) return true;
    if (currentUserId === header.vendedorId) return false;

    return null;
  }, [header, currentUserId]);

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const loadChat = useCallback(
    async (showLoader = false) => {
      if (!chatId) {
        setErrorMessage("No se encontró el identificador del chat.");
        setLoading(false);
        return;
      }

      try {
        if (showLoader) setLoading(true);
        setErrorMessage("");

        const token = await getToken();

        const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await response.json().catch(() => null);

        if (!response.ok) {
          const msg = json?.message || json?.error || "No se pudo cargar el chat.";
          throw new Error(msg);
        }

        const normalizedHeader = buildHeaderFromDto(
          json,
          {
            otherUserId,
            otherUserName,
            otherUserImage,
          },
          currentUserId
        );

        const inferredCurrentUserIsBuyer =
          currentUserId > 0
            ? currentUserId === normalizedHeader.compradorId
              ? true
              : currentUserId === normalizedHeader.vendedorId
              ? false
              : null
            : null;

        const normalizedMessages = normalizeMessages(json, inferredCurrentUserIsBuyer);

        setHeader(normalizedHeader);
        setMessages(normalizedMessages);

        setTimeout(() => {
          scrollToBottom(false);
        }, 80);
      } catch (error: any) {
        setErrorMessage(error?.message || "Ocurrió un error cargando el chat.");
      } finally {
        setLoading(false);
      }
    },
    [chatId, otherUserId, otherUserImage, otherUserName, scrollToBottom, currentUserId]
  );

  const sendMessage = useCallback(
    async (messageOverride?: string) => {
      const trimmed = (messageOverride ?? messageText).trim();

      if (!trimmed || !chatId || sending) return;

      if (currentUserIsBuyer === null) {
        setErrorMessage("No se pudo identificar el rol del usuario en este chat.");
        return;
      }

      try {
        setSending(true);
        setErrorMessage("");

        const token = await getToken();

        const payload = {
          mensaje: trimmed,
          chat_id: Number(chatId),
          es_comprador: currentUserIsBuyer,
        };

        const response = await fetch(`${API_BASE_URL}/chats/${chatId}/mensajes`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const json = await response.json().catch(() => null);

        if (!response.ok) {
          const msg = json?.message || json?.error || "No fue posible enviar el mensaje.";
          throw new Error(msg);
        }

        setMessageText("");
        await loadChat(false);

        setTimeout(() => {
          scrollToBottom(true);
        }, 80);
      } catch (error: any) {
        setErrorMessage(error?.message || "No fue posible enviar el mensaje.");
      } finally {
        setSending(false);
      }
    },
    [messageText, chatId, sending, currentUserIsBuyer, loadChat, scrollToBottom]
  );

  const openOtherUserProfile = useCallback(() => {
    if (!header || !currentUserId) return;

    let targetProfileUserId = 0;

    if (currentUserId === header.vendedorId) {
      targetProfileUserId = header.compradorId;
    } else if (currentUserId === header.compradorId) {
      targetProfileUserId = header.vendedorId;
    } else if (header.otherUserId && header.otherUserId !== currentUserId) {
      targetProfileUserId = header.otherUserId;
    }

    if (!targetProfileUserId || targetProfileUserId === currentUserId) return;

    router.push({
      pathname: "/profile",
      params: { userId: String(targetProfileUserId) },
    });
  }, [header, currentUserId, router]);

  useFocusEffect(
    useCallback(() => {
      if (currentUserId > 0) {
        loadChat(true);
      }
    }, [loadChat, currentUserId])
  );

  useEffect(() => {
    if (currentUserId <= 0) return;

    pollingRef.current = setInterval(() => {
      loadChat(false);
    }, 4000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [loadChat, currentUserId]);

  const lastMessageDate = useMemo(() => {
    if (!messages.length) return null;
    return messages[messages.length - 1]?.createdAt || null;
  }, [messages]);

  const lastOwnMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.isMine) {
        return messages[i].id;
      }
    }
    return null;
  }, [messages]);

  const myMessagesRead = useMemo(() => {
    if (!header || currentUserIsBuyer === null) return false;
    return currentUserIsBuyer ? header.vistoVendedor : header.vistoComprador;
  }, [header, currentUserIsBuyer]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.gray50 }}>
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
              marginTop: 12,
              fontSize: 15,
              color: COLORS.gray500,
              fontWeight: "600",
            }}
          >
            Cargando chat...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage && !header) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.gray50 }}>
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
            No fue posible abrir el chat
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
            onPress={() => loadChat(true)}
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.gray50 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View
          style={{
            backgroundColor: COLORS.white,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.gray200,
            paddingHorizontal: 14,
            paddingTop: 8,
            paddingBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: pressed ? COLORS.gray100 : "transparent",
                marginRight: 8,
              })}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.black} />
            </Pressable>

            <Image
              source={
                header?.otherUserImage &&
                header.otherUserImage.trim() !== "" &&
                !header.otherUserImage.includes("undefined")
                  ? { uri: header.otherUserImage }
                  : defaultUserImage
              }
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: COLORS.gray100,
                marginLeft: 18,
                marginRight: 10,
              }}
              resizeMode="cover"
            />

            <View style={{ flex: 1, minWidth: 0 }}>
              <Pressable onPress={openOtherUserProfile}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: COLORS.black,
                  }}
                >
                  {header?.otherUserName || "Usuario"}
                </Text>
              </Pressable>

              <View
                style={{
                  marginTop: 4,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Image
                  source={
                    header?.productImage &&
                    header.productImage.trim() !== "" &&
                    !header.productImage.includes("undefined")
                      ? { uri: header.productImage }
                      : defaultProductImage
                  }
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    marginRight: 6,
                    backgroundColor: COLORS.gray100,
                  }}
                  resizeMode="cover"
                />
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: COLORS[600],
                    fontWeight: "700",
                  }}
                >
                  {header?.productName || "Producto"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {errorMessage ? (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 10,
              backgroundColor: COLORS.red100,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Text
              style={{
                color: COLORS.red600,
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              {errorMessage}
            </Text>
          </View>
        ) : null}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 14,
            paddingTop: 14,
            paddingBottom: 14,
            flexGrow: messages.length === 0 ? 1 : 0,
          }}
          renderItem={({ item }) => (
            <MessageBubble
              item={item}
              showSeenStatus={item.id === lastOwnMessageId}
              seen={item.id === lastOwnMessageId && myMessagesRead}
            />
          )}
          onContentSizeChange={() => scrollToBottom(false)}
          ListHeaderComponent={
            lastMessageDate ? (
              <View
                style={{
                  alignSelf: "center",
                  backgroundColor: COLORS.blue50,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  marginBottom: 14,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: COLORS.blue600,
                  }}
                >
                  {formatHeaderDate(lastMessageDate)}
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
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
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  backgroundColor: COLORS[50],
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 18,
                }}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={42}
                  color={COLORS[600]}
                />
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
                Aún no hay mensajes
              </Text>

              <Text
                style={{
                  fontSize: 15,
                  lineHeight: 22,
                  color: COLORS.gray500,
                  textAlign: "center",
                }}
              >
                Escribe el primer mensaje para iniciar la conversación.
              </Text>
            </View>
          }
        />

        <View
          style={{
            backgroundColor: COLORS.white,
            borderTopWidth: 1,
            borderTopColor: COLORS.gray200,
            paddingHorizontal: 12,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 10),
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              width: "100%",
            }}
          >
            <View style={{ flex: 1, marginRight: 10 }}>
              <CustomInput
                type="text"
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Escribe un mensaje"
                maxLength={1000}
                returnKeyType="send"
                blurOnSubmit={false}
                onSubmitEditing={() => sendMessage()}
                containerStyle={{
                  minHeight: 52,
                  borderRadius: 26,
                  paddingRight: 6,
                }}
                style={{
                  fontSize: 15,
                  minHeight: 52,
                  paddingVertical: Platform.OS === "ios" ? 12 : 10,
                  textAlignVertical: "center",
                }}
                icon={
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={19}
                    color={COLORS.gray400}
                  />
                }
              />
            </View>

            <CustomButton
              variant="icon-only"
              color="sextary"
              onPress={() => sendMessage()}
              disabled={!messageText.trim() || sending}
              icon={
                sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                )
              }
              className="p-0"
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                justifyContent: "center",
                alignItems: "center",
                opacity: !messageText.trim() || sending ? 0.7 : 1,
              }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}