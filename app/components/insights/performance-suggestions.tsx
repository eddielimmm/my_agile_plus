"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTaskContext } from "../../contexts/task-context"
import { format } from "date-fns"

export function PerformanceSuggestions() {
  const { tasks } = useTaskContext()

  const suggestions = useMemo(() => {
    const completedTasks = tasks.filter((task) => task.isCompleted)

    // Calculate average completion times for each task size
    const sizeCompletionTimes: Record<string, number[]> = {}
    completedTasks.forEach((task) => {
      const totalTime = task.timeEntries.reduce((sum, entry) => sum + entry.duration, 0)
      if (!sizeCompletionTimes[task.size]) {
        sizeCompletionTimes[task.size] = []
      }
      sizeCompletionTimes[task.size].push(totalTime)
    })

    const avgCompletionTimes = Object.entries(sizeCompletionTimes).map(([size, times]) => ({
      size,
      avgTime: times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0,
    }))

    // Find the most efficient task size
    const mostEfficientSize =
      avgCompletionTimes.length > 0 ? avgCompletionTimes.reduce((a, b) => (a.avgTime < b.avgTime ? a : b)) : null

    // Analyze productivity by time of day
    const productivityByHour: Record<number, { completed: number; total: number }> = {}
    completedTasks.forEach((task) => {
      task.timeEntries.forEach((entry) => {
        const hour = new Date(entry.startTime).getHours()
        if (!productivityByHour[hour]) {
          productivityByHour[hour] = { completed: 0, total: 0 }
        }
        productivityByHour[hour].completed += 1
        productivityByHour[hour].total += entry.duration
      })
    })

    const mostProductiveHour =
      Object.entries(productivityByHour).length > 0
        ? Object.entries(productivityByHour).reduce((a, b) =>
            b[1].completed / b[1].total > a[1].completed / a[1].total ? b : a,
          )[0]
        : null

    // Analyze task completion rate by priority
    const priorityCompletionRates: Record<string, { completed: number; total: number }> = {
      Low: { completed: 0, total: 0 },
      Medium: { completed: 0, total: 0 },
      High: { completed: 0, total: 0 },
    }

    tasks.forEach((task) => {
      if (task.priority) {
        priorityCompletionRates[task.priority].total += 1
        if (task.isCompleted) {
          priorityCompletionRates[task.priority].completed += 1
        }
      }
    })

    const priorityWithLowestCompletionRate =
      Object.entries(priorityCompletionRates).length > 0
        ? Object.entries(priorityCompletionRates).reduce((a, b) =>
            b[1].completed / b[1].total < a[1].completed / a[1].total ? b : a,
          )[0]
        : null

    const suggestions = []

    if (mostEfficientSize) {
      suggestions.push(
        `You're most efficient with ${mostEfficientSize.size} sized tasks. Consider breaking larger tasks into ${mostEfficientSize.size} sized chunks.`,
      )
      suggestions.push(
        `Based on your data, aim to complete ${mostEfficientSize.size} tasks in ${Math.round(mostEfficientSize.avgTime / 60)} minutes or less.`,
      )
    }

    if (mostProductiveHour) {
      suggestions.push(
        `Your most productive hour is ${format(new Date().setHours(Number.parseInt(mostProductiveHour), 0, 0, 0), "h a")}. Try scheduling important tasks during this time.`,
      )
    }

    if (priorityWithLowestCompletionRate) {
      suggestions.push(
        `You have the lowest completion rate for ${priorityWithLowestCompletionRate} priority tasks. Focus on improving your approach to these tasks.`,
      )
    }

    suggestions.push(
      `Consider using the Pomodoro technique: work for 25 minutes, then take a 5-minute break to maintain focus and productivity.`,
    )

    return suggestions
  }, [tasks])

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Performance Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        {suggestions.length > 0 ? (
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2 mt-1 flex h-2 w-2 rounded-full bg-blue-500" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Complete more tasks to receive personalized performance suggestions.</p>
        )}
      </CardContent>
    </Card>
  )
}

