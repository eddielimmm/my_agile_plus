"use client"

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react"
import type { ReactNode } from "react"
import { useAuth } from "./auth-context"
import { supabase } from "@/lib/supabase"

type TaskSize = "XS" | "S" | "M" | "L" | "XL" | "XXL"
type TaskPriority = "Low" | "Medium" | "High"

interface TimeEntry {
  id: number
  date: string
  duration: number
  startTime: string
}

interface Task {
  id: number
  title: string
  size: TaskSize
  points: number
  dueDate: Date
  folder?: string
  timeEntries: TimeEntry[]
  isCompleted: boolean
  priority?: string
  description?: string
  createdAt: Date
  completedAt: Date | null
}

interface MonthlyPoints {
  [key: string]: number // Format: "YYYY-MM"
}

interface TaskContextType {
  tasks: Task[]
  addTask: (task: Omit<Task, "id" | "isCompleted" | "timeEntries" | "createdAt">) => Promise<void>
  updateTask: (task: Task) => Promise<void>
  deleteTask: (taskId: number) => Promise<void>
  monthlyPoints: MonthlyPoints
  activeTimer: { taskId: number | null; startTime: number | null; elapsedTime: number }
  startTimer: (taskId: number) => void
  stopTimer: () => void
  getElapsedTime: (taskId: number) => number
  goalPoints: number
  setGoalPoints: (points: number) => Promise<void>
  getHistoricalVelocity: () => Promise<number>
  isGoalAchieved: boolean
  setIsGoalAchieved: (achieved: boolean) => void
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [monthlyPoints, setMonthlyPoints] = useState<MonthlyPoints>({})
  const [activeTimer, setActiveTimer] = useState<{
    taskId: number | null
    startTime: number | null
    elapsedTime: number
  }>({
    taskId: null,
    startTime: null,
    elapsedTime: 0,
  })
  const { user } = useAuth()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [goalPoints, setGoalPointsState] = useState<number>(0)
  const [isGoalAchieved, setIsGoalAchievedState] = useState<boolean>(false)
  const [isReportTableInitialized, setIsReportTableInitialized] = useState<boolean>(false)

  useEffect(() => {
    let isMounted = true
    if (user) {
      const fetchData = async () => {
        try {
          await fetchTasks()
          if (isMounted) {
            // Only try to update report table if we haven't encountered initialization issues
            if (!isReportTableInitialized) {
              try {
                await initializeReportTable(user.id)
                setIsReportTableInitialized(true)
              } catch (error) {
                console.error("Error initializing report table:", error)
              }
            }
          }
        } catch (error) {
          console.error("Error fetching data:", error)
        }
      }
      fetchData()
    }
    return () => {
      isMounted = false
    }
  }, [user, isReportTableInitialized])

  useEffect(() => {
    if (user) {
      // Load goal points from localStorage
      const savedGoalPoints = localStorage.getItem(`${user.id}_goalPoints`)
      if (savedGoalPoints) {
        setGoalPointsState(Number(savedGoalPoints))
      }

      // Check if goal is achieved
      const totalCompletedPoints = tasks.filter((task) => task.isCompleted).reduce((sum, task) => sum + task.points, 0)

      if (totalCompletedPoints >= goalPoints && goalPoints > 0 && !isGoalAchieved) {
        setIsGoalAchievedState(true)
      }
    }
  }, [tasks, user, goalPoints, isGoalAchieved])

  const fetchTimeEntries = async (taskId: number) => {
    try {
      const { data, error } = await supabase.from("time_entries").select("*").eq("task_id", taskId)

      if (error) throw error
      return data.map((entry) => ({
        ...entry,
        startTime: entry.start_time, // Ensure the startTime property is set
      }))
    } catch (error) {
      console.error("Error fetching time entries:", error)
      return []
    }
  }

  async function fetchTasks() {
    try {
      const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      const formattedTasks = await Promise.all(
        data.map(async (task: any) => {
          const timeEntries = await fetchTimeEntries(task.id)
          return {
            ...task,
            dueDate: new Date(task.due_date),
            createdAt: new Date(task.created_at),
            timeEntries: timeEntries,
            isCompleted: task.is_completed,
          }
        }),
      )

      setTasks(formattedTasks)
      updateMonthlyPoints(formattedTasks)
    } catch (error) {
      console.error("Error fetching tasks:", error)
    }
  }

