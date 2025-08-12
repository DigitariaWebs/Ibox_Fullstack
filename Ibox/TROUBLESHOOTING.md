# Troubleshooting Guide

## Common Issues and Solutions

### ❌ Error: "Invalid hook call. Hooks can only be called inside the body of a function component"

**Problem**: This error typically occurs when you have multiple versions of React in your project, breaking the Rules of Hooks.

**Error Messages**:
```
ERROR  Invalid hook call. Hooks can only be called inside of the body of a function component.
ERROR  Warning: TypeError: Cannot read property 'useContext' of null
```

**Root Cause**: Multiple React versions in the dependency tree. In our case, Moti's framer-motion dependency was pulling in React 19.1.0 while other packages used React 19.0.0.

**Solution**: Add version overrides to `package.json` to force all React packages to use the same version:

```json
{
  "dependencies": {
    "@reduxjs/toolkit": "^2.5.0",
    "expo": "~53.0.13",
    "moti": "^0.31.0",
    "nativewind": "^4.1.28",
    "react": "19.0.0",
    "react-native": "0.79.4",
    "react-native-reanimated": "~3.16.1",
    "react-redux": "^9.1.2"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.17"
  },
  "overrides": {
    "react": "19.0.0",
    "react-dom": "19.0.0"
  }
}
```

**Step-by-step fix**:
1. Add the `overrides` section to your `package.json`
2. Clean your installation:
   ```bash
   # Windows PowerShell
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json
   npm cache clean --force
   npm install
   ```
3. Verify all React versions match:
   ```bash
   npm ls react
   ```
   You should see `react@19.0.0 deduped` for all packages.

### ❌ Error: ".plugins is not a valid Plugin property" 

**Problem**: This error occurs with NativeWind v4 when `nativewind/babel` is incorrectly configured as a plugin instead of a preset.

**Error Message**:
```
ERROR index.ts: [BABEL] .plugins is not a valid Plugin property
```

**Solution**: Move `nativewind/babel` from plugins to presets in `babel.config.js`:

```js
// ❌ Wrong - NativeWind v4 doesn't work as a plugin
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel', // ← This causes the error
      'react-native-reanimated/plugin',
    ],
  };
};

// ✅ Correct - NativeWind v4 should be a preset
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      'nativewind/babel' // ← Move it here
    ],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};
```

### ❌ Error: "Tailwind CSS has not been configured with the NativeWind preset"

**Solution**: Add the NativeWind preset to your `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require('nativewind/preset')], // ← This line is required!
  theme: {
    extend: {
      // your custom theme
    },
  },
  plugins: [],
}
```

### ❌ Error: TypeScript errors with className prop

**Solution**: Our template uses style objects instead of className for better compatibility:

```tsx
// ❌ Don't use className directly on React Native components
<View className="bg-blue-500 p-4">

// ✅ Use our styled components instead
<Card variant="elevated" padding="md">
```

### ❌ Error: Animation performance issues

**Solution**: Use `useAnimatedStyle` and shared values for better performance:

```tsx
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const scale = useSharedValue(1);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }]
}));
```

### ❌ Error: Package compatibility issues

**Solution**: Our template includes tested versions of all packages:

- ✅ Expo ~53.0.13
- ✅ React Native 0.79.4  
- ✅ NativeWind v4 (latest)
- ✅ Moti 0.31.0
- ✅ React Native Reanimated 3.16.1
- ✅ Redux Toolkit 2.5.0

## Development Commands

```bash
# Check TypeScript errors
npx tsc --noEmit

# Start with cache cleared
npx expo start --clear

# Reset Metro cache
npx expo start --reset-cache

# Check for package vulnerabilities
npm audit

# Update packages (be careful!)
npx expo install --fix
```

## Configuration Checklist

### ✅ Required Files

- [ ] `tailwind.config.js` - with NativeWind preset
- [ ] `babel.config.js` - with nativewind/babel preset (NOT plugin)
- [ ] `metro.config.js` - with withNativeWind wrapper
- [ ] `global.css` - with @tailwind directives
- [ ] `tsconfig.json` - TypeScript configuration

### ✅ Correct babel.config.js for NativeWind v4

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      'nativewind/babel'  // ← As a preset, not plugin
    ],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};
