"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trophy, Sparkles } from "lucide-react"
import { useSprintContext } from "../../contexts/sprint-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useTaskContext } from "../../contexts/task-context"
import { supabase } from "@/lib/supabase"
import { useAuth } from "../../contexts/auth-context"

export function SprintGoalPointsInput() {
  const { currentSprint } = useSprintContext()
  const { tasks } = useTaskContext()
  const { user } = useAuth()
  const [goalPoints, setGoalPointsState] = useState<number>(0)
  const [inputValue, setInputValue] = useState<string>("0")
  const [isWarningOpen, setIsWarningOpen] = useState<boolean>(false)
  const [isCongratsOpen, setIsCongratsOpen] = useState<boolean>(false)
  const [suggestedGoal, setSuggestedGoal] = useState<number>(0)
  const [previousGoal, setPreviousGoal] = useState<number>(0)
  const [isGoalAchieved, setIsGoalAchieved] = useState<boolean>(false)
  const [goalId, setGoalId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [hasContextColumn, setHasContextColumn] = useState<boolean>(true)

  // Get sprint tasks - with null check for currentSprint and currentSprint.tasks
  const sprintTasks =
    currentSprint && currentSprint.tasks ? tasks.filter((task) => currentSprint.tasks.includes(String(task.id))) : []

  // Calculate current progress
  const totalCompletedPoints = sprintTasks
    .filter((task) => task.isCompleted)
    .reduce((sum, task) => sum + task.points, 0)

  const progressPercentage = goalPoints > 0 ? Math.min(Math.round((totalCompletedPoints / goalPoints) * 100), 100) : 0

  // Check if context column exists
  useEffect(() => {
    const checkContextColumn = async () => {
      try {
        // Try to query with context column
        const { data, error } = await supabase.from("goal_points").select("context").limit(1)

        if (error && error.message.includes("context")) {
          console.warn("Context column does not exist in goal_points table")
          setHasContextColumn(false)
        } else {
          setHasContextColumn(true)
        }
      } catch (error) {
        console.error("Error checking context column:", error)
        setHasContextColumn(false)
      }
    }

    checkContextColumn()
  }, [])

  // Load current sprint goal
  useEffect(() => {
    if (user && currentSprint) {
      setIsLoading(true)
      const loadGoal = async () => {
        try {
          let query = supabase.from("goal_points").select("*").eq("user_id", user.id).eq("is_active", true)

          // Only add context filter if the column exists
          if (hasContextColumn) {
            query = query.eq("context", `sprint_${currentSprint.id}`)
          } else {
            // If context column doesn't exist, we'll need to filter by sprint ID in some other way
            // For now, just get the active goal for the user
            console.warn("Using fallback method to get sprint goal (no context column)")
          }

          const { data, error } = await query.single()

          if (error && error.code !== "PGRST116") {
            // PGRST116 is "no rows returned"
            console.error("Error loading sprint goal:", error)
          }

          if (data) {
            setGoalPointsState(data.goal_value)
            setInputValue(data.goal_value.toString())
            setGoalId(data.id)

            // Check if goal is achieved
            if (totalCompletedPoints >= data.goal_value && !data.achieved) {
              setIsGoalAchieved(true)
            }
          } else {
            // No active goal, set defaults
            setGoalPointsState(0)
            setInputValue("0")
            setGoalId(null)
          }
        } catch (error) {
          console.error("Error loading sprint goal:", error)
        } finally {
          setIsLoading(false)
        }
      }

      loadGoal()
      loadSuggestedGoal()
    } else {
      // Set isLoading to false if there's no user or currentSprint
      setIsLoading(false)
    }
  }, [user, currentSprint, totalCompletedPoints, hasContextColumn])

  // Check if goal is achieved
  useEffect(() => {
    if (goalPoints > 0 && totalCompletedPoints >= goalPoints && !isGoalAchieved) {
      setIsGoalAchieved(true)

      // Mark goal as achieved in database
      if (goalId) {
        markGoalAchieved(goalId, totalCompletedPoints)
      }
    }
  }, [totalCompletedPoints, goalPoints, isGoalAchieved, goalId])

  // Show congratulations dialog when goal is achieved
  useEffect(() => {
    if (isGoalAchieved && goalPoints > 0) {
      setIsCongratsOpen(true)
    }
  }, [isGoalAchieved, goalPoints])

  const loadSuggestedGoal = async () => {
    if (!user || !currentSprint) return

    try {
      // Get historical sprint velocity
      const velocity = await getHistoricalSprintVelocity()
      setSuggestedGoal(velocity)
      setPreviousGoal(velocity)
    } catch (error) {
      console.error("Error loading suggested goal:", error)
    }
  }

  const getHistoricalSprintVelocity = async (): Promise<number> => {
    if (!user) return 0

    try {
      let query = supabase
        .from("goal_points")
        .select("*")
        .eq("user_id", user.id)
        .eq("achieved", true)
        .order("created_at", { ascending: false })
        .limit(3)

      // Only add context filter if the column exists
      if (hasContextColumn) {
        query = query.like("context", "sprint_%")
      }

      const { data, error } = await query

      if (error) throw error

      if (!data || data.length === 0) {
        // If no historical data, use current sprint tasks as a baseline
        return Math.round(sprintTasks.reduce((sum, task) => sum + task.points, 0) * 0.7) // 70% of total points
      }

      // Calculate average goal value from previous sprints
      const totalGoalValue = data.reduce((sum, goal) => sum + goal.goal_value, 0)
      return Math.round(totalGoalValue / data.length)
    } catch (error) {
      console.error("Error calculating historical sprint velocity:", error)
      return 0
    }
  }

  const setGoalPoints = async (points: number) => {
    if (!user || !currentSprint) return

    try {
      // First, deactivate any currently active goals for this sprint
      let updateQuery = supabase
        .from("goal_points")
        .update({
          is_active: false,
          end_date: new Date().toISOString(),
          points_at_end: totalCompletedPoints,
        })
        .eq("user_id", user.id)
        .eq("is_active", true)

      // Only add context filter if the column exists
      if (hasContextColumn) {
        updateQuery = updateQuery.eq("context", `sprint_${currentSprint.id}`)
      }

      await updateQuery

      // Then create the new goal
      const insertData: any = {
        user_id: user.id,
        goal_value: points,
        points_at_start: totalCompletedPoints,
        suggested_value: suggestedGoal,
        is_active: true,
      }

      // Only add context if the column exists
      if (hasContextColumn) {
        insertData.context = `sprint_${currentSprint.id}`
      }

      const { data, error } = await supabase.from("goal_points").insert(insertData).select().single()

      if (error) {
        console.error("Error inserting goal:", error)
        throw error
      }

      setGoalPointsState(points)
      setGoalId(data.id)
      setIsGoalAchieved(false)
    } catch (error) {
      console.error("Error setting sprint goal:", error)

      // Fallback to localStorage if database operations fail
      localStorage.setItem(`sprint_goal_${currentSprint.id}`, points.toString())
      setGoalPointsState(points)
      setIsGoalAchieved(false)
    }
  }

  const markGoalAchieved = async (goalId: string, currentPoints: number) => {
    try {
      await supabase
        .from("goal_points")
        .update({
          achieved: true,
          achieved_date: new Date().toISOString(),
          points_at_end: currentPoints,
        })
        .eq("id", goalId)
    } catch (error) {
      console.error("Error marking goal as achieved:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleSetGoal = async () => {
    const newGoal = Number(inputValue)

    if (isNaN(newGoal) || newGoal <= 0) {
      setInputValue(goalPoints.toString())
      return
    }

    // Check if new goal is significantly higher than previous
    if (previousGoal > 0 && newGoal > previousGoal * 1.2) {
      // 20% higher threshold
      setIsWarningOpen(true)
    } else {
      await setGoalPoints(newGoal)
    }
  }

  const handleProceed = async () => {
    await setGoalPoints(Number(inputValue))
    setIsWarningOpen(false)
  }

  const handleReschedule = () => {
    setInputValue(previousGoal.toString())
    setIsWarningOpen(false)
  }

  const handleCloseCongratsDialog = () => {
    setIsCongratsOpen(false)
    setIsGoalAchieved(false)
  }

  const handleSuggestedGoal = async () => {
    const velocity = await getHistoricalSprintVelocity()
    setInputValue(velocity.toString())
    await setGoalPoints(velocity)
  }

  // Show a message when no sprint is selected
  if (!currentSprint) {
    return (
      <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
        <div className="flex flex-col items-center justify-center py-4 space-y-3">
          <Trophy className="h-10 w-10 text-gray-300 dark:text-gray-400" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">No Active Sprint</h3>
          <p className="text-center text-gray-500 dark:text-gray-300 max-w-md">
            Sprint goal points will be shown once sprints is created
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 dark:text-gray-200 rounded-lg">Loading sprint goal...</div>
    )
  }

  return (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="font-medium text-gray-700 dark:text-gray-200">Sprint Goal Points</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-300">
            {totalCompletedPoints} / {goalPoints} points
          </div>
        </div>

        <Progress
          value={progressPercentage}
          className="h-2 bg-gray-200 dark:bg-gray-700"
        />

        <div className="flex items-center space-x-2 mt-2">
          <Input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            className="h-9 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            min="1"
          />
          <Button onClick={handleSetGoal} size="sm" className="h-9 dark:bg-indigo-600 dark:hover:bg-indigo-700">
            Set Goal
          </Button>
          <Button
            onClick={handleSuggestedGoal}
            size="sm"
            variant="outline"
            className="h-9 flex items-center dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Sparkles className="h-4 w-4 mr-1 text-yellow-500" />
            Suggest
          </Button>
        </div>

        {!hasContextColumn && (
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-2 rounded">
            Note: The database schema needs to be updated. Please run the migration script to add the context column.
          </div>
        )}
      </div>

      {/* Warning Dialog */}
      <Dialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>High Goal Warning</DialogTitle>
            <DialogDescription>
              The goal points you entered ({inputValue}) is significantly higher than your previous achievement (
              {previousGoal}). This might be challenging to achieve based on your historical performance.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={handleReschedule}>
              Reschedule
            </Button>
            <Button onClick={handleProceed}>Proceed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Congratulations Dialog */}
      <Dialog open={isCongratsOpen} onOpenChange={setIsCongratsOpen}>
        <DialogContent
          className={cn(
            "border-0 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20",
            "shadow-[0_0_30px_10px_rgba(251,191,36,0.2)]",
          )}
        >
          <DialogHeader>
            <DialogTitle className="text-xl text-center font-bold text-yellow-600 dark:text-yellow-400">
              Sprint Goal Achieved!
            </DialogTitle>
            <div className="flex justify-center py-4">
              <Trophy className="h-16 w-16 text-yellow-500" />
            </div>
            <DialogDescription className="text-center text-base">
              You've achieved your sprint goal of {goalPoints} points! Keep up the great work and continue building
              momentum.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center">
            <Button
              onClick={handleCloseCongratsDialog}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              Keep Going
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

