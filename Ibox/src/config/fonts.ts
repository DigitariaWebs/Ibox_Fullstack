/**
 * Font families registered via `expo-font` & custom assets.
 * Update this list whenever new fonts are added.
 */
export const Fonts = {
  PlayfairDisplay: {
    Variable: 'PlayfairDisplay-Variable',
  },
  Roboto: {
    Variable: 'Roboto-Variable',
  },
  Montserrat: {
    Variable: 'Montserrat-Variable',
  },
  SFProDisplay: {
    Bold: 'SFProDisplay-Bold',
    Medium: 'SFProDisplay-Medium',
    Regular: 'SFProDisplay-Regular',
    ThinItalic: 'SFProDisplay-ThinItalic',
  },
  WayCome: {
    Regular: 'WayCome-Regular',
  },
  Cachet: {
    Medium: 'Cachet-Medium',
  },
};

export const fontAssets = {
  [Fonts.PlayfairDisplay.Variable]: require('../../assets/fonts/PlayfairDisplay/PlayfairDisplay-VariableFont_wght.ttf'),
  [Fonts.Roboto.Variable]: require('../../assets/fonts/Roboto/Roboto-VariableFont_wdth_wght.ttf'),
  [Fonts.Montserrat.Variable]: require('../../assets/fonts/Montserrat/Montserrat-VariableFont_wght.ttf'),
  [Fonts.SFProDisplay.Bold]: require('../../assets/fonts/SFProDisplay/SFProDisplay-Bold.otf'),
  [Fonts.SFProDisplay.Medium]: require('../../assets/fonts/SFProDisplay/SFProDisplay-Medium.otf'),
  [Fonts.SFProDisplay.Regular]: require('../../assets/fonts/SFProDisplay/SFProDisplay-Regular.otf'),
  [Fonts.SFProDisplay.ThinItalic]: require('../../assets/fonts/SFProDisplay/SFProDisplay-ThinItalic.otf'),
  [Fonts.WayCome.Regular]: require('../../assets/fonts/WayCome/WayCome.ttf'),
  [Fonts.Cachet.Medium]: require('../../assets/fonts/cachet/Cachet Std Medium.otf'),
};

export type FontFamily = keyof typeof Fonts;
export type FontVariant = keyof typeof Fonts[FontFamily]; 