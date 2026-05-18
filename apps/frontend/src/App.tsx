import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy } from 'react'
import { Toaster as SonnerToaster } from 'sonner'
import { Toaster } from './components/ui/toaster'
import { useAuthAxios } from './hooks/useAuthAxios'

const queryClient = new QueryClient()
const AppRouterProvider = lazy(() => import('./routes/AppRouterProvider'))

function App() {
  // Initialize auth axios interceptor
  useAuthAxios()

  return (
    <QueryClientProvider client={queryClient}>
      <AppRouterProvider />
      <Toaster />
      <SonnerToaster />
    </QueryClientProvider>
  )
}

export default App
