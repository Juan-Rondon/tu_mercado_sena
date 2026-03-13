import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TextInput, View } from "react-native";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  avatar?: any;
  onAvatarPress?: () => void;
  placeholder?: string;
  className?: string;

  noOuterPadding?: boolean;
}

const SearchBar = ({
  value,
  onChangeText,
  avatar,
  onAvatarPress,
  placeholder,
  className,
  noOuterPadding = false,
}: Props) => {
  return (
    <View style={[styles.container, noOuterPadding && styles.containerNoPad]}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={{ marginRight: 8 }} />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || "Buscar productos..."}
          placeholderTextColor="#666"
          style={styles.input}
          className={className}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  // ✅ mismo componente, solo quita padding externo cuando ya lo pone la pantalla
  containerNoPad: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },

  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFEFEF",
    borderRadius: 25,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: "black",
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
});

export default SearchBar;
