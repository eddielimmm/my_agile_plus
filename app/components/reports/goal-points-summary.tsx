"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "../../contexts/auth-context"
import { Trophy, TrendingUp, Calendar } from "lucide-react"

export function GoalPointsSummary() {
  const { user } = useAuth()
  const [summary, setSummary] = useState({
    totalGoals: 0,
    achievedGoals: 0,
    generalGoals: 0,
    sprintGoals: 0,
    currentStreak: 0,
    longestStreak: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchGoalSummary()
    }
  }, [user])

  const fetchGoalSummary = async () => {
    setIsLoading(true)
    try {
      // Fetch total goals
      const { count: totalGoals, error: totalError } = await supabase
        .from("goal_points")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      if (totalError) throw totalError

      // Fetch achieved goals
      const { count: achievedGoals, error: achievedError } = await supabase
        .from("goal_points")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("achieved", true)

      if (achievedError) throw achievedError

      // Fetch general achieved goals
      const { count: generalGoals, error: generalError } = await supabase
        .from("goal_points")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("context", "general")
        .eq("achieved", true)

      if (generalError) throw generalError

      // Fetch sprint achieved goals
      const { count: sprintGoals, error: sprintError } = await supabase
        .from("goal_points")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .like("context", "sprint_%")
        .eq("achieved", true)

      if (sprintError) throw sprintError

      // Fetch achieved goals ordered by date to calculate streaks
      const { data: achievedGoalsByDate, error: streakError } = await supabase
        .from("goal_points")
        .select("achieved_date")
        .eq("user_id", user.id)
        .eq("achieved", true)
        .order("achieved_date", { ascending: false })

      if (streakError) throw streakError

      // Calculate streaks
      const { currentStreak, longestStreak } = calculateStreaks(achievedGoalsByDate || [])

      setSummary({
        totalGoals: totalGoals || 0,
        achievedGoals: achievedGoals || 0,
        generalGoals: generalGoals || 0,
        sprintGoals: sprintGoals || 0,
        currentStreak,
        longestStreak,
      })
    } catch (error) {
      console.error("Error fetching goal summary:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStreaks = (achievedGoals: any[]) => {
    if (!achievedGoals.length) return { currentStreak: 0, longestStreak: 0 }

    // Group achievements by day
    const achievementsByDay: Record<string, boolean> = {}
    achievedGoals.forEach((goal) => {
      if (!goal.achieved_date) return
      const date = new Date(goal.achieved_date)
      const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
      achievementsByDay[dateKey] = true
    })

    // Calculate current streak
    let currentStreak = 0
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Check if there's an achievement today or yesterday to start the streak
    const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
    const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`

    if (achievementsByDay[todayKey] || achievementsByDay[yesterdayKey]) {
      // Start with today or yesterday
      const startDate = achievementsByDay[todayKey] ? today : yesterday
      currentStreak = 1

      // Check previous days
      const checkDate = new Date(startDate)
      checkDate.setDate(checkDate.getDate() - 1)

      while (true) {
        const checkKey = `${checkDate.getFullYear()}-${checkDate.getMonth() + 1}-${checkDate.getDate()}`
        if (achievementsByDay[checkKey]) {
          currentStreak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0
    let currentLongest = 0

    // Sort dates
    const dates = Object.keys(achievementsByDay)
      .map((dateStr) => {
        const [year, month, day] = dateStr.split("-").map(Number)
        return new Date(year, month - 1, day)
      })
      .sort((a, b) => a.getTime() - b.getTime())

    if (dates.length > 0) {
      currentLongest = 1
      longestStreak = 1

      for (let i = 1; i < dates.length; i++) {
        const prevDate = dates[i - 1]
        const currDate = dates[i]

        // Check if dates are consecutive
        const diffTime = currDate.getTime() - prevDate.getTime()
        const diffDays = diffTime / (1000 * 60 * 60 * 24)

        if (Math.round(diffDays) === 1) {
          currentLongest++
          longestStreak = Math.max(longestStreak, currentLongest)
        } else {
          currentLongest = 1
        }
      }
    }

    return { currentStreak, longestStreak }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Goal Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Goal Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-sm font-medium">Achieved</p>
              <p className="text-2xl font-bold">
                {summary.achievedGoals}/{summary.totalGoals}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            <div>
              <p className="text-sm font-medium">Success Rate</p>
              <p className="text-2xl font-bold">
                {summary.totalGoals > 0 ? Math.round((summary.achievedGoals / summary.totalGoals) * 100) : 0}%
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 rounded-full bg-indigo-500 flex items-center justify-center">
              <span className="text-[10px] text-white font-bold">G</span>
            </div>
            <div>
              <p className="text-sm font-medium">General Goals</p>
              <p className="text-2xl font-bold">{summary.generalGoals}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 rounded-full bg-purple-500 flex items-center justify-center">
              <span className="text-[10px] text-white font-bold">S</span>
            </div>
            <div>
              <p className="text-sm font-medium">Sprint Goals</p>
              <p className="text-2xl font-bold">{summary.sprintGoals}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 col-span-2">
            <Calendar className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-sm font-medium">Current Streak</p>
              <p className="text-2xl font-bold">{summary.currentStreak} days</p>
              <p className="text-xs text-gray-500">Longest: {summary.longestStreak} days</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