  const updateMonthlyPoints = (tasks: Task[]) => {
    const points: MonthlyPoints = {}
    tasks.forEach((task) => {
      if (task.isCompleted) {
        const monthKey = task.createdAt.toISOString().slice(0, 7)
        points[monthKey] = (points[monthKey] || 0) + task.points
      }
    })
    setMonthlyPoints(points)
  }

  const addTask = async (newTask: Omit<Task, "id" | "isCompleted" | "timeEntries" | "createdAt">) => {
    try {
      // Define the type of taskData to include folder property
      const taskData: {
        title: string;
        size: TaskSize;
        points: number;
        due_date: string;
        priority?: string;
        description?: string;
        user_id?: string;
        folder?: string;  // Add folder to the type
      } = {
        title: newTask.title,
        size: newTask.size,
        points: newTask.points,
        due_date: newTask.dueDate.toISOString(),
        priority: newTask.priority,
        description: newTask.description,
        user_id: user?.id,
      }

      // Only include folder if it's defined
      if (newTask.folder) {
        taskData.folder = newTask.folder
      }

      const { data, error } = await supabase.from("tasks").insert(taskData).select()

      if (error) {
        throw error
      }

      const createdTask: Task = {
        ...data[0],
        dueDate: new Date(data[0].due_date),
        createdAt: new Date(data[0].created_at),
        timeEntries: [],
        isCompleted: false,
      }

      setTasks((prevTasks) => [createdTask, ...prevTasks])

      // Only try to update report if we've successfully initialized the table
      if (isReportTableInitialized && user?.id) {
        try {
          await updateLocalReportData(user.id)
        } catch (error) {
          console.error("Error updating report after adding task:", error)
        }
      }
    } catch (error: unknown) {
      console.error("Error adding task:", error instanceof Error ? error.message : error)
      throw error
    }
  }

