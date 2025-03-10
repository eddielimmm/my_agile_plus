"use client"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  CalendarIcon,
  Clock,
  Edit,
  Trash2,
  Flag,
  Play,
  Pause,
  Check,
  Plus,
  ChevronDown,
  ChevronUp,
  SmartphoneIcon as Sprint,
  ArrowRight,
  X,
} from "lucide-react"
import { format, differenceInMinutes, parse, isValid } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useTaskContext } from "../contexts/task-context"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "../contexts/auth-context"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useSprintContext } from "../contexts/sprint-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TaskSize = "XS" | "S" | "M" | "L" | "XL" | "XXL"
type TaskPriority = "Low" | "Medium" | "High"

interface Task {
  id: number
  title: string
  size: TaskSize
  points: number
  dueDate: Date
  folder: string
  timeEntries: { id: number; date: string; duration: number; start_time: string }[]
  isCompleted: boolean
  priority?: TaskPriority
  description?: string
}

const getSizeColor = (size: TaskSize) => {
  const colors = {
    XS: "bg-[#81c784] text-white",
    S: "bg-[#64b5f6] text-white",
    M: "bg-[#ffd54f] text-gray-800",
    L: "bg-[#ff9800] text-white",
    XL: "bg-[#f48fb1] text-white",
    XXL: "bg-[#ce93d8] text-white",
  }
  return colors[size]
}

