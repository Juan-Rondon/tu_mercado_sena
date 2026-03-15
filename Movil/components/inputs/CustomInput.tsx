import { useAppTheme } from "@/src/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

interface Props extends Omit<TextInputProps, "onChangeText" | "value"> {
  type?: "text" | "password" | "email" | "number" | "string";
  className?: string;
  placeholder?: string;
  value?: string;
  placeholderTextColor?: string;
  onChangeText?: (text: string) => void;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  containerClassName?: string;
}

const CustomInput = ({
  type = "text",
  className,
  containerClassName,
  containerStyle,
  placeholder,
  value = "",
  placeholderTextColor,
  onChangeText,
  icon,
  showPasswordToggle = true,
  ...rest
}: Props) => {
  const { colors, isDark } = useAppTheme();

  const isPassword = type === "password";
  const isNumber = type === "number";
  const isEmail = type === "email";

  const [showPassword, setShowPassword] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const lastGoodValueRef = useRef<string>(value ?? "");
  const lastKeyRef = useRef<string | null>(null);

  const keyboardType = useMemo(() => {
    if (isNumber) return "numeric";
    if (isEmail) return "email-address";
    return "default";
  }, [isNumber, isEmail]);

  const autoCapitalize = isEmail ? "none" : rest.autoCapitalize ?? "sentences";

  const handleKeyPress: TextInputProps["onKeyPress"] = (e) => {
    lastKeyRef.current = e.nativeEvent.key;
    rest.onKeyPress?.(e);
  };

  const handleChangeText = (t: string) => {
    if (Platform.OS === "ios" && isPassword) {
      const prev = lastGoodValueRef.current;

      if (t === "" && prev.length > 1 && lastKeyRef.current === "Backspace") {
        const fixed = prev.slice(0, -1);

        inputRef.current?.setNativeProps({ text: fixed });

        lastGoodValueRef.current = fixed;
        onChangeText?.(fixed);
        return;
      }

      lastGoodValueRef.current = t;
      onChangeText?.(t);
      return;
    }

    lastGoodValueRef.current = t;
    onChangeText?.(t);
  };

  return (
    <View
      className={`flex-row items-center rounded-full px-4 ${className ?? ""} ${containerClassName ?? ""}`}
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? colors.surface ?? "#1E1E1E"
            : colors.surface ?? "#F5F5F7",
          borderColor: isDark
            ? colors.border ?? "#3A3A3C"
            : colors.border ?? "#D9D9D9",
        },
        containerStyle,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}

      <TextInput
        ref={inputRef}
        value={value ?? ""}
        onKeyPress={handleKeyPress}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor ?? colors.textMuted ?? (isDark ? "#A1A1AA" : "#6B7280")}
        secureTextEntry={isPassword ? !showPassword : false}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        spellCheck={false}
        cursorColor={colors.primary ?? "#2563EB"}
        selectionColor={colors.primary ?? "#2563EB"}
        textContentType={
          isPassword ? "none" : isEmail ? "emailAddress" : rest.textContentType
        }
        autoComplete={isPassword ? "off" : isEmail ? "email" : rest.autoComplete}
        style={[
          styles.input,
          {
            color: colors.text ?? (isDark ? "#FFFFFF" : "#111827"),
          },
        ]}
        {...rest}
      />

      {isPassword && showPasswordToggle && (
        <Pressable
          onPress={() => setShowPassword((p) => !p)}
          hitSlop={10}
          style={styles.eyeBtn}
        >
          <Ionicons
            name={showPassword ? "eye-outline" : "eye-off-outline"}
            size={20}
            color={colors.textMuted ?? (isDark ? "#A1A1AA" : "#6B7280")}
          />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    minHeight: 52,
  },
  iconContainer: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  eyeBtn: {
    paddingLeft: 10,
    paddingVertical: 6,
  },
});

export default CustomInput;