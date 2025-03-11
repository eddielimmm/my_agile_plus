"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTaskContext } from "../contexts/task-context"

const COLORS: { [key: string]: string } = {
  XS: "#81c784",
  S: "#64b5f6",
  M: "#ffd54f",
  L: "#ff9800",
  XL: "#f48fb1",
  XXL: "#ce93d8",
}

export function TimeDistributionChart() {
  const { tasks } = useTaskContext()

  const data = useMemo(() => {
    const hourlyData: Record<string, Record<string, number>> = {}
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }
    }

    tasks.forEach((task) => {
      if (task.timeEntries && Array.isArray(task.timeEntries)) {
        task.timeEntries.forEach((entry) => {
          if (entry.startTime && entry.duration) {
            const entryDate = new Date(entry.startTime)
            if (!isNaN(entryDate.getTime())) {
              const hour = entryDate.getHours()
              if (hourlyData[hour] && task.size) {
                hourlyData[hour][task.size] = (hourlyData[hour][task.size] || 0) + entry.duration / 3600 // Convert to hours
              }
            }
          }
        })
      }
    })

    return Object.entries(hourlyData).map(([hour, sizes]) => ({
      hour: `${hour.padStart(2, "0")}:00`,
      ...sizes,
    }))
  }, [tasks])

  const taskSizes = Object.keys(COLORS)

  const hasData = data.some((entry) => 
    Object.entries(entry).some(([key, value]) => 
      key !== 'hour' && typeof value === 'number' && value > 0
    )
  )

  console.log("Time Distribution Data:", data) // Add this line for debugging

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>Time Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-gray-800 p-2 border rounded shadow dark:border-gray-700">
                        <p className="text-gray-900 dark:text-gray-100">{`Time: ${label}`}</p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-gray-900 dark:text-gray-100">
                            {`${entry.name}: ${Number(entry.value).toFixed(2)} hours`}
                          </p>
                        ))}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend />
              {taskSizes.map((size) => (
                <Bar key={size} dataKey={size} stackId="a" fill={COLORS[size] || "#000000"} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
            No time distribution data available yet. Complete some tasks to see the chart.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

