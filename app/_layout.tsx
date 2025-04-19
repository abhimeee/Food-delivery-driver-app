import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // TODO: Check authentication status
    // For now, we'll just set a timeout to simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      // TODO: Set isAuthenticated based on actual auth check
      setIsAuthenticated(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack>
      {!isAuthenticated ? (
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
          }}
        />
      ) : (
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
      )}
    </Stack>
  );
}
