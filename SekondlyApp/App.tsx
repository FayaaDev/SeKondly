import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/lib/queryClient';
import AppNavigator from './src/navigation/AppNavigator';
import { NotificationSetup } from './src/components/NotificationSetup';
import NotificationService from './src/services/NotificationService';

export default function App() {
  useEffect(() => {
    // Initialize notification service when app starts
    console.log('Initializing notification service...');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppNavigator />
      <NotificationSetup />
    </QueryClientProvider>
  );
}
