import CustomButton from "@/components/buttons/CustomButton";
import CustomInput from "@/components/inputs/CustomInput";
import { getToken } from "@/src/lib/authToken";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const API_BASE_URL = "http://192.168.1.11:8000";

const VenderScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [images, setImages] = useState<string[]>([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [loading, setLoading] = useState(false);

  // ⚠️ IDs temporales (luego los traeremos dinámicos)
  const [subcategoriaId] = useState(1);
  const [integridadId] = useState(1);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesito acceso a tu galería.");
      return;
    }

    const remaining = 3 - images.length;
    if (remaining <= 0) {
      Alert.alert("Límite alcanzado", "Máximo 3 imágenes.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (!result.canceled) {
      const picked = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...picked].slice(0, 3));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublicar = async () => {
    if (!nombre || !descripcion || !precio || !cantidad) {
      Alert.alert("Campos requeridos", "Completa todos los campos obligatorios.");
      return;
    }

    try {
      setLoading(true);

      //const token = await AsyncStorage.getItem("token");
      const token = await getToken();

      if (!token) {
        Alert.alert("Error", "No hay sesión activa.");
        return;
      }

      const formData = new FormData();

      formData.append("nombre", nombre);
      formData.append("descripcion", descripcion);
      formData.append("precio", String(Number(precio)));
      formData.append("disponibles", String(Number(cantidad)));
      formData.append("subcategoria_id", String(subcategoriaId));
      formData.append("integridad_id", String(integridadId));

      images.forEach((uri, index) => {
        formData.append("imagenes[]", {
          uri,
          name: `imagen_${index}.jpg`,
          type: "image/jpeg",
        } as any);
      });

      const res = await fetch(`${API_BASE_URL}/api/productos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data?.message || "No se pudo crear el producto.");
        return;
      }

      Alert.alert("Éxito", "Producto publicado correctamente.");
      router.back();

    } catch (error) {
      Alert.alert("Error", "No fue posible conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const Box = ({ uri, index, isUpload }: any) => (
    <Pressable onPress={isUpload ? pickImages : undefined} style={styles.box}>
      {uri ? (
        <>
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
          <Pressable onPress={() => removeImage(index)} style={styles.removeBtn}>
            <Text style={styles.removeText}>×</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.placeholder}>
          {isUpload ? (
            <>
              <Text style={styles.uploadText}>Subir imagen</Text>
              <Text style={styles.counter}>{images.length}/3</Text>
            </>
          ) : (
            <Text style={styles.plus}>+</Text>
          )}
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 12) + 90,
          }}
        >
          <View className="bg-sextary-600 items-center py-3">
            <Text className="text-white text-lg font-semibold">
              Publicar Nuevo producto
            </Text>
          </View>

          <View className="m-4 rounded-xl border border-sextary-600 p-4 bg-white">

            <Text className="font-semibold mb-1">Nombre del Producto *</Text>
            <CustomInput value={nombre} onChangeText={setNombre} />

            <Text className="font-semibold mb-1 mt-2">
              Descripción (max 185 caracteres) *
            </Text>
            <TextInput
              style={styles.input}
              multiline
              maxLength={185}
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Ingrese descripción"
              placeholderTextColor="#9CA3AF"
            />

            <View className="flex-row justify-between mt-3">
              <View style={{ width: "48%" }}>
                <Text className="font-semibold mb-1">Precio (COP)*</Text>
                <CustomInput
                  type="number"
                  value={precio}
                  onChangeText={setPrecio}
                />
              </View>
              <View style={{ width: "48%" }}>
                <Text className="font-semibold mb-1">Cantidad *</Text>
                <CustomInput
                  type="number"
                  value={cantidad}
                  onChangeText={setCantidad}
                />
              </View>
            </View>

            <Text className="font-semibold text-center mt-4">Imagen del producto</Text>
            <Text className="text-center text-gray-400 text-sm mb-3">Máximo 3</Text>

            <View style={styles.grid}>
              <Box isUpload />
              <Box uri={images[0]} index={0} />
              <Box uri={images[1]} index={1} />
              <Box uri={images[2]} index={2} />
            </View>

            <CustomButton
              variant="contained"
              className="rounded-full py-3 bg-sextary-600 mt-4"
              onPress={handlePublicar}
            >
              <Text className="text-white text-lg text-center">
                {loading ? "Publicando..." : "Publicar Producto"}
              </Text>
            </CustomButton>

            <CustomButton
              variant="contained"
              className="bg-red-600 rounded-full py-3 mt-3"
              onPress={() => router.back()}
            >
              <Text className="text-white text-lg text-center">
                Cancelar
              </Text>
            </CustomButton>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  box: {
    width: "23%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  removeBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },
  removeText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  uploadText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  counter: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 4,
  },
  plus: {
    fontSize: 32,
    color: "#d1d5db",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1f2937",
    minHeight: 80,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
  },
});

export default VenderScreen;