// src/components/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react'
import { QueryErrorResetBoundary } from '@tanstack/react-query'

/**
 * Props and State types
 */
type ErrorBoundaryProps = {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

/**
 * React Error Boundary Class Component
 *
 * Required because error boundaries must be class components
 */
class ErrorBoundaryClass extends Component<
  ErrorBoundaryProps & { onReset?: () => void },
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps & { onReset?: () => void }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    console.error('Error caught by boundary:', error, errorInfo)

    // Example: Send to Sentry, LogRocket, etc.
    // Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  handleReset = () => {
    // Call TanStack Query reset if provided
    this.props.onReset?.()

    // Reset error boundary state
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset)
      }

      // Default error UI
      return (
        <div className="p-8 border-2 border-red-500 rounded-lg bg-red-50">
          <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
          <details className="whitespace-pre-wrap mt-4">
            <summary className="font-semibold cursor-pointer">Error details</summary>
            <div className="mt-2 text-sm">
              {this.state.error.message}
            </div>
            {this.state.error.stack && (
              <pre className="mt-4 text-sm bg-black/5 p-4 rounded overflow-auto">
                {this.state.error.stack}
              </pre>
            )}
          </details>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Error Boundary with TanStack Query Reset
 *
 * Wraps components and catches errors thrown by queries
 * with throwOnError: true
 */
export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundaryClass onReset={reset} fallback={fallback}>
          {children}
        </ErrorBoundaryClass>
      )}
    </QueryErrorResetBoundary>
  )
}

/**
 * Usage Examples
 */

// Example 1: Wrap entire app
export function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
}

// Example 2: Wrap specific features
export function UserProfileWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <UserProfile />
    </ErrorBoundary>
  )
}

// Example 3: Custom error UI
export function CustomErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="error-container">
          <h1>Oops!</h1>
          <p>We encountered an error: {error.message}</p>
          <button onClick={reset}>Retry</button>
          <a href="/">Go Home</a>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Using throwOnError with Queries
 *
 * Queries can throw errors to error boundaries
 */
import { useQuery } from '@tanstack/react-query'

// Example 1: Always throw errors
function UserData({ id }: { id: number }) {
  const { data } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await fetch(`/api/users/${id}`)
      if (!response.ok) throw new Error('User not found')
      return response.json()
    },
    throwOnError: true, // Throw to error boundary
  })

  return <div>{data.name}</div>
}

// Example 2: Conditional throwing (only server errors)
function ConditionalErrorThrowing({ id }: { id: number }) {
  const { data } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await fetch(`/api/users/${id}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    },
    throwOnError: (error) => {
      // Only throw 5xx server errors to boundary
      // Handle 4xx client errors locally
      return error.message.includes('5')
    },
  })

  return <div>{data?.name ?? 'Not found'}</div>
}

/**
 * Multiple Error Boundaries (Layered)
 *
 * Place boundaries at different levels for granular error handling
 */
export function LayeredErrorBoundaries() {
  return (
    // App-level boundary
    <ErrorBoundary fallback={(error) => <AppCrashScreen error={error} />}>
      <Header />

      {/* Feature-level boundary */}
      <ErrorBoundary fallback={(error) => <FeatureError error={error} />}>
        <UserProfile />
      </ErrorBoundary>

      {/* Another feature boundary */}
      <ErrorBoundary>
        <TodoList />
      </ErrorBoundary>

      <Footer />
    </ErrorBoundary>
  )
}

/**
 * Key concepts:
 *
 * 1. QueryErrorResetBoundary: Provides reset function for TanStack Query
 * 2. throwOnError: Makes query throw errors to boundary
 * 3. Layered boundaries: Isolate failures to specific features
 * 4. Custom fallbacks: Control error UI per boundary
 * 5. Error logging: componentDidCatch for monitoring
 *
 * Best practices:
 * ✅ Always wrap app in error boundary
 * ✅ Use throwOnError for critical errors only
 * ✅ Provide helpful error messages to users
 * ✅ Log errors to monitoring service
 * ✅ Offer reset/retry functionality
 * ❌ Don't catch all errors - use local error states when appropriate
 * ❌ Don't throw for expected errors (404, validation)
 */