  const updateTask = async (updatedTask: Task) => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          title: updatedTask.title,
          size: updatedTask.size,
          points: updatedTask.points,
          due_date: updatedTask.dueDate.toISOString(),
          folder: updatedTask.folder,
          description: updatedTask.description,
          is_completed: updatedTask.isCompleted,
          completed_at: updatedTask.isCompleted ? new Date().toISOString() : null,
        })
        .eq("id", updatedTask.id)
        .select()

      if (error) {
        throw error
      }

      if (data && data.length > 0) {
        const updatedTaskFromDB = {
          ...data[0],
          dueDate: new Date(data[0].due_date),
          createdAt: new Date(data[0].created_at),
          isCompleted: data[0].is_completed,
          completedAt: data[0].completed_at ? new Date(data[0].completed_at) : null,
          timeEntries: updatedTask.timeEntries,
        }

        setTasks((prevTasks) => prevTasks.map((task) => (task.id === updatedTaskFromDB.id ? updatedTaskFromDB : task)))
        updateMonthlyPoints([...tasks])
      }

      // Only try to update report if we've successfully initialized the table
      if (isReportTableInitialized && user?.id) {
        try {
          await updateLocalReportData(user.id)
        } catch (error) {
          console.error("Error updating report after updating task:", error)
        }
      }
    } catch (error: unknown) {
      console.error("Error updating task:", error instanceof Error ? error.message : JSON.stringify(error))
      throw error
    }
  }

  const deleteTask = async (taskId: number) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId)

      if (error) {
        throw new Error(`Error deleting task: ${error.message}`)
      }

      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
      updateMonthlyPoints(tasks.filter((task) => task.id !== taskId))

      // Only try to update report if we've successfully initialized the table
      if (isReportTableInitialized && user?.id) {
        try {
          await updateLocalReportData(user.id)
        } catch (error) {
          console.error("Error updating report after deleting task:", error)
        }
      }
    } catch (error: unknown) {
      console.error("Error deleting task:", error instanceof Error ? error.message : error)
      throw error
    }
  }

  const startTimer = useCallback((taskId: number) => {
    setActiveTimer((prev) => ({
      taskId,
      startTime: Date.now(),
      elapsedTime: prev.taskId === taskId ? prev.elapsedTime : 0,
    }))
  }, [])

  const stopTimer = useCallback(async () => {
    if (activeTimer.taskId !== null && activeTimer.startTime !== null) {
      const task = tasks.find((t) => t.id === activeTimer.taskId)
      if (task) {
        const duration = Math.floor((Date.now() - activeTimer.startTime + activeTimer.elapsedTime) / 1000)
        const newTimeEntry = {
          task_id: task.id,
          date: new Date().toISOString().split("T")[0],
          duration: duration,
          start_time: new Date(activeTimer.startTime).toISOString(),
          user_id: user?.id,
        }

        try {
          const { data, error } = await supabase.from("time_entries").insert(newTimeEntry).select()
          if (error) throw error

          setTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    timeEntries: [...t.timeEntries, data[0]],
                  }
                : t,
            ),
          )

          // Only try to update report if we've successfully initialized the table
          if (isReportTableInitialized && user?.id) {
            try {
              await updateLocalReportData(user.id)
            } catch (error) {
              console.error("Error updating report after stopping timer:", error)
            }
          }
        } catch (error) {
          console.error("Error saving time entry:", error)
        }
      }
    }
    setActiveTimer({ taskId: null, startTime: null, elapsedTime: 0 })
  }, [activeTimer, tasks, user?.id, isReportTableInitialized])

  const getElapsedTime = useCallback(
    (taskId: number): number => {
      if (activeTimer.taskId === taskId) {
        return activeTimer.elapsedTime
      }
      return 0
    },
    [activeTimer],
  )

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    if (activeTimer.taskId !== null && activeTimer.startTime !== null) {
      intervalId = setInterval(() => {
        setActiveTimer((prev) => ({
          ...prev,
          elapsedTime: prev.elapsedTime + 1,
        }))
      }, 1000)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [activeTimer.taskId, activeTimer.startTime])

  // Check if the reports table exists and has the correct RLS policies
  const initializeReportTable = async (userId: string) => {
    try {
      // First, check if we can access the reports table
      const { data: reportData, error: reportError } = await supabase.from("reports").select("*").limit(1)

      // If we get an RLS error, we'll store report data locally instead
      if (reportError && reportError.code === "PGRST301") {
        console.log("RLS policy preventing access to reports table. Using local storage instead.")
        return false
      }

      // If we can access the table, try to update it
      return await updateReportTable(userId)
    } catch (error) {
      console.error("Error initializing report table:", error)
      return false
    }
  }

  // This function will update the report data in Supabase if possible
  // If not, it will fall back to using localStorage
  const updateReportTable = async (userId: string): Promise<boolean> => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Calculate report data
      const reportData = calculateReportData(userId, today)

      // Try to upsert to Supabase
      const { error } = await supabase.from("reports").upsert(reportData, { onConflict: "user_id,report_date" })

      if (error) {
        if (error.code === "PGRST301") {
          // RLS policy error - fall back to localStorage
          saveReportToLocalStorage(reportData)
          return false
        }
        throw error
      }

      return true
    } catch (error) {
      console.error("Error updating report table:", error)
      // Fall back to localStorage on any error
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const reportData = calculateReportData(userId, today)
      saveReportToLocalStorage(reportData)
      return false
    }
  }

  // Update report data locally (either in Supabase or localStorage)
  const updateLocalReportData = async (userId: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Calculate report data
    const reportData = calculateReportData(userId, today)

    if (isReportTableInitialized) {
      try {
        // Try to update in Supabase
        const { error } = await supabase.from("reports").upsert(reportData, { onConflict: "user_id,report_date" })

        if (error) {
          // Fall back to localStorage
          saveReportToLocalStorage(reportData)
        }
      } catch (error) {
        // Fall back to localStorage
        saveReportToLocalStorage(reportData)
      }
    } else {
      // Just use localStorage
      saveReportToLocalStorage(reportData)
    }
  }

  // Helper function to calculate report data
  const calculateReportData = (userId: string, date: Date) => {
    return {
      user_id: userId,
      report_date: date.toISOString(),
      total_time: tasks.reduce((sum, task) => {
        return sum + (task.timeEntries ? task.timeEntries.reduce((s, e) => s + (e.duration || 0), 0) : 0)
      }, 0),
      completed_tasks: tasks.filter((task) => task.isCompleted && new Date(task.completedAt || "") <= date).length,
      points_earned: tasks.reduce((sum, task) => {
        if (task.isCompleted && new Date(task.completedAt || "") <= date) {
          return sum + (task.points || 0)
        }
        return sum
      }, 0),
      task_size_breakdown: JSON.stringify(
        tasks.reduce(
          (acc, task) => {
            if (task.size && (!task.completedAt || new Date(task.completedAt) <= date)) {
              acc[task.size] = (acc[task.size] || 0) + 1
            }
            return acc
          },
          {} as Record<string, number>,
        ),
      ),
      time_distribution: JSON.stringify(
        tasks.reduce(
          (acc, task) => {
            if (task.timeEntries) {
              task.timeEntries.forEach((entry) => {
                if (entry.startTime && new Date(entry.startTime) <= date) {
                  const hour = new Date(entry.startTime).getHours()
                  acc[hour] = (acc[hour] || 0) + (entry.duration || 0)
                }
              })
            }
            return acc
          },
          {} as Record<number, number>,
        ),
      ),
      completion_time_averages: JSON.stringify(
        Object.fromEntries(
          Object.entries(
            tasks.reduce(
              (acc, task) => {
                if (task.isCompleted && task.size && task.timeEntries && new Date(task.completedAt || "") <= date) {
                  const totalTime = task.timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
                  if (!acc[task.size]) acc[task.size] = []
                  acc[task.size].push(totalTime)
                }
                return acc
              },
              {} as Record<string, number[]>,
            ),
          ).map(([size, times]) => [size, times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0]),
        ),
      ),
      monthly_points: JSON.stringify(
        tasks.reduce(
          (acc, task) => {
            if (task.isCompleted && task.completedAt && new Date(task.completedAt) <= date) {
              const monthKey = new Date(task.completedAt).toISOString().slice(0, 7)
              acc[monthKey] = (acc[monthKey] || 0) + (task.points || 0)
            }
            return acc
          },
          {} as Record<string, number>,
        ),
      ),
    }
  }

  // Helper function to save report data to localStorage
  const saveReportToLocalStorage = (reportData: any) => {
    if (user) {
      const key = `${user.id}_report_${reportData.report_date.split("T")[0]}`
      localStorage.setItem(key, JSON.stringify(reportData))
    }
  }

  // Helper function to get report data from localStorage
  const getReportFromLocalStorage = (date: Date): any | null => {
    if (!user) return null

    const dateStr = date.toISOString().split("T")[0]
    const key = `${user.id}_report_${dateStr}`
    const reportStr = localStorage.getItem(key)

    if (reportStr) {
      try {
        return JSON.parse(reportStr)
      } catch (e) {
        return null
      }
    }
    return null
  }

  const setGoalPoints = async (points: number) => {
    setGoalPointsState(points)
    if (user) {
      localStorage.setItem(`${user.id}_goalPoints`, points.toString())
    }
  }

  const getHistoricalVelocity = async (): Promise<number> => {
    if (!user) return 0

    try {
      // Get completed tasks from the last 4 weeks
      const fourWeeksAgo = new Date()
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

      const completedTasks = tasks.filter((task) => task.isCompleted && new Date(task.createdAt) >= fourWeeksAgo)

      if (completedTasks.length === 0) return 0

      // Calculate average weekly points
      const totalPoints = completedTasks.reduce((sum, task) => sum + task.points, 0)
      return Math.round(totalPoints / 4) // Average weekly points
    } catch (error) {
      console.error("Error calculating historical velocity:", error)
      return 0
    }
  }

  const setIsGoalAchieved = async (achieved: boolean) => {
    setIsGoalAchievedState(achieved)
  }

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        monthlyPoints,
        activeTimer,
        startTimer,
        stopTimer,
        getElapsedTime,
        goalPoints,
        setGoalPoints,
        getHistoricalVelocity,
        isGoalAchieved,
        setIsGoalAchieved,
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}

export function useTaskContext() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error("useTaskContext must be used within a TaskProvider")
  }
  return context
}

// Function to create the user_settings table
async function createUserSettingsTable() {
  const { error } = await supabase.rpc("create_user_settings_table")
  if (error) console.error("Error creating user_settings table:", error)
}

export type { Task }

