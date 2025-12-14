interface AuthErrorProps {
  error: string
}

export default function AuthError({ error }: AuthErrorProps) {
  return (
    <div className="flex items-center justify-center h-screen bg-dark-bg">
      <div className="text-center max-w-sm mx-auto p-6">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-red-400 mb-2">Authentication Failed</h1>
        <p className="text-gray-400 mb-6">{error}</p>
        <div className="bg-dark-card p-4 rounded-lg border border-dark-border text-left text-sm text-gray-300">
          <p className="mb-2">
            <strong>For development:</strong> This app must be opened from within Telegram as a mini-app.
          </p>
          <p>
            <strong>Test link:</strong> Ask your admin for the mini-app deep link to test properly.
          </p>
        </div>
      </div>
    </div>
  )
}
