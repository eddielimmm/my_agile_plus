"use client"

import { useMemo, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTaskContext } from "../../contexts/task-context"
import { differenceInDays, format, addDays, isValid } from "date-fns"
import { useAuth } from "../../contexts/auth-context"
import { getReportData } from "../../utils/report-utils"

type TaskSize = "XS" | "S" | "M" | "L" | "XL" | "XXL"
type TaskPriority = "Low" | "Medium" | "High"

interface Task {
  id: number
  title: string
  size: TaskSize
  points: number
  dueDate: Date
  isCompleted: boolean
  timeEntries: { date: string; duration: number; startTime: string }[]
  priority?: TaskPriority
  description?: string
  createdAt: Date
}

export function AIPersonalizedRecommendations() {
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

  const recommendations = useMemo(() => {
    const completedTasks = tasks.filter((task) => task.isCompleted)
    const incompleteTasks = tasks.filter((task) => !task.isCompleted)

    // Helper function to get hour from date string
    const getHour = (dateString: string) => {
      const date = new Date(dateString)
      return isValid(date) ? date.getHours() : null
    }

    // Analyze productivity by hour
    const productivityByHour: Record<number, { completed: number; total: number }> = {}
    completedTasks.forEach((task) => {
      task.timeEntries?.forEach((entry) => {
        if (entry.startTime) {
          const date = entry.startTime ? new Date(entry.startTime) : null
          if (date) {
            const hour = date.getHours()
            if (hour !== null) {
              if (!productivityByHour[hour]) {
                productivityByHour[hour] = { completed: 0, total: 0 }
              }
              productivityByHour[hour].completed += 1
              productivityByHour[hour].total += entry.duration
            }
          }
        }
      })
    })

    // Find most productive hours
    const productiveHours = Object.entries(productivityByHour)
      .map(([hour, data]) => ({
        hour: Number(hour),
        productivity: data.completed / data.total,
      }))
      .sort((a, b) => b.productivity - a.productivity)
      .slice(0, 3)

    // Analyze task completion patterns for each size
    const taskCompletionTimes: Record<TaskSize, number[]> = {
      XS: [],
      S: [],
      M: [],
      L: [],
      XL: [],
      XXL: [],
    }
    completedTasks.forEach((task) => {
      const totalTime = task.timeEntries.reduce((sum, entry) => sum + entry.duration, 0) / 3600 // in hours
      if (taskCompletionTimes[task.size]) {
        taskCompletionTimes[task.size].push(totalTime)
      }
    })

    const sizeAnalysis = Object.entries(taskCompletionTimes).map(([size, times]) => ({
      size: size as TaskSize,
      avgTime: times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0,
      count: times.length,
    }))

    // Calculate overall statistics
    const totalCompletedTasks = completedTasks.length
    const totalPoints = tasks.reduce((sum, task) => sum + task.points, 0)
    const completedPoints = completedTasks.reduce((sum, task) => sum + task.points, 0)
    const completionRate = totalCompletedTasks / tasks.length
    const pointCompletionRate = completedPoints / totalPoints

    // Analyze priority completion rates
    const priorityCompletionRates: Record<TaskPriority, { completed: number; total: number }> = {
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

    // Generate recommendations
    const recommendations: string[] = []

    // Personal productivity time recommendations
    if (productiveHours.length > 0) {
      const formattedHours = productiveHours
        .map((h) => {
          const date = new Date()
          date.setHours(h.hour, 0, 0, 0)
          return isValid(date) ? format(date, "ha") : `${h.hour}:00`
        })
        .join(", ")
      recommendations.push(`Peak Productivity: Your most productive hours are ${formattedHours}. To maximize your efficiency:
1. Schedule your most important and challenging tasks during these peak hours.
2. Create a daily routine that aligns with your natural productivity rhythm.
3. Minimize distractions and interruptions during these high-performance periods.
4. Use time-blocking to reserve these hours for focused work.`)
    }

    // Personal task size recommendations
    sizeAnalysis.forEach(({ size, avgTime, count }) => {
      if (count > 0) {
        recommendations.push(`${size} Tasks: On average, you complete ${size} tasks in ${avgTime.toFixed(2)} hours. To optimize your approach:
${
  size === "XS" || size === "S"
    ? `• Use these for quick wins and to maintain momentum throughout the day.
 • Batch several ${size} tasks together during low-energy periods.
 • Use completed ${size} tasks as rewards after finishing larger, more demanding tasks.`
    : size === "M"
      ? `• Aim to complete 2-3 ${size} tasks daily for steady progress.
 • Break your day into focused work sessions centered around individual ${size} tasks.
 • Use the completion of ${size} tasks as milestones to track your daily productivity.`
      : `• Break these larger tasks into smaller subtasks to make them less daunting.
 • Use the Pomodoro technique (25-minute focused work sessions) to maintain concentration.
 • Schedule regular breaks and rewards for progress on these more substantial tasks.
 • Dedicate specific days of the week to tackling your ${size} tasks.`
}`)
      }
    })

    // Personal priority-based recommendations
    Object.entries(priorityCompletionRates).forEach(([priority, { completed, total }]) => {
      if (total > 0) {
        const rate = completed / total
        recommendations.push(`${priority} Priority Tasks: Your completion rate is ${(rate * 100).toFixed(2)}%. To improve:
${
  rate < 0.5
    ? `• Reassess the true urgency and importance of these tasks.
 • Break them down into smaller, more manageable pieces to reduce overwhelm.
 • Allocate specific time blocks in your schedule dedicated to ${priority.toLowerCase()} priority tasks.
 • Identify and address any recurring obstacles that prevent you from completing these tasks.`
    : rate > 0.8
      ? `• Consider increasing the complexity or scope of these tasks to further challenge yourself.
 • Analyze your successful strategies and apply them to other areas of your task management.
 • Document your effective techniques for future reference.`
      : `• Optimize your workflow for these tasks by identifying patterns in completed vs. uncompleted tasks.
 • Experiment with different productivity techniques to find what works best for ${priority.toLowerCase()} priority tasks.
 • Set personal goals to gradually improve your completion rate over time.`
}`)
      }
    })

    // Personal workload balance recommendation
    const incompletePoints = incompleteTasks.reduce((sum, task) => sum + task.points, 0)
    if (incompletePoints > 0) {
      const recommendedDailyPoints = Math.ceil(incompletePoints / 5) // Assuming a 5-day work week
      recommendations.push(`Workload Balance: You have ${incompletePoints} points worth of incomplete tasks. To manage this effectively:
1. Complete about ${recommendedDailyPoints} points per day to stay on track.
2. Experiment with different task combinations for your ideal daily mix, such as:
 - 1 M task (3 points) and 2 S tasks (2 points each)
 - 1 L task (5 points) and 1 XS task (1 point)
 - 3 S tasks (2 points each) and 1 XS task (1 point)
3. Use a task planning app or a simple spreadsheet to distribute your points across the week.
4. Regularly review and adjust your point goals based on your energy levels and external commitments.`)
    }

    // Personal time management recommendation
    const totalWorkTime = completedTasks.reduce(
      (sum, task) => sum + task.timeEntries.reduce((taskSum, entry) => taskSum + entry.duration, 0),
      0,
    )
    const avgDailyWorkTime = totalWorkTime / (3600 * 7) // Average daily work time in hours, assuming 7-day week
    if (avgDailyWorkTime > 0) {
      recommendations.push(`Time Management: Your average daily work time is ${avgDailyWorkTime.toFixed(2)} hours. To optimize your time usage:
${
  avgDailyWorkTime < 4
    ? `• Gradually increase your daily work time to improve overall productivity.
 • Set small, incremental goals to extend your focused work periods.
 • Eliminate time-wasting activities in your daily routine.
 • Use time-tracking apps to gain insights into where your time is being spent.`
    : avgDailyWorkTime > 8
      ? `• Focus on improving efficiency rather than working longer hours.
 • Prioritize tasks ruthlessly to ensure you're spending time on what truly matters.
 • Implement strict time-boxing for tasks to prevent work from expanding to fill available time.
 • Take adequate breaks and time for self-care to prevent burnout.`
      : `• Analyze your most productive days to identify success factors.
 • Establish clear start and end times for your workday to maintain consistency.
 • Regularly assess your tasks to ensure you're spending time on high-value activities.
 • Experiment with different productivity techniques to further optimize your time use.`
}`)
    }

    // Personal task completion trend
    const last30Days = Array.from({ length: 30 }, (_, i) => addDays(new Date(), -i))
    const completionTrend = last30Days.map((date) => ({
      date,
      completed: completedTasks.filter(
        (task) =>
          task.timeEntries &&
          task.timeEntries.length > 0 &&
          task.timeEntries[task.timeEntries.length - 1].date &&
          differenceInDays(new Date(task.timeEntries[task.timeEntries.length - 1].date), date) === 0,
      ).length,
    }))
    const avgCompletionRate = completionTrend.reduce((sum, day) => sum + day.completed, 0) / 30
    recommendations.push(`Completion Trend: Over the last 30 days, you've completed an average of ${avgCompletionRate.toFixed(2)} tasks per day. To improve your consistency:
${
  avgCompletionRate < 1
    ? `• Set a daily minimum goal of completing at least one task, no matter how small.
 • Use a task completion streak tracker to motivate yourself.
 • Identify patterns or obstacles on days when you complete zero tasks.
 • Celebrate small wins to build momentum and positive reinforcement.`
    : avgCompletionRate < 3
      ? `• Challenge yourself to complete one additional task per day to boost productivity.
 • Identify your most productive days and replicate those conditions more often.
 • Use a visual progress tracker to motivate yourself and see your improvement over time.
 • Experiment with different task management techniques to find what helps you complete more tasks.`
      : `• Analyze your most productive days to understand what contributes to your success.
 • Set stretch goals for yourself to see how far you can push your productivity.
 • Balance quantity with quality in your task completion.
 • Increase the complexity or impact of your tasks to match your high completion rate.`
}`)

    return recommendations
  }, [tasks])

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle>Smart Personalized Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="loader"></div>
          </div>
        ) : tasks.length > 0 && recommendations.length > 0 ? (
          <ul className="space-y-6">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="space-y-2">
                {recommendation.split("\n").map((line, lineIndex) => (
                  <p key={lineIndex} className={lineIndex === 0 ? "font-semibold" : ""}>
                    {lineIndex === 0 ? "• " : "  "}
                    {line}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">No data available yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Complete some tasks to receive Smart personalized recommendations.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