const getPriorityColor = (priority: TaskPriority) => {
  const colors = {
    Low: "text-green-500",
    Medium: "text-yellow-500",
    High: "text-red-500",
  }
  return colors[priority]
}

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: number) => void
  onComplete: (task: Task) => void
  onRemoveFromSprint?: () => void // New prop for removing from sprint
  isInSprint?: boolean // New prop to indicate if the task is in a sprint view
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onComplete,
  onRemoveFromSprint,
  isInSprint = false,
}: TaskCardProps) {
  const { updateTask, activeTimer, startTimer, stopTimer, getElapsedTime } = useTaskContext()
  const { sprints, addTasksToSprint } = useSprintContext() // Changed from addTaskToSprint to addTasksToSprint
  const [isManualTimeDialogOpen, setIsManualTimeDialogOpen] = useState(false)
  const [manualDate, setManualDate] = useState<Date | undefined>(new Date())
  const [manualHours, setManualHours] = useState("0")
  const [manualMinutes, setManualMinutes] = useState("0")
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [totalTime, setTotalTime] = useState(0)
  const [currentTimer, setCurrentTimer] = useState(0)
  const { user } = useAuth()
  const [isMoveToSprintDialogOpen, setIsMoveToSprintDialogOpen] = useState(false)
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null)
  const [timeEntryMethod, setTimeEntryMethod] = useState<"duration" | "range">("range")
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [calculatedDuration, setCalculatedDuration] = useState({ hours: "1", minutes: "0" })

  useEffect(() => {
    const total = task.timeEntries.reduce((sum, entry) => sum + entry.duration, 0)
    setTotalTime(total)
  }, [task.timeEntries])

  const updateCurrentTimer = useCallback(() => {
    if (activeTimer.taskId === task.id) {
      setCurrentTimer(activeTimer.elapsedTime)
    } else {
      setCurrentTimer(0)
    }
  }, [activeTimer, task.id])

  useEffect(() => {
    updateCurrentTimer()
    const intervalId = setInterval(updateCurrentTimer, 1000)
    return () => clearInterval(intervalId)
  }, [updateCurrentTimer])

  // Calculate duration when start or end time changes
  useEffect(() => {
    if (timeEntryMethod === "range" && manualDate) {
      try {
        const dateStr = format(manualDate, "yyyy-MM-dd")

        const startDateTime = parse(`${dateStr} ${startTime}`, "yyyy-MM-dd HH:mm", new Date())
        const endDateTime = parse(`${dateStr} ${endTime}`, "yyyy-MM-dd HH:mm", new Date())

        // Handle case where end time is on the next day
        let adjustedEndDateTime = endDateTime
        if (endDateTime < startDateTime) {
          adjustedEndDateTime = new Date(endDateTime)
          adjustedEndDateTime.setDate(adjustedEndDateTime.getDate() + 1)
        }

        if (isValid(startDateTime) && isValid(adjustedEndDateTime)) {
          const diffMinutes = differenceInMinutes(adjustedEndDateTime, startDateTime)
          const hours = Math.floor(diffMinutes / 60)
          const minutes = diffMinutes % 60

          setCalculatedDuration({
            hours: hours.toString(),
            minutes: minutes.toString(),
          })
        }
      } catch (error) {
        console.error("Error calculating time difference:", error)
      }
    }
  }, [startTime, endTime, manualDate, timeEntryMethod])

  const handleStartTracking = () => {
    startTimer(task.id)
  }

  const handlePauseTracking = () => {
    stopTimer()
  }

  const handleCompleteTask = async () => {
    try {
      stopTimer()
      const updatedTask = {
        ...task,
        isCompleted: true,
        completedAt: new Date(),
      }
      await updateTask(updatedTask)
    } catch (error) {
      console.error("Error completing task:", error.message || JSON.stringify(error))
    }
  }

  const isTracking = activeTimer.taskId === task.id

  const handleOpenManualTimeDialog = () => {
    setIsManualTimeDialogOpen(true)
    setManualDate(new Date())
    setManualHours("0")
    setManualMinutes("0")
    setStartTime("09:00")
    setEndTime("10:00")
    setTimeEntryMethod("range")
    setCalculatedDuration({ hours: "1", minutes: "0" })
  }

  const handleCloseManualTimeDialog = () => {
    setIsManualTimeDialogOpen(false)
  }

  const handleAddManualTime = async () => {
    let startTimeStr: string
    let duration: number

    if (timeEntryMethod === "duration") {
      // Direct duration entry
      duration = (Number.parseInt(manualHours) * 60 + Number.parseInt(manualMinutes)) * 60
      startTimeStr = manualDate ? new Date(manualDate).toISOString() : new Date().toISOString()
    } else {
      // Time range entry
      duration = (Number.parseInt(calculatedDuration.hours) * 60 + Number.parseInt(calculatedDuration.minutes)) * 60
      const dateStr = manualDate ? format(manualDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
      startTimeStr = parse(`${dateStr} ${startTime}`, "yyyy-MM-dd HH:mm", new Date()).toISOString()
    }

    if (duration > 0 && manualDate) {
      const newTimeEntry = {
        task_id: task.id,
        date: format(manualDate, "yyyy-MM-dd"),
        duration: duration,
        start_time: startTimeStr,
        user_id: user?.id,
      }

      try {
        const { data, error } = await supabase.from("time_entries").insert(newTimeEntry).select()
        if (error) throw error

        const updatedTask = {
          ...task,
          timeEntries: [...task.timeEntries, data[0]],
        }
        updateTask(updatedTask)
      } catch (error) {
        console.error("Error adding manual time:", error)
      }
    }
    handleCloseManualTimeDialog()
  }

  const isAddTimeDisabled =
    (timeEntryMethod === "duration" && Number(manualHours) === 0 && Number(manualMinutes) === 0) ||
    (timeEntryMethod === "range" &&
      Number(calculatedDuration.hours) === 0 &&
      Number(calculatedDuration.minutes) === 0) ||
    !manualDate

  // Remove the handleMoveToSprint function and related state

  return (
    <Card className="hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-700 border-0">
      <CardContent className="p-5">
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-grow">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{task.title}</h4>
              {task.isCompleted && (
                <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                  Completed
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center bg-gray-50 dark:bg-gray-700 px-2.5 py-1 rounded-full">
                <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-500 dark:text-gray-400" />
                {format(task.dueDate, "MMM d, yyyy")}
              </div>
              <div className="flex items-center bg-gray-50 dark:bg-gray-700 px-2.5 py-1 rounded-full">
                <Clock className="h-4 w-4 mr-1.5 text-gray-500 dark:text-gray-400" />
                {format(task.dueDate, "h:mm a")}
              </div>
              {task.folder && (
                <div className="flex items-center bg-gray-50 dark:bg-gray-700 px-2.5 py-1 rounded-full">
                  <Flag className="h-4 w-4 mr-1.5 text-gray-500 dark:text-gray-400" />
                  {task.folder}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSizeColor(task.size)}`}>
              {task.size} ({task.points} pts)
            </span>
            {task.priority && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority} Priority
              </span>
            )}
          </div>
        </div>

        {/* Description Section */}
        {task.description && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            >
              {isDescriptionExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1.5" />
                  Hide Description
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1.5" />
                  Show Description
                </>
              )}
            </Button>
            {isDescriptionExpanded && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-600 p-3 rounded-lg">
                {task.description}
              </p>
            )}
          </div>
        )}

        {/* Timer Section */}
        <div className="mt-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="font-mono text-2xl font-medium">{formatTime(currentTimer)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Total: {formatTime(totalTime + currentTimer)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={isTracking ? handlePauseTracking : handleStartTracking}
                className={cn(
                  "flex-1 h-10 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700",
                  isTracking && "bg-gray-100 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-700",
                )}
                disabled={task.isCompleted}
              >
                {isTracking ? (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Start
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleOpenManualTimeDialog}
                className="flex-1 h-10 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                disabled={task.isCompleted}
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Time
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-4">
            <div className="space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(task)}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Edit className="h-4 w-4 mr-1.5" /> Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(task.id)}
                className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-700 dark:hover:text-red-300"
              >
                <Trash2 className="h-4 w-4 mr-1.5" /> Delete
              </Button>
              {isInSprint && onRemoveFromSprint && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemoveFromSprint}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <X className="h-4 w-4 mr-1.5" /> Remove from Sprint
                </Button>
              )}
              {!isInSprint && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMoveToSprintDialogOpen(true)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Sprint className="h-4 w-4 mr-1.5" /> Move to Sprint
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCompleteTask}
              className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
              disabled={task.isCompleted}
            >
              <Check className="h-4 w-4 mr-1.5" /> Done
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Enhanced Manual Time Dialog */}
      <Dialog open={isManualTimeDialogOpen} onOpenChange={setIsManualTimeDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Time Manually</DialogTitle>
            <DialogDescription>Track time spent on this task</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex flex-col space-y-4">
              {/* Date Picker */}
              <div className="space-y-2">
                <Label htmlFor="manualDate" className="font-medium">
                  Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !manualDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {manualDate ? format(manualDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={manualDate} onSelect={setManualDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Entry Method Tabs */}
              <Tabs
                defaultValue="range"
                value={timeEntryMethod}
                onValueChange={(value) => setTimeEntryMethod(value as "duration" | "range")}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="range">Time Range</TabsTrigger>
                  <TabsTrigger value="duration">Duration</TabsTrigger>
                </TabsList>

                {/* Time Range Tab */}
                <TabsContent value="range" className="space-y-4 mt-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="startTime" className="font-medium">
                        Start Time
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <Input
                          type="time"
                          id="startTime"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="pl-10 h-10 border-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-center pt-6">
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>

                    <div className="flex-1 space-y-2">
                      <Label htmlFor="endTime" className="font-medium">
                        End Time
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <Input
                          type="time"
                          id="endTime"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="pl-10 h-10 border-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Calculated Duration: {calculatedDuration.hours} hours {calculatedDuration.minutes} minutes
                    </div>
                  </div>
                </TabsContent>

                {/* Duration Tab */}
                <TabsContent value="duration" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="manualHours" className="font-medium">
                        Hours
                      </Label>
                      <Input
                        type="number"
                        id="manualHours"
                        value={manualHours}
                        onChange={(e) => setManualHours(e.target.value)}
                        min="0"
                        className="h-10 border-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manualMinutes" className="font-medium">
                        Minutes
                      </Label>
                      <Input
                        type="number"
                        id="manualMinutes"
                        value={manualMinutes}
                        onChange={(e) => setManualMinutes(e.target.value)}
                        min="0"
                        max="59"
                        className="h-10 border-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Button
                onClick={handleAddManualTime}
                className="w-full mt-6 bg-[#7C3AED] hover:bg-[#6D28D9]"
                disabled={isAddTimeDisabled}
              >
                Add Time
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Only render Move to Sprint Dialog if not in sprint view */}
      {!isInSprint && (
        <Dialog open={isMoveToSprintDialogOpen} onOpenChange={setIsMoveToSprintDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Move Task to Sprint</DialogTitle>
            </DialogHeader>
            <Select onValueChange={setSelectedSprintId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a sprint" />
              </SelectTrigger>
              <SelectContent>
                {sprints.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                if (selectedSprintId) {
                  addTasksToSprint(selectedSprintId, [task.id.toString()])
                  setIsMoveToSprintDialogOpen(false)
                  setSelectedSprintId(null)
                }
              }}
              disabled={!selectedSprintId}
            >
              Move to Sprint
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}

