import { lazy } from 'react';
import { useAuthAxios } from './hooks/useAuthAxios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';

const queryClient = new QueryClient();
const AppRouterProvider = lazy(() => import('./routes/AppRouterProvider'));

function App() {
  // Initialize auth axios interceptor
  useAuthAxios();

  return (
    <QueryClientProvider client={queryClient}>
      <AppRouterProvider />
      <Toaster />
      <SonnerToaster />
    </QueryClientProvider>
  );
}

export default App;
