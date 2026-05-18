import { lazy, Suspense } from 'react'

const MuxPlayer = lazy(() => import('@mux/mux-player-react'))

interface LazyMuxPlayerProps {
  [key: string]: unknown
}

const LazyMuxPlayer = (props: LazyMuxPlayerProps) => {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-xs opacity-70">Loading video player...</span>
        </div>
      }
    >
      <MuxPlayer {...(props as any)} />
    </Suspense>
  )
}

export default LazyMuxPlayer
