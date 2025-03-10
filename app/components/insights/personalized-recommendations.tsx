"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTaskContext } from "../../contexts/task-context"

type TaskSize = "XS" | "S" | "M" | "L" | "XL" | "XXL"

export function PersonalizedRecommendations() {
  const { tasks } = useTaskContext()

  const recommendations = useMemo(() => {
    const completedTasks = tasks.filter((task) => task.isCompleted)

    // Analyze work patterns
    const timeEntries = completedTasks.flatMap((task) => task.timeEntries)
    const workHours = timeEntries.map((entry) => new Date(entry.startTime).getHours())
    const mostProductiveHour =
      workHours.length > 0
        ? workHours.reduce((a, b, i, arr) =>
            arr.filter((v) => v === a).length >= arr.filter((v) => v === b).length ? a : b,
          )
        : null

    // Analyze task completion patterns for each size
    const taskCompletionTimes = completedTasks.reduce(
      (acc, task) => {
        if (!acc[task.size]) acc[task.size] = []
        acc[task.size].push({
          time: task.timeEntries.reduce((sum, entry) => sum + entry.duration, 0) / 3600, // in hours
          points: task.points,
        })
        return acc
      },
      {} as Record<TaskSize, { time: number; points: number }[]>,
    )

    const sizeAnalysis = Object.entries(taskCompletionTimes).map(([size, tasks]) => ({
      size: size as TaskSize,
      avgTime: tasks.reduce((sum, task) => sum + task.time, 0) / tasks.length,
      avgPointsPerHour:
        tasks.reduce((sum, task) => sum + task.points, 0) / tasks.reduce((sum, task) => sum + task.time, 0),
      count: tasks.length,
    }))

    const overallAvgPointsPerHour =
      sizeAnalysis.reduce((sum, size) => sum + size.avgPointsPerHour, 0) / sizeAnalysis.length

    const recommendations: string[] = []

    // General recommendations
    if (mostProductiveHour !== null) {
      recommendations.push(
        `Your most productive hour seems to be around ${mostProductiveHour}:00. Schedule your most challenging tasks during this time to maximize productivity.`,
      )
    }

    // Size-specific recommendations
    const sizeRecommendations = sizeAnalysis.map((sizeData) => {
      const { size, avgTime, avgPointsPerHour, count } = sizeData
      let recommendation = `For ${size} tasks (completed ${count}):`

      if (count > 0) {
        recommendation += `\n- Average completion time: ${avgTime.toFixed(2)} hours`
        recommendation += `\n- Efficiency: ${avgPointsPerHour.toFixed(2)} points/hour`

        if (avgPointsPerHour > overallAvgPointsPerHour) {
          recommendation += `\n- You're particularly efficient with ${size} tasks. Consider breaking larger tasks into ${size} chunks when possible.`
        } else {
          recommendation += `\n- There's room for improvement in ${size} tasks. Try to identify what makes these tasks challenging and develop strategies to overcome those obstacles.`
        }

        switch (size) {
          case "XS":
            recommendation += `\n- Use these for quick wins and to maintain momentum. Try to complete a few XS tasks when you're feeling low on energy or motivation.`
            break
          case "S":
            recommendation += `\n- These are great for warming up or cooling down your workday. Consider starting your day with a couple of S tasks to build momentum.`
            break
          case "M":
            recommendation += `\n- M tasks are your bread and butter. Try to maintain a steady pace with these, aiming to complete 2-3 M tasks per day for consistent progress.`
            break
          case "L":
            recommendation += `\n- Break L tasks into smaller subtasks if you're struggling. Set clear milestones and take short breaks between subtasks to maintain focus.`
            break
          case "XL":
            recommendation += `\n- For XL tasks, use the Pomodoro technique: work in focused 25-minute intervals with 5-minute breaks. This can help maintain concentration over longer periods.`
            break
          case "XXL":
            recommendation += `\n- XXL tasks require careful planning. Break them into daily goals, and don't hesitate to split them into multiple smaller tasks if they become overwhelming.`
            break
        }
      } else {
        recommendation += `\n- You haven't completed any ${size} tasks yet. Try to incorporate some ${size} tasks into your workflow to diversify your task management skills.`
      }

      return recommendation
    })

    recommendations.push(...sizeRecommendations)

    // Workload balance recommendation
    const incompleteTasks = tasks.filter((task) => !task.isCompleted)
    const totalPoints = incompleteTasks.reduce((sum, task) => sum + task.points, 0)
    if (totalPoints > 0) {
      const recommendedDailyPoints = Math.ceil(totalPoints / 5) // Assuming a 5-day work week
      recommendations.push(`Workload Balance: Based on your current workload of ${totalPoints} points, aim to complete about ${recommendedDailyPoints} points worth of tasks per day to stay on track. This could be achieved by completing, for example:
      - 1 M task and 2 S tasks, or
      - 1 L task and 1 XS task, or
      - 3 S tasks and 2 XS tasks
      Experiment with different combinations to find what works best for you.`)
    }

    // Time management recommendation
    const avgDailyWorkTime = timeEntries.reduce((sum, entry) => sum + entry.duration, 0) / (3600 * 7) // Average daily work time in hours, assuming 7-day week
    if (avgDailyWorkTime > 0) {
      recommendations.push(`Time Management: Your average daily work time is ${avgDailyWorkTime.toFixed(2)} hours. To optimize your productivity:
      - If this is less than your target, try to gradually increase your daily work time.
      - If this exceeds your target, focus on improving efficiency rather than working longer hours.
      - Aim for a consistent daily schedule to build a productive routine.`)
    }

    return recommendations
  }, [tasks])

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Personalized Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        {recommendations.length > 0 ? (
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
          <p>
            Complete more tasks to receive personalized recommendations. Try to work on a variety of task sizes to get
            more comprehensive insights.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

