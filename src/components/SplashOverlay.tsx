import React from "react";
import { Animated, View } from "react-native";
import LottieView from "lottie-react-native";

/**
 * Animated splash overlay with Lottie animation.
 * Rendered on top of the app content and faded out once initialization is complete.
 */
export const SplashOverlay: React.FC<{
  visible: boolean;
  opacity: Animated.Value;
  onLayout: () => void;
}> = ({ visible, opacity, onLayout }) => (
  <Animated.View
    pointerEvents={visible ? "auto" : "none"}
    style={{
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: "#0F172A",
      justifyContent: "center",
      alignItems: "center",
      opacity,
    }}
    onLayout={onLayout}
  >
    <LottieView
      source={require("../../assets/ball-jump.json")}
      autoPlay
      loop
      style={{ width: 140, height: 140 }}
    />
  </Animated.View>
);
