// src/app/_layout.tsx
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from '@/components/state';
import App from './App';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Provider>
        <App />
      </Provider>
    </SafeAreaProvider>
  );
}