import Layout from "../components/layout"
import { Timer } from "../components/timer"
import { Clock } from "lucide-react"

export default function TimerPage() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center space-x-3 mb-8">
          <Clock className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">Focus Timer</h1>
        </div>

        {/* Timer Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 backdrop-blur-sm backdrop-filter">
          <div className="flex flex-col items-center">
            {/* Description */}
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
              Stay focused and productive with timed work sessions
            </p>

            {/* Timer Component */}
            <div className="w-full">
              <Timer />
            </div>

            {/* Tips Section */}
            <div className="mt-8 pt-6 border-t border-gray-100 w-full">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tips for effective focus:</h2>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2"></div>
                  Find a quiet space to work
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2"></div>
                  Take regular breaks
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2"></div>
                  Stay hydrated
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

