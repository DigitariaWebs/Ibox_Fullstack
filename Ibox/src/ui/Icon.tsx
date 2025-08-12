import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { FontAwesome, MaterialIcons, Feather } from '@expo/vector-icons';
// If you want to add more icon sets, import them here
// import Hugeicons from 'react-native-vector-icons/Hugeicons';

export type IconType = 'FontAwesome' | 'MaterialIcons' | 'Feather'; // | 'Hugeicons';

export interface IconProps {
  name: string;
  type?: IconType;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export const Icon: React.FC<IconProps> = ({
  name,
  type = 'FontAwesome',
  size = 24,
  color = '#111827',
  style,
}) => {
  switch (type) {
    case 'FontAwesome':
      return <FontAwesome name={name as any} size={size} color={color} style={style} />;
    case 'MaterialIcons':
      return <MaterialIcons name={name as any} size={size} color={color} style={style} />;
    case 'Feather':
      return <Feather name={name as any} size={size} color={color} style={style} />;
    // case 'Hugeicons':
    //   return <Hugeicons name={name as any} size={size} color={color} style={style} />;
    default:
      return <View />;
  }
}; 