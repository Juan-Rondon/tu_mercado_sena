import CustomButton from "@/components/buttons/CustomButton";
import CustomInput from "@/components/inputs/CustomInput";
import { getToken } from "@/src/lib/authToken";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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

const API_BASE_URL = "https://tumercadosena.shop/api";

type Subcategoria = {
  id: number;
  nombre: string;
  categoria_id?: number;
};

type Categoria = {
  id: number;
  nombre: string;
  subcategorias?: Subcategoria[];
};

type Integridad = {
  id: number;
  nombre: string;
  descripcion?: string | null;
};

const VenderScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [images, setImages] = useState<string[]>([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [loading, setLoading] = useState(false);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [integridades, setIntegridades] = useState<Integridad[]>([]);

  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [subcategoriaId, setSubcategoriaId] = useState<number | null>(null);
  const [integridadId, setIntegridadId] = useState<number | null>(null);

  const [categoriaNombre, setCategoriaNombre] = useState("");
  const [subcategoriaNombre, setSubcategoriaNombre] = useState("");
  const [integridadNombre, setIntegridadNombre] = useState("");

  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [loadingIntegridades, setLoadingIntegridades] = useState(false);

  useEffect(() => {
    cargarCategorias();
    cargarIntegridades();
  }, []);

  const limpiarFormulario = useCallback(() => {
    setImages([]);
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setCantidad("");

    setCategoriaId(null);
    setSubcategoriaId(null);
    setIntegridadId(null);

    setCategoriaNombre("");
    setSubcategoriaNombre("");
    setIntegridadNombre("");

    setSubcategorias([]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      limpiarFormulario();
    }, [limpiarFormulario])
  );

  const normalizarArray = (json: any) => {
    if (Array.isArray(json)) return json;
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.data?.data)) return json.data.data;
    return [];
  };

  const limpiarNumero = (valor: string) => {
    return valor.replace(/\D/g, "");
  };

  const formatearPesosCOP = (valor: string) => {
    const soloNumeros = limpiarNumero(valor);
    if (!soloNumeros) return "";
    return soloNumeros.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleChangePrecio = (valor: string) => {
    setPrecio(formatearPesosCOP(valor));
  };

  const handleChangeCantidad = (valor: string) => {
    setCantidad(limpiarNumero(valor));
  };

  const apiUrl = (path: string) => {
    const base = API_BASE_URL.endsWith("/")
      ? API_BASE_URL.slice(0, -1)
      : API_BASE_URL;

    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${base}${cleanPath}`;
  };

  const cargarCategorias = async () => {
    try {
      setLoadingCategorias(true);

      const token = await getToken();

      if (!token) {
        Alert.alert("Error", "No hay sesión activa.");
        return;
      }

      const res = await fetch(apiUrl("/categorias"), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        Alert.alert(
          "Error",
          json?.message || "No se pudieron cargar las categorías."
        );
        setCategorias([]);
        return;
      }

      const data = normalizarArray(json);

      const categoriasNormalizadas: Categoria[] = data.map((item: any) => ({
        id: Number(item.id),
        nombre: String(item.nombre ?? ""),
        subcategorias: Array.isArray(item.subcategorias)
          ? item.subcategorias.map((sub: any) => ({
              id: Number(sub.id),
              nombre: String(sub.nombre ?? ""),
              categoria_id:
                sub.categoria_id !== undefined && sub.categoria_id !== null
                  ? Number(sub.categoria_id)
                  : undefined,
            }))
          : [],
      }));

      setCategorias(categoriasNormalizadas);
    } catch (error) {
      Alert.alert("Error", "No fue posible cargar las categorías.");
      setCategorias([]);
    } finally {
      setLoadingCategorias(false);
    }
  };

  const cargarIntegridades = async () => {
    try {
      setLoadingIntegridades(true);

      const token = await getToken();

      if (!token) {
        Alert.alert("Error", "No hay sesión activa.");
        return;
      }

      const res = await fetch(apiUrl("/integridades"), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        Alert.alert(
          "Error",
          json?.message || "No se pudieron cargar las integridades."
        );
        setIntegridades([]);
        return;
      }

      const data = normalizarArray(json);

      const integridadesNormalizadas: Integridad[] = data.map((item: any) => ({
        id: Number(item.id),
        nombre: String(item.nombre ?? ""),
        descripcion:
          item.descripcion !== undefined && item.descripcion !== null
            ? String(item.descripcion)
            : null,
      }));

      setIntegridades(integridadesNormalizadas);
    } catch (error) {
      Alert.alert("Error", "No fue posible cargar las integridades.");
      setIntegridades([]);
    } finally {
      setLoadingIntegridades(false);
    }
  };

  const seleccionarCategoria = (nombreCategoria: string) => {
    const categoria = categorias.find((c) => c.nombre === nombreCategoria);
    if (!categoria) return;

    setCategoriaNombre(categoria.nombre);
    setCategoriaId(categoria.id);

    setSubcategoriaId(null);
    setSubcategoriaNombre("");

    setSubcategorias(
      Array.isArray(categoria.subcategorias) ? categoria.subcategorias : []
    );
  };

  const seleccionarSubcategoria = (nombreSubcategoria: string) => {
    const subcategoria = subcategorias.find(
      (s) => s.nombre === nombreSubcategoria
    );
    if (!subcategoria) return;

    setSubcategoriaNombre(subcategoria.nombre);
    setSubcategoriaId(subcategoria.id);
  };

  const seleccionarIntegridad = (nombreIntegridad: string) => {
    const integridad = integridades.find((i) => i.nombre === nombreIntegridad);
    if (!integridad) return;

    setIntegridadNombre(integridad.nombre);
    setIntegridadId(integridad.id);
  };

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
    if (
      !nombre.trim() ||
      !descripcion.trim() ||
      !precio.trim() ||
      !cantidad.trim() ||
      !categoriaId ||
      !subcategoriaId ||
      !integridadId
    ) {
      Alert.alert(
        "Campos requeridos",
        "Completa todos los campos obligatorios."
      );
      return;
    }

    try {
      setLoading(true);

      const token = await getToken();

      if (!token) {
        Alert.alert("Error", "No hay sesión activa.");
        return;
      }

      const formData = new FormData();

      formData.append("nombre", nombre.trim());
      formData.append("descripcion", descripcion.trim());
      formData.append("precio", limpiarNumero(precio));
      formData.append("disponibles", limpiarNumero(cantidad));
      formData.append("categoria_id", String(categoriaId));
      formData.append("subcategoria_id", String(subcategoriaId));
      formData.append("integridad_id", String(integridadId));

      images.forEach((uri, index) => {
        formData.append(
          "imagenes[]",
          {
            uri,
            name: `imagen_${index}.jpg`,
            type: "image/jpeg",
          } as any
        );
      });

      const res = await fetch(apiUrl("/productos"), {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        Alert.alert("Error", data?.message || "No se pudo crear el producto.");
        return;
      }

      limpiarFormulario();

      Alert.alert("Éxito", "Producto publicado correctamente.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "No fue posible conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const Box = ({
    uri,
    index,
    isUpload,
  }: {
    uri?: string;
    index?: number;
    isUpload?: boolean;
  }) => (
    <Pressable onPress={isUpload ? pickImages : undefined} style={styles.box}>
      {uri ? (
        <>
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
          <Pressable
            onPress={() => typeof index === "number" && removeImage(index)}
            style={styles.removeBtn}
          >
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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff" }}
      edges={["bottom"]}
    >
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
            <CustomInput
              value={nombre}
              onChangeText={setNombre}
              className="border border-green-600"
            />

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
                <Text className="font-semibold mb-1">Precio (COP) *</Text>
                <CustomInput
                  type="text"
                  className="border border-green-600"
                  value={precio}
                  onChangeText={handleChangePrecio}
                  placeholder="Ej: 25.000"
                />
              </View>

              <View style={{ width: "48%" }}>
                <Text className="font-semibold mb-1">Cantidad *</Text>
                <CustomInput
                  type="text"
                  className="border border-green-600"
                  value={cantidad}
                  onChangeText={handleChangeCantidad}
                  placeholder="Ej: 10"
                />
              </View>
            </View>

            <Text className="font-semibold mb-1 mt-3">Categoría *</Text>
            <CustomButton
              value={categoriaNombre}
              variant="desplegar"
              options={categorias.map((c) => c.nombre)}
              placeholder={
                loadingCategorias
                  ? "Cargando categorías..."
                  : categoriaNombre || "Seleccione categoría"
              }
              onSelect={seleccionarCategoria}
            >
              {loadingCategorias
                ? "Cargando categorías..."
                : categoriaNombre || "Seleccione categoría"}
            </CustomButton>

            <Text className="font-semibold mb-1 mt-3">Subcategoría *</Text>
            <CustomButton
              value={subcategoriaNombre}
              variant="desplegar"
              options={subcategorias.map((s) => s.nombre)}
              placeholder={
                !categoriaId
                  ? "Seleccione primero una categoría"
                  : subcategoriaNombre || "Seleccione subcategoría"
              }
              onSelect={seleccionarSubcategoria}
            >
              {!categoriaId
                ? "Seleccione primero una categoría"
                : subcategoriaNombre || "Seleccione subcategoría"}
            </CustomButton>

            <Text className="font-semibold mb-1 mt-3">Integridad *</Text>
            <CustomButton
              value={integridadNombre}
              variant="desplegar"
              options={integridades.map((i) => i.nombre)}
              placeholder={
                loadingIntegridades
                  ? "Cargando integridades..."
                  : integridadNombre || "Seleccione integridad"
              }
              onSelect={seleccionarIntegridad}
            >
              {loadingIntegridades
                ? "Cargando integridades..."
                : integridadNombre || "Seleccione integridad"}
            </CustomButton>

            <Text className="font-semibold text-center mt-4">
              Imagen del producto
            </Text>
            <Text className="text-center text-gray-400 text-sm mb-3">
              Máximo 3
            </Text>

            <View style={styles.grid}>
              <Box isUpload />
              <Box uri={images[0]} index={0} />
              <Box uri={images[1]} index={1} />
              <Box uri={images[2]} index={2} />
            </View>

            <CustomButton
              variant="contained"
              className="rounded-l-full rounded-r-full py-4"
              color="sextary"
              onPress={handlePublicar}
              disabled={loading}
            >
              <Text className="text-white text-lg text-center">
                {loading ? "Publicando..." : "Publicar Producto"}
              </Text>
            </CustomButton>

            <CustomButton
              variant="contained"
              className="bg-red-600 rounded-l-full rounded-r-full py-4 mt-3"
              onPress={() => {
                limpiarFormulario();
                router.back();
              }}
              disabled={loading}
            >
              <Text className="text-white text-lg text-center">Cancelar</Text>
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
    overflow: "visible",
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
    zIndex: 10,
  },
  removeText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 22,
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  uploadText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
    textAlign: "center",
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
    borderColor: "#27AA4E",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1f2937",
    minHeight: 80,
    textAlignVertical: "top",
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
  },
});

export default VenderScreen;