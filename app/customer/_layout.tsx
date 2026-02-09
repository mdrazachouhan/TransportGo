import { Stack } from 'expo-router';
import React from 'react';

export default function CustomerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="new-booking" />
      <Stack.Screen name="track-ride" />
      <Stack.Screen name="history" />
    </Stack>
  );
}
