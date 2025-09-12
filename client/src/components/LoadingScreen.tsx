export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white">
          Smart<span className="text-yellow-300">Q</span>
        </h1>
        <div className="mt-4 flex justify-center items-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}