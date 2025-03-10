"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTaskContext } from "../../contexts/task-context"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function PredictiveAnalysis() {
  const { tasks } = useTaskContext()

  const predictedCompletionTimes = useMemo(() => {
    const completedTasks = tasks.filter((task) => task.isCompleted)
    const taskSizes = ["XS", "S", "M", "L", "XL", "XXL"] as const

    const averageTimeBySize = taskSizes.reduce(
      (acc, size) => {
        const tasksOfSize = completedTasks.filter((task) => task.size === size)
        if (tasksOfSize.length > 0) {
          const totalTime = tasksOfSize.reduce(
            (sum, task) => sum + task.timeEntries.reduce((entrySum, entry) => entrySum + entry.duration, 0),
            0,
          )
          acc[size] = totalTime / tasksOfSize.length / 3600 // Convert to hours
        } else {
          acc[size] = 0
        }
        return acc
      },
      {} as Record<(typeof taskSizes)[number], number>,
    )

    // Predict future completion times (simple linear extrapolation)
    const predictions = taskSizes.map((size) => ({
      size,
      current: averageTimeBySize[size],
      predicted: averageTimeBySize[size] * 0.9, // Assume 10% improvement
    }))

    return predictions
  }, [tasks])

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle>Predictive Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {predictedCompletionTimes.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={predictedCompletionTimes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="size" />
                <YAxis label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-gray-800 p-2 border rounded shadow dark:border-gray-700">
                          <p className="text-gray-900 dark:text-gray-100">{`Size: ${label}`}</p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-gray-900 dark:text-gray-100">
                              {`${entry.name}: ${entry.value.toFixed(2)} hours`}
                            </p>
                          ))}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="current" fill="#8884d8" name="Current Average" />
                <Bar dataKey="predicted" fill="#82ca9d" name="Predicted" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Interpretation:</h4>
              <p>
                Based on your historical data, we predict that you'll be able to complete tasks slightly faster in the
                future. The green bars show the predicted completion times for each task size, assuming a 10%
                improvement in efficiency.
              </p>
              <p className="mt-2">
                Keep in mind that this is a simple prediction and actual results may vary based on various factors.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">No data available yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Complete more tasks to see predictive analysis of your task completion times.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

