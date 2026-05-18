import { Icon } from '@iconify/react'
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from './ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <Icon
                icon="solar:danger-triangle-bold-duotone"
                className="mx-auto text-error"
                height={64}
              />
            </div>

            <h1 className="text-2xl font-bold text-dark mb-2">Terjadi Kesalahan</h1>

            <p className="text-bodytext mb-6">
              Maaf, terjadi kesalahan saat memuat halaman ini. Silakan coba refresh atau kembali ke
              halaman sebelumnya.
            </p>

            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-bodytext hover:text-dark">
                  Detail Error
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={() => window.history.back()} variant="outline" className="gap-2">
                <Icon icon="solar:arrow-left-line-duotone" height={18} />
                Kembali
              </Button>

              <Button onClick={this.handleReset} className="gap-2">
                <Icon icon="solar:refresh-bold" height={18} />
                Refresh Halaman
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
