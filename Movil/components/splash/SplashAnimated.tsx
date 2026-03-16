import LottieView from "lottie-react-native";
import React, { useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet } from "react-native";

type Props = {
  onFinish?: () => void;
};

const { width } = Dimensions.get("window");

export default function SplashAnimated({ onFinish }: Props) {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleAnimationFinish = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 700,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      onFinish?.();
    });
  };

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
          backgroundColor: "#2DC75C",
        },
      ]}
    >
      <LottieView
        source={require("../../assets/animations/splash-sena.json")}
        autoPlay
        loop={false}
        onAnimationFinish={handleAnimationFinish}
        style={{ width: 780, height: 780 }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
});