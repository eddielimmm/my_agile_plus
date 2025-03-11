"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"
import { supabase } from "@/lib/supabase"

interface Sprint {
  id: string
  name: string
  startDate: Date
  endDate: Date
  tasks: string[]
  taskDetails?: any[] // Optional field to store task details
}

interface SprintContextType {
  sprints: Sprint[]
  createSprint: (sprint: Omit<Sprint, "id">) => Promise<{ success: boolean; message?: string }>
  updateSprint: (sprint: Sprint) => Promise<void>
  deleteSprint: (sprintId: string) => Promise<void>
  addTasksToSprint: (sprintId: string, taskIds: string[]) => Promise<void>
  removeTaskFromSprint: (taskId: string, sprintId: string) => Promise<void>
  currentSprint: Sprint | null
  setCurrentSprint: (sprintId: string) => void
}

const SprintContext = createContext<SprintContextType | undefined>(undefined)

export function SprintProvider({ children }: { children: React.ReactNode }) {
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [currentSprint, setCurrentSprintState] = useState<Sprint | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchSprints()
    }
  }, [user])

  const fetchSprints = async () => {
    try {
      const { data, error } = await supabase
        .from("sprints")
        .select("*")
        .eq("user_id", user?.id)
        .order("start_date", { ascending: true })

      if (error) throw error

      const formattedSprints: Sprint[] = data.map((sprint) => ({
        ...sprint,
        startDate: new Date(sprint.start_date),
        endDate: new Date(sprint.end_date),
        tasks: sprint.tasks || [],
      }))

      setSprints(formattedSprints)

      // Set current sprint if there's one active
      const currentDate = new Date()
      const activeSprint = formattedSprints.find(
        (sprint) => sprint.startDate <= currentDate && sprint.endDate >= currentDate,
      )
      if (activeSprint) {
        setCurrentSprintState(activeSprint)
      }
    } catch (error) {
      console.error("Error fetching sprints:", error)
    }
  }

  const createSprint = async (sprint: Omit<Sprint, "id">): Promise<{ success: boolean; message?: string }> => {
    try {
      // Check for date conflicts
      const { data: conflictingSprints, error: conflictError } = await supabase
        .from("sprints")
        .select("*")
        .eq("user_id", user?.id)
        .or(`and(start_date.lt.${sprint.endDate.toISOString()},end_date.gt.${sprint.startDate.toISOString()})`)

      if (conflictError) throw conflictError

      if (conflictingSprints && conflictingSprints.length > 0) {
        return {
          success: false,
          message: "The selected date range overlaps with an existing sprint. Please choose a different time range.",
        }
      }

      const { data, error } = await supabase
        .from("sprints")
        .insert({
          name: sprint.name,
          start_date: sprint.startDate.toISOString(),
          end_date: sprint.endDate.toISOString(),
          user_id: user?.id,
        })
        .select()

      if (error) throw error

      const newSprint: Sprint = {
        ...data[0],
        startDate: new Date(data[0].start_date),
        endDate: new Date(data[0].end_date),
        tasks: [],
      }

      setSprints((prevSprints) => [...prevSprints, newSprint])
      return { success: true }
    } catch (error) {
      console.error("Error creating sprint:", error)
      return { success: false, message: "Failed to create sprint" }
    }
  }

  const updateSprint = async (updatedSprint: Sprint): Promise<void> => {
    try {
      const { error } = await supabase
        .from("sprints")
        .update({
          name: updatedSprint.name,
          start_date: updatedSprint.startDate.toISOString(),
          end_date: updatedSprint.endDate.toISOString(),
          tasks: updatedSprint.tasks,
        })
        .eq("id", updatedSprint.id)

      if (error) throw error

      setSprints((prevSprints) =>
        prevSprints.map((sprint) => (sprint.id === updatedSprint.id ? updatedSprint : sprint)),
      )

      if (currentSprint?.id === updatedSprint.id) {
        setCurrentSprintState(updatedSprint)
      }
    } catch (error) {
      console.error("Error updating sprint:", error)
    }
  }

  const deleteSprint = async (sprintId: string): Promise<void> => {
    try {
      const { error } = await supabase.from("sprints").delete().eq("id", sprintId)

      if (error) throw error

      setSprints((prevSprints) => prevSprints.filter((sprint) => sprint.id !== sprintId))

      if (currentSprint?.id === sprintId) {
        setCurrentSprintState(null)
      }
    } catch (error) {
      console.error("Error deleting sprint:", error)
    }
  }

  const addTasksToSprint = async (sprintId: string, taskIds: string[]): Promise<void> => {
    try {
      const sprint = sprints.find((s) => s.id === sprintId)
      if (!sprint) return

      // Create a unique array without using Set spread
      const uniqueTasks = Array.from(new Set([...sprint.tasks, ...taskIds]))

      const { error } = await supabase.from("sprints").update({ tasks: uniqueTasks }).eq("id", sprintId)

      if (error) throw error

      const updatedSprint = { ...sprint, tasks: uniqueTasks }
      setSprints((prevSprints) => prevSprints.map((s) => (s.id === sprintId ? updatedSprint : s)))

      if (currentSprint?.id === sprintId) {
        setCurrentSprintState(updatedSprint)
      }
    } catch (error) {
      console.error("Error adding tasks to sprint:", error)
    }
  }

  const removeTaskFromSprint = async (taskId: string, sprintId: string): Promise<void> => {
    try {
      const sprint = sprints.find((s) => s.id === sprintId)
      if (!sprint) return

      const updatedTasks = sprint.tasks.filter((id) => id !== taskId)

      const { error } = await supabase.from("sprints").update({ tasks: updatedTasks }).eq("id", sprintId)

      if (error) throw error

      const updatedSprint = { ...sprint, tasks: updatedTasks }
      setSprints((prevSprints) => prevSprints.map((s) => (s.id === sprintId ? updatedSprint : s)))

      if (currentSprint?.id === sprintId) {
        setCurrentSprintState(updatedSprint)
      }
    } catch (error) {
      console.error("Error removing task from sprint:", error)
    }
  }

  const setCurrentSprint = (sprintId: string) => {
    const sprint = sprints.find((s) => s.id === sprintId) || null
    setCurrentSprintState(sprint)
  }

  return (
    <SprintContext.Provider
      value={{
        sprints,
        createSprint,
        updateSprint,
        deleteSprint,
        addTasksToSprint,
        removeTaskFromSprint,
        currentSprint,
        setCurrentSprint,
      }}
    >
      {children}
    </SprintContext.Provider>
  )
}

export function useSprintContext() {
  const context = useContext(SprintContext)
  if (context === undefined) {
    throw new Error("useSprintContext must be used within a SprintProvider")
  }
  return context
}

