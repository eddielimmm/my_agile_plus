"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useTaskContext } from "../../contexts/task-context"
import { supabase } from "@/lib/supabase"
import { useAuth } from "../../contexts/auth-context"
import { format, parseISO, isValid, differenceInDays } from "date-fns"

interface Report {
  id: string
  user_id: string
  report_date: string
  total_time: number
  completed_tasks: number
  points_earned: number
  task_size_breakdown: string
  time_distribution: string
  completion_time_averages: string
  monthly_points: string
}

export function SmartRecommendations() {
  const { tasks } = useTaskContext()
  const { user } = useAuth()
  const [report, setReport] = useState<Report | null>(null)

  useEffect(() => {
    const fetchReportData = async () => {
      if (!user) return

      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .eq("user_id", user.id)
          .eq("report_date", today.toISOString())
          .maybeSingle()

        if (error) throw error
        setReport(data)
      } catch (error) {
        console.error("Error fetching report data:", error)
      }
    }

    fetchReportData()
  }, [user])

  if (!report) {
    return <div>Loading recommendations...</div>
  }

  const taskSizeBreakdown = JSON.parse(report.task_size_breakdown || "{}")
  const timeDistribution = JSON.parse(report.time_distribution || "{}")
  const completionTimeAverages = JSON.parse(report.completion_time_averages || "{}")
  const monthlyPoints = JSON.parse(report.monthly_points || "{}")

  // Productivity Analysis
  const productiveHour = Object.entries(timeDistribution).reduce(
    (max, [hour, time]) => (time > max.time ? { hour: Number.parseInt(hour), time: time as number } : max),
    { hour: 0, time: 0 },
  ).hour

  // Task Size Efficiency
  const mostEfficientSize = Object.entries(completionTimeAverages).reduce(
    (min, [size, time]) => (time < min.time ? { size, time: time as number } : min),
    { size: "", time: Number.POSITIVE_INFINITY },
  ).size

  // Completion Trend
  const completionRate = tasks.length > 0 ? (tasks.filter((task) => task.isCompleted).length / tasks.length) * 100 : 0

  // Predictive Analysis
  const recentCompletionRate =
    tasks.length > 0
      ? (tasks.filter((task) => {
          const lastEntryDate =
            task.timeEntries.length > 0 ? parseISO(task.timeEntries[task.timeEntries.length - 1].date) : null
          return (
            lastEntryDate &&
            isValid(lastEntryDate) &&
            differenceInDays(lastEntryDate, new Date()) <= 7 &&
            task.isCompleted
          )
        }).length /
          tasks.length) *
        100
      : 0

  const improvementPercentage = recentCompletionRate - completionRate

  // Prepare data for the chart
  const chartData = Object.entries(completionTimeAverages).map(([size, time]) => ({
    size,
    time: Number(time),
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Productivity Peak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{format(new Date().setHours(productiveHour, 0, 0, 0), "h a")}</p>
            <p className="text-sm text-muted-foreground">Most productive hour</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Efficient Task Size</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{mostEfficientSize}</p>
            <p className="text-sm text-muted-foreground">Best performing task size</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Task Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completionRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">Overall completion rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{improvementPercentage.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">
              {improvementPercentage >= 0 ? "Improvement" : "Decline"} in recent task completion
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Task Completion Time by Size</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="size" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="time" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

