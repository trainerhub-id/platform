import { Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { ensureWorkspaceAxiosInterceptor } from './api/workspace-axios'
import { BetterAuthProvider } from './lib/better-auth'

ensureWorkspaceAxiosInterceptor()
import '../src/css/globals.css'
import App from './App.tsx'
import { Loading } from './components/ui/loading.tsx'
import { CustomizerContextProvider } from './context/CustomizerContext.tsx'
import './utils/i18n.ts'

void import('react-grab').catch((error) => {
  console.warn('Failed to load react-grab', error)
})

// MSW disabled - using real API
// async function deferRender() {
//   const { worker } = await import("./api/mocks/browser.ts");
//   return worker.start({
//     onUnhandledRequest: 'bypass',
//   });
// }

createRoot(document.getElementById('root')!).render(
  <BetterAuthProvider>
    <CustomizerContextProvider>
      <Suspense fallback={<Loading fullPage />}>
        <App />
      </Suspense>
    </CustomizerContextProvider>
  </BetterAuthProvider>,
)