```

### ✅ Package.json Dependencies

```json
{
  "dependencies": {
    "@reduxjs/toolkit": "^2.5.0",
    "expo": "~53.0.13",
    "moti": "^0.31.0",
    "nativewind": "^4.1.28",
    "react": "19.0.0",
    "react-native": "0.79.4",
    "react-native-reanimated": "~3.16.1",
    "react-redux": "^9.1.2"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.17"
  },
  "overrides": {
    "react": "19.0.0",
    "react-dom": "19.0.0"
  }
}
```

## NativeWind v4 Breaking Changes

**Important**: NativeWind v4 introduced breaking changes from v2:

1. **Babel Configuration**: Use as preset, not plugin
2. **Tailwind Configuration**: Requires `presets: [require('nativewind/preset')]`
3. **Metro Configuration**: Must use `withNativeWind` wrapper
4. **TypeScript**: Better to use style objects than className

## Platform-Specific Issues

### iOS
- Make sure Xcode is updated
- Clear derived data if builds fail
- Check iOS deployment target compatibility

### Android
- Ensure Android SDK is updated
- Check Gradle wrapper version
- Clear Gradle cache if needed

### Web
- NativeWind v4 works with React Native Web 0.18+
- Some animations may behave differently on web

## Performance Tips

1. **Use React.memo()** for expensive components
2. **Optimize images** with proper sizing
3. **Use FlatList** for long lists instead of ScrollView
4. **Profile with Flipper** for debugging performance issues
5. **Enable Hermes** for better JavaScript performance

## Getting Help

1. Check the [NativeWind Documentation](https://www.nativewind.dev/)
2. Review [Expo Documentation](https://docs.expo.dev/)
3. Search existing issues on GitHub
4. Use the template's test components to verify functionality

## Template Test Status

- ✅ Redux store working
- ✅ React Native Reanimated working  
- ✅ Moti animations working
- ✅ Styling system working
- ✅ All UI components functional
- ✅ TypeScript compilation successful
- ✅ Development server running
- ✅ NativeWind v4 properly configured 

## Enhanced Button Animation Features 🎯

### **Animation Types**

1. **Press Animations**:
   - Scale down to 0.95 on press with spring physics
   - Border radius animation (8px → 12px)
   - Background color interpolation
   - Success bounce animation (1.05 scale) on release

2. **Loading Animations**:
   - Rotating spinner with Moti
   - Pulse animation during loading state
   - Color-matched loading indicators

3. **Haptic Feedback**:
   - Real device vibration using expo-haptics
   - Medium impact feedback on press
   - Graceful fallback for unsupported devices

4. **Glow Effects**:
   - Dynamic shadow animations
   - Color-matched shadows (primary/secondary)
   - Press-responsive glow intensity

5. **State Animations**:
   - Smooth disabled state transitions (0.5 opacity)
   - Loading state with pulse effects
   - Color interpolation for all variants

### **Button Props**

```tsx
interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  hapticFeedback?: boolean;    // Default: true
  pulseOnLoad?: boolean;       // Default: true
  glowEffect?: boolean;        // Default: false
}
```

### **Usage Examples**

```tsx
// Basic animated button
<Button title="Press Me" variant="primary" />

// Button with glow effect
<Button 
  title="Glowing Button" 
  variant="primary" 
  glowEffect={true} 
/>

// Loading button with pulse
<Button 
  title="Loading..." 
  variant="secondary" 
  loading={true}
  pulseOnLoad={true}
/>

// Button without haptic feedback
<Button 
  title="Silent Button" 
  variant="outline" 
  hapticFeedback={false}
/>
```

### **Animation Details**

- **Spring Physics**: Damping: 15, Stiffness: 300
- **Color Transitions**: 150ms press, 200ms release
- **Loading Pulse**: 1000ms duration, infinite repeat
- **Glow Animation**: 200ms transition timing
- **Haptic**: Medium impact feedback

## General Troubleshooting Steps

1. **Clean installation**:
   ```bash
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json
   npm cache clean --force
   npm install
   ```

2. **Restart development server**:
   ```bash
   npx expo start --clear
   ```

3. **Check for version conflicts**:
   ```bash
   npm ls react
   npm ls react-native
   ```

4. **Restart IDE**: Sometimes VSCode needs a restart to pick up changes.

## Verified Working Configuration

- **Expo**: ~53.0.13
- **React**: 19.0.0 (with overrides)
- **React Native**: 0.79.4
- **NativeWind**: ^4.1.23 (as preset)
- **Moti**: ^0.30.0
- **React Native Reanimated**: ~3.17.4
- **Redux Toolkit**: ^2.8.2
- **Expo Haptics**: Latest

This configuration has been tested and works without any hook or compilation errors. 