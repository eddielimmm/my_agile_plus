"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trophy, Sparkles } from "lucide-react"
import { useTaskContext } from "../contexts/task-context"
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

export function GoalPointsInput() {
  const { goalPoints, setGoalPoints, getHistoricalVelocity, tasks, isGoalAchieved, setIsGoalAchieved } =
    useTaskContext()
  const [inputValue, setInputValue] = useState<string>(goalPoints.toString())
  const [isWarningOpen, setIsWarningOpen] = useState<boolean>(false)
  const [isCongratsOpen, setIsCongratsOpen] = useState<boolean>(false)
  const [suggestedGoal, setSuggestedGoal] = useState<number>(0)
  const [previousGoal, setPreviousGoal] = useState<number>(0)

  // Calculate current progress
  const totalCompletedPoints = tasks.filter((task) => task.isCompleted).reduce((sum, task) => sum + task.points, 0)

  const progressPercentage = goalPoints > 0 ? Math.min(Math.round((totalCompletedPoints / goalPoints) * 100), 100) : 0

  useEffect(() => {
    // Load suggested goal based on historical velocity
    const loadSuggestedGoal = async () => {
      const velocity = await getHistoricalVelocity()
      setSuggestedGoal(velocity)
      setPreviousGoal(velocity)
    }

    loadSuggestedGoal()
  }, [getHistoricalVelocity])

  useEffect(() => {
    // Show congratulations dialog when goal is achieved
    if (isGoalAchieved && goalPoints > 0) {
      setIsCongratsOpen(true)
    }
  }, [isGoalAchieved, goalPoints])

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
    if (newGoal > previousGoal * 1.2) {
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
    setInputValue(suggestedGoal.toString())
    await setGoalPoints(suggestedGoal)
  }

  return (
    <div className="mb-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="font-medium text-gray-700 dark:text-gray-300">Goal Points</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {totalCompletedPoints} / {goalPoints} points
          </div>
        </div>

        <Progress value={progressPercentage} className="h-2" />

        <div className="flex items-center space-x-2 mt-2">
          <Input type="number" value={inputValue} onChange={handleInputChange} className="h-9" min="1" />
          <Button onClick={handleSetGoal} size="sm" className="h-9">
            Set Goal
          </Button>
          <Button onClick={handleSuggestedGoal} size="sm" variant="outline" className="h-9 flex items-center">
            <Sparkles className="h-4 w-4 mr-1 text-yellow-500" />
            Suggest
          </Button>
        </div>
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
              Congratulations!
            </DialogTitle>
            <div className="flex justify-center py-4">
              <Trophy className="h-16 w-16 text-yellow-500" />
            </div>
            <DialogDescription className="text-center text-base">
              You've achieved your goal of {goalPoints} points! Keep up the great work and continue building momentum.
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

