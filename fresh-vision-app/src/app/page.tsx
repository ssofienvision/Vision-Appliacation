import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <div className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3">🔧</div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Vision Application</h1>
                </div>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/test" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Test Page
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-8 sm:mt-10 mx-auto max-w-7xl px-4 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-3xl sm:text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Service Management</span>{' '}
                  <span className="block text-blue-600 xl:inline">Dashboard</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Streamline your service business with comprehensive job tracking, technician management, and powerful analytics. 
                  Get real-time insights into your operations and boost productivity.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-3">
                  <div className="rounded-md shadow">
                    <Link
                      href="/test"
                      className="w-full flex items-center justify-center px-6 sm:px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition-colors"
                    >
                      Test Server
                    </Link>
                  </div>
                  <div className="sm:ml-3">
                    <Link
                      href="/dashboard"
                      className="w-full flex items-center justify-center px-6 sm:px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10 transition-colors"
                    >
                      View Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Server Status
            </h2>
            <div className="bg-green-100 p-4 rounded-lg">
              <p className="text-green-800 font-medium">
                ✅ Next.js server is running on localhost:3000
              </p>
              <p className="text-green-600 mt-2">
                If you can see this page, everything is working correctly!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 