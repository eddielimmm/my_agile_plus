"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { supabase } from "@/lib/supabase"
import { useAuth } from "../../contexts/auth-context"
import { Trophy } from "lucide-react"

export function GoalPointsChart() {
  const { user } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week")

  useEffect(() => {
    if (user) {
      fetchGoalPointsData(timeRange)
    }
  }, [user, timeRange])

  const fetchGoalPointsData = async (range: "day" | "week" | "month") => {
    setIsLoading(true)
    try {
      // Calculate date range
      const now = new Date()
      let startDate: Date

      switch (range) {
        case "day":
          // Last 24 hours
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case "week":
          // Last 7 days
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "month":
          // Last 30 days
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
      }

      // Fetch general goals
      const { data: generalGoals, error: generalError } = await supabase
        .from("goal_points")
        .select("*")
        .eq("user_id", user.id)
        .eq("context", "general")
        .eq("achieved", true)
        .gte("achieved_date", startDate.toISOString())
        .lte("achieved_date", now.toISOString())
        .order("achieved_date", { ascending: true })

      if (generalError) throw generalError

      // Fetch sprint goals
      const { data: sprintGoals, error: sprintError } = await supabase
        .from("goal_points")
        .select("*")
        .eq("user_id", user.id)
        .like("context", "sprint_%")
        .eq("achieved", true)
        .gte("achieved_date", startDate.toISOString())
        .lte("achieved_date", now.toISOString())
        .order("achieved_date", { ascending: true })

      if (sprintError) throw sprintError

      // Process data for chart
      const processedData = processGoalData(generalGoals || [], sprintGoals || [], range)
      setData(processedData)
    } catch (error) {
      console.error("Error fetching goal points data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const processGoalData = (generalGoals: any[], sprintGoals: any[], range: "day" | "week" | "month") => {
    // Create date buckets based on range
    const buckets: Record<string, { date: string; general: number; sprint: number }> = {}

    // Format function based on range
    let formatDate: (date: Date) => string
    let incrementDate: (date: Date) => Date

    switch (range) {
      case "day":
        // Group by hour
        formatDate = (date: Date) => `${date.getHours()}:00`
        incrementDate = (date: Date) => new Date(date.getTime() + 60 * 60 * 1000) // Add 1 hour
        break
      case "week":
        // Group by day
        formatDate = (date: Date) => date.toLocaleDateString("en-US", { weekday: "short" })
        incrementDate = (date: Date) => {
          const newDate = new Date(date)
          newDate.setDate(date.getDate() + 1)
          return newDate
        }
        break
      case "month":
        // Group by day
        formatDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`
        incrementDate = (date: Date) => {
          const newDate = new Date(date)
          newDate.setDate(date.getDate() + 1)
          return newDate
        }
        break
    }

    // Initialize buckets
    const now = new Date()
    let currentDate = new Date()

    switch (range) {
      case "day":
        currentDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        currentDate.setMinutes(0, 0, 0)
        break
      case "week":
        currentDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        currentDate.setHours(0, 0, 0, 0)
        break
      case "month":
        currentDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        currentDate.setHours(0, 0, 0, 0)
        break
    }

    // Create empty buckets
    while (currentDate <= now) {
      const key = formatDate(currentDate)
      buckets[key] = { date: key, general: 0, sprint: 0 }
      currentDate = incrementDate(currentDate)
    }

    // Fill buckets with goal data
    generalGoals.forEach((goal) => {
      const date = new Date(goal.achieved_date)
      const key = formatDate(date)
      if (buckets[key]) {
        buckets[key].general += 1
      }
    })

    sprintGoals.forEach((goal) => {
      const date = new Date(goal.achieved_date)
      const key = formatDate(date)
      if (buckets[key]) {
        buckets[key].sprint += 1
      }
    })

    // Convert buckets to array
    return Object.values(buckets)
  }

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium">Goal Points Achievement</CardTitle>
          <CardDescription>Tracking your goal achievements over time</CardDescription>
        </div>
        <Trophy className="h-4 w-4 text-yellow-500" />
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="week" className="space-y-4" onValueChange={(value) => setTimeRange(value as any)}>
          <TabsList>
            <TabsTrigger value="day">24 Hours</TabsTrigger>
            <TabsTrigger value="week">7 Days</TabsTrigger>
            <TabsTrigger value="month">30 Days</TabsTrigger>
          </TabsList>

          <TabsContent value="day" className="space-y-4">
            {renderChart()}
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            {renderChart()}
          </TabsContent>

          <TabsContent value="month" className="space-y-4">
            {renderChart()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )

  function renderChart() {
    if (isLoading) {
      return <div className="flex justify-center items-center h-[300px]">Loading data...</div>
    }

    if (data.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-[300px] text-center">
          <Trophy className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">No goal achievements found</h3>
          <p className="text-gray-500 max-w-xs">Set and achieve goals to see your progress tracked here</p>
        </div>
      )
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="general" name="General Goals" fill="#4f46e5" />
          <Bar dataKey="sprint" name="Sprint Goals" fill="#8b5cf6" />
        </BarChart>
      </ResponsiveContainer>
    )
  }
}

