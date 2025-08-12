import React from 'react';
import { View, Image } from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { PaymentLogos } from '../config/assets';

interface CardLogoProps {
  width?: number;
  height?: number;
}

export const VisaLogo: React.FC<CardLogoProps> = ({ width = 40, height = 24 }) => (
  <Image 
    source={PaymentLogos.visa} 
    style={{ width, height, resizeMode: 'contain' }}
  />
);

export const MastercardLogo: React.FC<CardLogoProps> = ({ width = 40, height = 24 }) => (
  <Image 
    source={PaymentLogos.mastercard} 
    style={{ width, height, resizeMode: 'contain' }}
  />
);

export const AmexLogo: React.FC<CardLogoProps> = ({ width = 40, height = 24 }) => (
  <Image 
    source={PaymentLogos.amex} 
    style={{ width, height, resizeMode: 'contain' }}
  />
);

export const DiscoverLogo: React.FC<CardLogoProps> = ({ width = 40, height = 24 }) => (
  <Svg width={width} height={height} viewBox="0 0 40 24" fill="none">
    <Rect width="40" height="24" rx="4" fill="#FF6000"/>
    <Path
      d="M8 9h2.5c1.2 0 2.2 1 2.2 2.2v.6c0 1.2-1 2.2-2.2 2.2H8V9zm1.2 1v3h1.3c.6 0 1-.4 1-1v-.6c0-.6-.4-1-1-1H9.2zm4.3-1h1.5v5h-1.5V9zm2.5 0h1.5l1 2 1-2h1.5l-1.5 2.5 1.5 2.5h-1.5l-1-2-1 2h-1.5l1.5-2.5L16 9zm8 1.2c0-.4-.3-.7-.7-.7s-.7.3-.7.7.3.7.7.7.7-.3.7-.7z"
      fill="white"
    />
    <Circle cx="32" cy="12" r="4" fill="#FF6000" opacity="0.7"/>
  </Svg>
);

export const ApplePayLogo: React.FC<CardLogoProps> = ({ width = 40, height = 24 }) => (
  <Image 
    source={PaymentLogos.apple} 
    style={{ width, height, resizeMode: 'contain' }}
  />
);

export const GooglePayLogo: React.FC<CardLogoProps> = ({ width = 40, height = 24 }) => (
  <Image 
    source={PaymentLogos.gpay} 
    style={{ width, height, resizeMode: 'contain' }}
  />
);

export const StripeLogo: React.FC<CardLogoProps> = ({ width = 40, height = 24 }) => (
  <Image 
    source={PaymentLogos.stripe} 
    style={{ width, height, resizeMode: 'contain' }}
  />
);

export const GenericCardLogo: React.FC<CardLogoProps> = ({ width = 40, height = 24 }) => (
  <Svg width={width} height={height} viewBox="0 0 40 24" fill="none">
    <Rect width="40" height="24" rx="4" fill="#6B7280" stroke="#D1D5DB" strokeWidth="1"/>
    <Rect x="4" y="6" width="32" height="2" fill="#9CA3AF"/>
    <Rect x="4" y="10" width="8" height="1.5" fill="#9CA3AF"/>
    <Rect x="4" y="12" width="12" height="1.5" fill="#9CA3AF"/>
    <Rect x="28" y="16" width="8" height="2" fill="#9CA3AF"/>
  </Svg>
);

interface CardTypeLogoProps extends CardLogoProps {
  cardType: string | null;
}

export const CardTypeLogo: React.FC<CardTypeLogoProps> = ({ cardType, width, height }) => {
  switch (cardType) {
    case 'visa':
      return <VisaLogo width={width} height={height} />;
    case 'mastercard':
      return <MastercardLogo width={width} height={height} />;
    case 'amex':
    case 'american express':
      return <AmexLogo width={width} height={height} />;
    case 'discover':
      return <DiscoverLogo width={width} height={height} />;
    case 'applepay':
    case 'apple pay':
      return <ApplePayLogo width={width} height={height} />;
    case 'googlepay':
    case 'google pay':
      return <GooglePayLogo width={width} height={height} />;
    case 'stripe':
      return <StripeLogo width={width} height={height} />;
    default:
      return <GenericCardLogo width={width} height={height} />;
  }
};