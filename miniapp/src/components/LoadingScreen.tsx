export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-dark-bg">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-dark-border"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
          </div>
        </div>
        <p className="text-gray-400">Initializing Bantah...</p>
      </div>
    </div>
  )
}
