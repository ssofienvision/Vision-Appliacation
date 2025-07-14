export default function TestPage() {
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">
          ✅ Server is Working!
        </h1>
        <p className="text-gray-600 mb-4">
          If you can see this page, your Next.js server is running correctly.
        </p>
        <div className="bg-green-100 p-4 rounded">
          <p className="text-green-800 font-medium">
            Localhost is responding properly!
          </p>
        </div>
        <a 
          href="/" 
          className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Home Page
        </a>
      </div>
    </div>
  )
} 