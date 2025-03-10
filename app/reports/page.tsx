"use client"

import Layout from "../components/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { GoalPointsChart } from "../components/reports/goal-points-chart"
import { GoalPointsSummary } from "../components/reports/goal-points-summary"

// Sample data - in a real app, this would come from your database
const taskCompletionData = [
  { day: "Mon", completed: 5 },
  { day: "Tue", completed: 8 },
  { day: "Wed", completed: 3 },
  { day: "Thu", completed: 7 },
  { day: "Fri", completed: 9 },
  { day: "Sat", completed: 4 },
  { day: "Sun", completed: 2 },
]

const productivityByTimeData = [
  { time: "6AM", tasks: 1 },
  { time: "9AM", tasks: 4 },
  { time: "12PM", tasks: 3 },
  { time: "3PM", tasks: 5 },
  { time: "6PM", tasks: 2 },
  { time: "9PM", tasks: 1 },
]

const taskSizeDistributionData = [
  { size: "XS", count: 8 },
  { size: "S", count: 12 },
  { size: "M", count: 15 },
  { size: "L", count: 7 },
  { size: "XL", count: 3 },
  { size: "XXL", count: 1 },
]

export default function ReportsPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Track your productivity and task completion patterns</p>
        </div>

        {/* Goal Points Section - Clearly labeled */}
        <div className="border-l-4 border-indigo-500 pl-4 py-2 mb-4">
          <h2 className="text-xl font-bold text-gray-800">Goal Points Analytics</h2>
          <p className="text-gray-600">Track your goal achievements over time</p>
        </div>

        {/* Goal Points Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GoalPointsSummary />

          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Task Completion Rate</CardTitle>
              <CardDescription>Percentage of tasks completed on time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={taskCompletionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="completed" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goal Points Chart - With clear label */}
        <div className="border p-1 rounded bg-indigo-50">
          <GoalPointsChart />
        </div>

        {/* Task Analytics Section */}
        <div className="border-l-4 border-purple-500 pl-4 py-2 mb-4 mt-8">
          <h2 className="text-xl font-bold text-gray-800">Task Analytics</h2>
          <p className="text-gray-600">Analyze your task completion patterns</p>
        </div>

        {/* Other Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Productivity by Time of Day</CardTitle>
              <CardDescription>When you complete the most tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productivityByTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="tasks" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Task Size Distribution</CardTitle>
              <CardDescription>Breakdown of tasks by size</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskSizeDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="size" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

