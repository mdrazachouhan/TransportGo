import { Stack } from 'expo-router';
import React from 'react';

export default function DriverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="requests" />
      <Stack.Screen name="active-ride" />
    </Stack>
  );
}
