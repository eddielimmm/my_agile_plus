"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTaskContext } from "../contexts/task-context"

const COLORS = {
  XS: "#81c784",
  S: "#64b5f6",
  M: "#ffd54f",
  L: "#ff9800",
  XL: "#f48fb1",
  XXL: "#ce93d8",
}

export function CompletionTimeAverages() {
  const { tasks } = useTaskContext()

  const data = useMemo(() => {
    const sizeData: Record<string, number[]> = {
      XS: [],
      S: [],
      M: [],
      L: [],
      XL: [],
      XXL: [],
    }

    tasks.forEach((task) => {
      if (task.isCompleted) {
        const totalTime = task.timeEntries.reduce((sum, entry) => sum + entry.duration, 0) / 3600 // Convert to hours
        if (sizeData[task.size]) {
          sizeData[task.size].push(totalTime)
        }
      }
    })

    return Object.entries(sizeData).map(([size, times]) => {
      const avg = times.length > 0 ? times.reduce((a, b) => a + b) / times.length : 0
      const min = times.length > 0 ? Math.min(...times) : 0
      const max = times.length > 0 ? Math.max(...times) : 0
      return {
        size,
        avg,
        min,
        max,
        id: `${size}-${avg.toFixed(2)}`, // Add unique identifier
      }
    })
  }, [tasks])

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>Completion Time Averages</CardTitle>
      </CardHeader>
      <CardContent>
        {data.some((item) => item.avg > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="size" type="category" />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white dark:bg-gray-800 p-2 border rounded shadow dark:border-gray-700">
                        <p className="text-gray-900 dark:text-gray-100">{`Size: ${data.size}`}</p>
                        <p className="text-gray-900 dark:text-gray-100">{`Average: ${data.avg.toFixed(2)} hours`}</p>
                        <p className="text-gray-900 dark:text-gray-100">{`Min: ${data.min.toFixed(2)} hours`}</p>
                        <p className="text-gray-900 dark:text-gray-100">{`Max: ${data.max.toFixed(2)} hours`}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="avg" fill="#81c784" key="completion-time-bar">
                {data.map((entry) => (
                  <Cell key={`cell-completion-${entry.size}`} fill={COLORS[entry.size as keyof typeof COLORS]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
            No completion time data available yet. Complete some tasks to see the averages.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

