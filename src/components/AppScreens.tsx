import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

/**
 * Loading screen shown while Redux persist is rehydrating state.
 */
export const PersistLoadingScreen: React.FC = () => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#0F172A",
    }}
  >
    <ActivityIndicator size="large" color="#ffffff" />
    <Text style={{ color: "#ffffff", marginTop: 16, fontSize: 16 }}>
      Loading PG Management...
    </Text>
  </View>
);

/**
 * Fatal error screen shown when app initialization fails.
 */
export const AppErrorScreen: React.FC<{
  error: string;
  onRetry: () => void;
}> = ({ error, onRetry }) => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f5f5f5",
      padding: 20,
    }}
  >
    <Text
      style={{
        fontSize: 24,
        fontWeight: "bold",
        color: "#dc2626",
        marginBottom: 16,
        textAlign: "center",
      }}
    >
      App Error
    </Text>
    <Text
      style={{
        fontSize: 14,
        color: "#666",
        marginBottom: 20,
        textAlign: "center",
      }}
    >
      {error}
    </Text>
    <TouchableOpacity
      onPress={onRetry}
      style={{
        backgroundColor: "#3B82F6",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
        Retry
      </Text>
    </TouchableOpacity>
  </View>
);
