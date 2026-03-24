import CustomButton from "@/components/buttons/CustomButton";
import WelcomeCarousel, { CarouselSlide } from "@/components/carousel/WelcomeCarousel";
import Header from "@/components/headers/Header";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const welcomeScreen = () => {
  const router = useRouter();
  const { height, width } = useWindowDimensions();

  const slides: CarouselSlide[] = [
    {
      id: "1",
      image: require("../../../assets/images/shopeeasy1.png"),
      title: "Compra fácil",
      description: "Encuentra productos y servicios dentro de la comunidad SENA.",
    },
    {
      id: "2",
      image: require("../../../assets/images/ventasecure.png"),
      title: "Vende seguro",
      description: "Publica tus productos y llega a más personas.",
    },
    {
      id: "3",
      image: require("../../../assets/images/conecta.png"),
      title: "Conecta",
      description: "Comunícate y negocia con confianza.",
    },
  ];

  const carouselHeight = Math.min(260, Math.max(200, height * 0.28));
  // const titleSize = 
  // width < 360 ? 32 : 
  // width < 420 ? 40 : 
  // 46;

  // Haz el header un poco más grande si lo sientes pequeño
  const headerHeight = Math.min(250, Math.max(240, height * 0.30));

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safe}>
    <StatusBar style="light" translucent />

    <View style={styles.root}>
      <Header
        variant="normal"
        color="sextary"
        txtColor="primary"
        showLogo
        height={headerHeight}
        radius={70}
        logoSize={130}
        titleSize={34}
        FontText="font-bold"
        style={styles.headerShadow}
      >
        <Text
          className="font-bold text-white text-center"
          style={{
            fontSize: 34,
            textShadowColor: "rgba(0,0,0,0.35)",
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 4,
          }}
          >
            Tu Mercado SENAA
        </Text>
      </Header>

        {/* Reservar espacio real del header absolute */}
        <View style={{ height: headerHeight }} />

        {/* Carrusel FULL WIDTH (sin padding) */}
        <View style={styles.carouselWrap}>
          <WelcomeCarousel slides={slides} height={carouselHeight} autoplayMs={3000} />
        </View>

        {/* Aquí sí aplica padding para botones */}
        <View style={styles.buttonsWrap}>
          <CustomButton
            variant="contained"
            className="w-full p-5 rounded-r-full rounded-l-full shadow-lg"
            color="tertiary"
            FontText="text-2xl"
            onPress={() => router.push("/(stack)/login")}
          >
            Iniciar Sesión
          </CustomButton>

          <CustomButton
            variant="contained"
            className="w-full p-5 rounded-r-full rounded-l-full shadow-lg border border-[#2DC75C]"
            color="sextary"
            FontText="text-2xl"
            onPress={() => router.push("/(stack)/register")}
          >
            Registrarme
          </CustomButton>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default welcomeScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },

  // Contenedor principal SIN padding
  root: { flex: 1, backgroundColor: "#ffffff", justifyContent: "space-between" },

  form: { flex: 1, paddingHorizontal: 24 },

  carouselWrap: { flex: 1, justifyContent: "center" },

  // Padding solo en botones
  buttonsWrap: { paddingHorizontal: 20, paddingBottom: 60, gap: 16 },

  headerShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 18, // Android
  },

});
