"use client"

import { useMemo, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTaskContext } from "../../contexts/task-context"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useAuth } from "../../contexts/auth-context"
import { getReportData } from "../../utils/report-utils"

export function PatternRecognition() {
  const { tasks } = useTaskContext()
  const { user } = useAuth()
  const [reportData, setReportData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchReportData = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const data = await getReportData(user.id, today)
        setReportData(data)
      } catch (error) {
        console.error("Error fetching report data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReportData()
  }, [user, tasks])

  const peakProductivityData = useMemo(() => {
    const hourlyData: { [hour: number]: { completed: number; total: number } } = {}
    tasks.forEach((task) => {
      task.timeEntries.forEach((entry) => {
        const hour = new Date(entry.startTime).getHours()
        if (!hourlyData[hour]) {
          hourlyData[hour] = { completed: 0, total: 0 }
        }
        hourlyData[hour].total += entry.duration
        if (task.isCompleted) {
          hourlyData[hour].completed += entry.duration
        }
      })
    })
    return Object.entries(hourlyData).map(([hour, data]) => ({
      hour: Number.parseInt(hour),
      productivity: data.completed / data.total,
      totalTime: data.total / 3600, // convert to hours
    }))
  }, [tasks])

  const workHabitsData = useMemo(() => {
    const habitData: { [habit: string]: number } = {
      "Morning Work": 0,
      "Afternoon Work": 0,
      "Evening Work": 0,
      "Night Work": 0,
    }
    tasks.forEach((task) => {
      task.timeEntries.forEach((entry) => {
        const hour = new Date(entry.startTime).getHours()
        if (hour >= 5 && hour < 12) habitData["Morning Work"] += entry.duration
        else if (hour >= 12 && hour < 17) habitData["Afternoon Work"] += entry.duration
        else if (hour >= 17 && hour < 22) habitData["Evening Work"] += entry.duration
        else habitData["Night Work"] += entry.duration
      })
    })
    return Object.entries(habitData).map(([habit, duration]) => ({
      habit,
      duration: duration / 3600, // convert to hours
    }))
  }, [tasks])

  const COLORS = ["#81c784", "#64b5f6", "#ffd54f", "#ff9800", "#f48fb1", "#ce93d8"]

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Peak Productivity Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="loader"></div>
            </div>
          ) : peakProductivityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakProductivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-gray-800 p-2 border rounded shadow dark:border-gray-700">
                          <p className="text-gray-900 dark:text-gray-100">{`Hour: ${label}`}</p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-gray-900 dark:text-gray-100">
                              {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}`}
                            </p>
                          ))}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="productivity" fill="#81c784" name="Productivity" />
                <Bar yAxisId="right" dataKey="totalTime" fill="#64b5f6" name="Total Time (hours)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
              No data available for Peak Productivity Analysis
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Work Habits Insights</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="loader"></div>
            </div>
          ) : workHabitsData.some((item) => item.duration > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workHabitsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="habit" />
                <YAxis />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-gray-800 p-2 border rounded shadow dark:border-gray-700">
                          <p className="text-gray-900 dark:text-gray-100">{`Hour: ${label}`}</p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-gray-900 dark:text-gray-100">
                              {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}`}
                            </p>
                          ))}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                <Bar dataKey="duration" fill="#ffd54f" name="Duration (hours)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
              No data available for Work Habits Insights
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

