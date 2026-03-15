import { AntDesign } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  PressableProps,
  Text,
  TextInput,
  View,
} from 'react-native';

interface Props extends PressableProps {
  children?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'tertiary' | 'quaternary' | 'quinary' | 'sextary' | 'gray';
  className?: string;
  variant?:
    | 'contained'
    | 'text-only'
    | 'card'
    | 'icon-only'
    | 'desplegar'
    | 'card-center'
    | 'chat-card'
    | 'chat-bubble'
    | 'chat-input';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right' | 'up' | 'down' | 'center';
  price?: string;
  FontText?: string;
  onCartPress?: () => void;
  actionText?: string;
  underline?: boolean;
  showFavorite?: boolean;
  isOwner?: boolean;
  options?: string[];
  message?: string;
  placeholder?: string;
  onSelect?: (value: string) => void;
  source?: ImageSourcePropType;
  defaultImage?: ImageSourcePropType;

  imageAspectRatio?: number;
  minCardHeight?: number;
  onSendMessage?: (message: string) => void;

  // NUEVO: valor controlado opcional
  value?: string;
}

const CustomButton = React.forwardRef<View, Props>(
  (
    {
      children,
      message,
      color = 'gray',
      onCartPress,
      onPress,
      onLongPress,
      className,
      variant = 'contained',
      icon,
      iconPosition = 'left',
      source,
      price,
      FontText,
      defaultImage,
      actionText,
      underline,
      showFavorite,
      isOwner = false,
      options = [],
      placeholder = 'Selecciona...',
      onSelect,
      onSendMessage,
      style,
      imageAspectRatio = 16 / 9,
      minCardHeight = 120,
      value,
      ...rest
    },
    ref
  ) => {
    const [isFavorite, setIsFavorite] = React.useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [selected, setSelected] = useState('');
    const [inputMessage, setInputMessage] = useState('');

    // Sincroniza el estado interno con el valor externo
    useEffect(() => {
      if (variant === 'desplegar') {
        setSelected(value ?? '');
      }
    }, [value, variant]);

    const textColor = {
      primary: 'text-primary-90',
      secondary: 'text-secondary-500',
      tertiary: 'text-tertiary-900',
      quaternary: 'text-quaternary-50',
      quinary: 'text-quinary-50',
      sextary: 'text-sextary-900',
      gray: 'text-gray',
    }[color];

    const btnColor = {
      primary: 'bg-primary-400',
      secondary: 'bg-secondary-950',
      tertiary: 'bg-tertiary-50',
      quaternary: 'bg-quaternary-700',
      quinary: 'bg-quinary-600',
      sextary: 'bg-sextary-400',
      gray: 'bg-gray-100',
    }[color];

    const textOnlyColor = {
      primary: 'text-primary-90',
      secondary: 'text-secondary-500',
      tertiary: 'text-tertiary-900',
      quaternary: 'text-quaternary-600',
      quinary: 'text-quinary-600',
      sextary: 'text-sextary-90',
      gray: 'text-gray',
    }[color];

    const Content = () => {
      const effectiveTextColor =
        variant === 'text-only' ? textOnlyColor : textColor;

      if (variant === 'card' && price) {
        return (
          <>
            <View className="flex-row items-center justify-center">
              <Text
                numberOfLines={2}
                className={`text-center w-full ${textColor} ${FontText}`}
              >
                {children}
              </Text>
            </View>

            <View className="flex-row items-center justify-center">
              <Text className={`text-center text-sm ${textColor} ${FontText}`}>
                {price}
              </Text>
            </View>
          </>
        );
      }

      return (
        <View
          className={`flex-row items-center justify-center ${
            icon && iconPosition === 'right' ? 'flex-row-reverse' : ''
          }`}
        >
          {icon && <View className="mr-2">{icon}</View>}
          <Text
            className={`text-center ${effectiveTextColor} ${
              underline ? 'underline' : ''
            } ${FontText}`}
          >
            {children}
          </Text>
        </View>
      );
    };

    const openCamera = async () => {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
      });

      if (!result.canceled) {
        console.log('Imagen cámara:', result.assets[0].uri);
      }
    };

    const openGallery = async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled) {
        console.log('Imagen galería:', result.assets[0].uri);
      }
    };

    if (variant === 'text-only') {
      return (
        <Pressable
          ref={ref}
          className={`p-3 ${className} ${textOnlyColor} active:opacity-70`}
          onPress={onPress}
          onLongPress={onLongPress}
          style={style}
          {...rest}
        >
          <Content />
        </Pressable>
      );
    } else if (variant === 'card') {
      return (
        <Pressable
          ref={ref}
          className={`p-3 rounded-md w-full ${btnColor} active:opacity-90 ${className} border border-gray-200`}
          onPress={onPress}
          onLongPress={onLongPress}
          style={style}
          {...rest}
        >
          <Image
            resizeMode="cover"
            style={{
              width: '100%',
              height: 150,
              overflow: 'hidden',
              borderRadius: 8,
              marginBottom: 8,
            }}
            source={
              typeof source === 'string'
                ? { uri: source }
                : source || defaultImage
            }
          />

          <Content />
        </Pressable>
      );
    } else if (variant === 'card-center') {
      return (
        <Pressable
          ref={ref}
          className={`p-3 rounded-md w-full ${btnColor} active:opacity-90 ${className} border border-gray-200 overflow-hidden`}
          onPress={onPress}
          onLongPress={onLongPress}
          style={style}
          {...rest}
        >
          <View
            style={{ minHeight: minCardHeight }}
            className="items-center justify-center"
          >
            <Text
              className={`text-center ${textColor} ${FontText ?? ''} ${
                underline ? 'underline' : ''
              }`}
            >
              {children}
            </Text>
          </View>
        </Pressable>
      );
    } else if (variant === 'icon-only') {
      return (
        <Pressable
          ref={ref}
          className={`p-3 ${className} ${textColor} active:opacity-70 rounded-full ${btnColor}`}
          onPress={onPress}
          onLongPress={onLongPress}
          style={style}
          {...rest}
        >
          <View className="flex items-center justify-center">{icon}</View>
        </Pressable>
      );
    } else if (variant === 'desplegar') {
      const textoMostrado = selected || value || placeholder;

      return (
        <View className="w-full">
          <Pressable
            onPress={() => setShowOptions(!showOptions)}
            className={`p-3 rounded-lg bg-white border border-sextary-600 ${className}`}
            style={style}
            {...rest}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-black text-lg font-semibold">
                {textoMostrado}
              </Text>
              <AntDesign
                name={showOptions ? 'up' : 'down'}
                size={18}
                color="black"
              />
            </View>
          </Pressable>

          {showOptions && (
            <View className="bg-gray mt-1 rounded-lg border border-black-500 p-2">
              {options.map((item, index) => (
                <Pressable
                  key={`${item}-${index}`}
                  onPress={() => {
                    setSelected(item);
                    setShowOptions(false);
                    onSelect?.(item);
                  }}
                  className="p-2 rounded-lg active:bg-[#c7dfe6]"
                >
                  <Text className="text-black text-base">{item}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      );
    } else if (variant === 'chat-card') {
      return (
        <Pressable
          ref={ref}
          onPress={onPress}
          className={`
            flex-row items-center
            bg-[#E5E5E5]
            border border-sextary-600
            rounded-xl
            px-3 py-3
            mb-3
            mx-3
            active:opacity-80
            ${className}
          `}
          style={style}
          {...rest}
        >
          <View className="w-12 h-12 rounded-full border-2 border-sextary-600 items-center justify-center mr-3">
            <AntDesign name="user" size={26} color="#2FBF2F" />
          </View>

          <View className="flex-1">
            <Text className="font-semibold text-black text-base">
              {children}
            </Text>

            {actionText && (
              <Text className="text-gray-600 text-sm mt-1" numberOfLines={1}>
                {actionText}
              </Text>
            )}
          </View>
        </Pressable>
      );
    } else if (variant === 'chat-bubble') {
      return (
        <Pressable
          ref={ref}
          onPress={onPress}
          onLongPress={onLongPress}
          {...rest}
        >
          <View
            style={{
              alignSelf: isOwner ? 'flex-end' : 'flex-start',
              backgroundColor: isOwner ? '#D0F0C0' : '#E0E0E0',
              padding: 10,
              borderRadius: 12,
              maxWidth: '70%',
              marginVertical: 4,
            }}
          >
            <Text style={{ color: '#000', fontSize: 15 }}>
              {message ?? children}
            </Text>
          </View>
        </Pressable>
      );
    } else if (variant === 'chat-input') {
      return (
        <View
          className="
            flex-row items-center
            px-3 py-2
            border-t border-gray-300
            bg-white
          "
        >
          <Pressable onPress={openCamera} className="p-2">
            <AntDesign name="camera" size={22} color="#2FBF2F" />
          </Pressable>

          <Pressable onPress={openGallery} className="p-2">
            <AntDesign name="picture" size={22} color="#2FBF2F" />
          </Pressable>

          <TextInput
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Escribe un mensaje..."
            className="
              flex-1
              bg-gray-100
              rounded-full
              px-4 py-2
              mx-2
              text-base
            "
          />

          <Pressable
            onPress={() => {
              if (!inputMessage.trim()) return;
              onSendMessage?.(inputMessage);
              setInputMessage('');
            }}
            className="p-2"
          >
            <AntDesign name="arrow-up" size={22} color="#2FBF2F" />
          </Pressable>
        </View>
      );
    }

    return (
      <Pressable
        ref={ref}
        className={`p-3 rounded-md flex-auto ${btnColor} active:opacity-90 ${className}`}
        onPress={onPress}
        onLongPress={onLongPress}
        style={style}
        {...rest}
      >
        <Content />
      </Pressable>
    );
  }
);

export default CustomButton;