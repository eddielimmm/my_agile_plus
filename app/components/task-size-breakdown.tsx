"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTaskContext } from "../contexts/task-context"
import { PieChartIcon } from "lucide-react"

const COLORS = {
  XS: "#81c784",
  S: "#64b5f6",
  M: "#ffd54f",
  L: "#ff9800",
  XL: "#f48fb1",
  XXL: "#ce93d8",
}

export function TaskSizeBreakdown() {
  const { tasks } = useTaskContext()

  const data = useMemo(() => {
    const sizeData = tasks.reduce(
      (acc, task) => {
        const totalTime = task.timeEntries.reduce((sum, entry) => sum + entry.duration, 0) / 3600 // Convert to hours
        acc[task.size] = (acc[task.size] || 0) + totalTime
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(sizeData).map(([size, hours]) => ({
      size,
      hours,
      percentage: (hours / Object.values(sizeData).reduce((a, b) => a + b, 0)) * 100,
    }))
  }, [tasks])

  const hasData = data.length > 0

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>Task Size Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="hours"
                key="task-size-pie" // Added unique key
              >
                {data.map((entry) => (
                  <Cell key={`cell-size-${entry.size}`} fill={COLORS[entry.size as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white dark:bg-gray-800 p-2 border rounded shadow dark:border-gray-700">
                        <p className="text-gray-900 dark:text-gray-100">{`${data.size}: ${data.hours.toFixed(2)} hours`}</p>
                        <p className="text-gray-900 dark:text-gray-100">{`${data.percentage.toFixed(2)}%`}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <PieChartIcon className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No task data yet</h3>
            <p className="text-sm text-gray-500">Complete some tasks to see your task size distribution</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

