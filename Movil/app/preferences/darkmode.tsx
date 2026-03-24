import { useAppTheme } from "@/src/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ModoOscuro() {
  const router = useRouter();
  const { themeMode, resolvedTheme, colors, setThemeMode } = useAppTheme();

  useEffect(() => {
    if (themeMode !== "light") {
      setThemeMode("light");
    }
  }, [themeMode, setThemeMode]);

  const opciones: {
    key: "light";
    titulo: string;
    descripcion: string;
    icono: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      key: "light",
      titulo: "Claro",
      descripcion: "La aplicación siempre se verá en modo claro.",
      icono: "sunny-outline",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 24,
            marginBottom: 24,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={colors.text} />
          </TouchableOpacity>

          <Text
            style={{
              color: colors.text,
              fontSize: 20,
              fontWeight: "700",
              marginLeft: 16,
              flex: 1,
              textAlign: "center",
              marginRight: 26,
            }}
          >
            Apariencia
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
          }}
        >
          {opciones.map((opcion, index) => {
            const activa = themeMode === opcion.key;

            return (
              <TouchableOpacity
                key={opcion.key}
                onPress={() => setThemeMode(opcion.key)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  borderBottomWidth: index !== opciones.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  backgroundColor: activa ? colors.surface : colors.card,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: activa ? colors.primary : colors.surface,
                      marginRight: 14,
                    }}
                  >
                    <Ionicons
                      name={opcion.icono}
                      size={20}
                      color={activa ? "#FFFFFF" : colors.text}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: colors.text,
                      }}
                    >
                      {opcion.titulo}
                    </Text>

                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.textMuted,
                        marginTop: 4,
                        lineHeight: 18,
                      }}
                    >
                      {opcion.descripcion}
                    </Text>
                  </View>

                  {activa && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={colors.primary}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          style={{
            marginTop: 24,
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 15,
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            Estado actual
          </Text>

          <Text
            style={{
              color: colors.textMuted,
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            Preferencia seleccionada:{" "}
            <Text style={{ color: colors.text, fontWeight: "700" }}>
              Claro
            </Text>
            {"\n"}
            Tema aplicado ahora mismo:{" "}
            <Text style={{ color: colors.text, fontWeight: "700" }}>
              {resolvedTheme === "dark" ? "Oscuro" : "Claro"}
            </Text>
          </Text>
        </View>

        <Text
          style={{
            color: colors.textMuted,
            fontSize: 14,
            marginTop: 24,
            lineHeight: 20,
          }}
        >
          La aplicación usará únicamente el tema claro.
        </Text>
      </ScrollView>
    </View>
  );
}