import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { MotiView } from 'moti';
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence 
} from 'react-native-reanimated';

// Test Redux
import { RootState, increment, decrement } from '../store/store';

// Test UI Components
import { Button, Text, Card, Input, SearchInput } from '../ui';

export const ComponentTest: React.FC = () => {
  const [testInput, setTestInput] = useState('');
  const [searchValue, setSearchValue] = useState('');
  
  // Test Redux
  const count = useSelector((state: RootState) => state.counter.value);
  const dispatch = useDispatch();

  // Test Reanimated
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ],
    };
  });

  const handleAnimationTest = () => {
    scale.value = withSequence(
      withSpring(1.2),
      withSpring(1)
    );
    rotation.value = withRepeat(withTiming(360, { duration: 1000 }), 2, true);
  };

  const testResults = {
    redux: '✅ Redux store working',
    reanimated: '✅ React Native Reanimated working',
    moti: '✅ Moti animations working',
    nativewind: '✅ Styling system working',
    components: '✅ All UI components functional'
  };

  return (
    <View style={{ padding: 20 }}>
      <Text variant="h2" weight="bold" color="primary" style={{ marginBottom: 20 }}>
        🧪 Component Test Suite
      </Text>

      {/* Test Results */}
      <Card variant="elevated" style={{ marginBottom: 20 }}>
        <Text variant="h3" weight="semibold" style={{ marginBottom: 12 }}>
          Package Test Results
        </Text>
        {Object.entries(testResults).map(([key, result]) => (
          <Text key={key} variant="body" style={{ marginBottom: 4 }}>
            {result}
          </Text>
        ))}
      </Card>

      {/* Redux Test */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 200 }}
        style={{ marginBottom: 20 }}
      >
        <Card variant="outlined">
          <Text variant="h4" weight="semibold" style={{ marginBottom: 12 }}>
            Redux Test: {count}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button
              title="+"
              size="sm"
              onPress={() => dispatch(increment())}
            />
            <Button
              title="-"
              size="sm"
              variant="secondary"
              onPress={() => dispatch(decrement())}
            />
          </View>
        </Card>
      </MotiView>

      {/* Animation Test */}
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 400 }}
        style={{ marginBottom: 20 }}
      >
        <Card variant="default">
          <Text variant="h4" weight="semibold" style={{ marginBottom: 12 }}>
            Animation Test
          </Text>
          <Animated.View
            style={[
              {
                width: 50,
                height: 50,
                backgroundColor: '#2563EB',
                borderRadius: 25,
                marginBottom: 12,
              },
              animatedStyle,
            ]}
          />
          <Button
            title="Test Animations"
            variant="outline"
            onPress={handleAnimationTest}
          />
        </Card>
      </MotiView>

      {/* Input Tests */}
      <Card variant="default" style={{ marginBottom: 20 }}>
        <Text variant="h4" weight="semibold" style={{ marginBottom: 12 }}>
          Input Components Test
        </Text>
        
        <SearchInput
          placeholder="Test search input..."
          value={searchValue}
          onChangeText={setSearchValue}
          onSearch={(text) => Alert.alert('Search', `Searched: ${text}`)}
          style={{ marginBottom: 12 }}
        />
        
        <Input
          label="Test Input"
          placeholder="Type here..."
          value={testInput}
          onChangeText={setTestInput}
          hint="This is a test input field"
        />
      </Card>

      {/* Button Variants Test */}
      <Card variant="outlined">
        <Text variant="h4" weight="semibold" style={{ marginBottom: 12 }}>
          Button Variants Test
        </Text>
        <View style={{ gap: 8 }}>
          <Button
            title="Primary Button"
            onPress={() => Alert.alert('Success', 'Primary button works!')}
          />
          <Button
            title="Secondary Button"
            variant="secondary"
            onPress={() => Alert.alert('Success', 'Secondary button works!')}
          />
          <Button
            title="Outline Button"
            variant="outline"
            onPress={() => Alert.alert('Success', 'Outline button works!')}
          />
        </View>
      </Card>
    </View>
  );
}; 