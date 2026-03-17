import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';

// Decode GitHub Pages SPA redirect
if (typeof window !== 'undefined' && window.location.search) {
  const params = new URLSearchParams(window.location.search);
  const p = params.get('q') || params.get('p');
  if (p || window.location.hash) {
    const pPath = p ? (p.startsWith('/') ? p : '/' + p) : '';
    const qStr = params.get('q') ? '?' + params.get('q').replace(/~and~/g, '&') : '';
    const hashStr = window.location.hash || '';
    
    if (pPath || qStr || hashStr) {
      window.history.replaceState(null, null, 
        window.location.pathname + pPath + qStr + hashStr
      );
    }
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <AppNavigator />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
