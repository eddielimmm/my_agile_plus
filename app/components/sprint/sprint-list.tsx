"use client"

import type React from "react"

import { useState } from "react"
import { useSprintContext } from "../../contexts/sprint-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ChevronRight, Plus, Trash2, ClipboardList } from "lucide-react"
import { format } from "date-fns"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AddTaskToSprintDialog } from "./add-task-to-sprint-dialog"
import { useTaskContext } from "../../contexts/task-context"

interface SprintListProps {
  onCreateSprint: () => void
}

export function SprintList({ onCreateSprint }: SprintListProps) {
  const { sprints, currentSprint, setCurrentSprint, deleteSprint } = useSprintContext()
  const { tasks } = useTaskContext()
  const [sprintToDelete, setSprintToDelete] = useState<string | null>(null)
  const [sprintToAddTask, setSprintToAddTask] = useState<string | null>(null)

  const handleSprintClick = (sprintId: string) => {
    setCurrentSprint(sprintId)
  }

  const handleDeleteClick = (e: React.MouseEvent, sprintId: string) => {
    e.stopPropagation()
    setSprintToDelete(sprintId)
  }

  const handleAddTaskClick = (e: React.MouseEvent, sprintId: string) => {
    e.stopPropagation()
    setSprintToAddTask(sprintId)
  }

  const confirmDelete = async () => {
    if (sprintToDelete) {
      await deleteSprint(sprintToDelete)
      setSprintToDelete(null)
    }
  }

  if (!sprints || sprints.length === 0) {
    return (
      <Card className="border border-gray-200 dark:border-gray-600 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 px-4">
          <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-4 mb-4">
            <ClipboardList className="h-8 w-8 text-gray-400 dark:text-gray-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No sprints found</h3>
          <p className="text-gray-500 dark:text-gray-300 text-center max-w-sm mb-6">
            Create your first sprint to start organizing and tracking your tasks
          </p>
          <Button
            onClick={onCreateSprint}
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Sprint
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {sprints.map((sprint) => {
        const sprintTasks = tasks.filter((task) => sprint.tasks.includes(task.id.toString()))
        const totalTasks = sprintTasks.length
        const completedTasks = sprintTasks.filter((task) => task.isCompleted).length
        const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

        return (
          <Card
            key={sprint.id}
            className={`cursor-pointer hover:shadow-md transition-shadow dark:border-gray-700 ${
              currentSprint?.id === sprint.id
                ? "border-indigo-300 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-900/30"
                : "dark:bg-gray-800"
            }`}
            onClick={() => handleSprintClick(sprint.id)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{sprint.name}</h3>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-300">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {format(new Date(sprint.startDate), "MMM d, yyyy")} -{" "}
                    {format(new Date(sprint.endDate), "MMM d, yyyy")}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-indigo-600 border-indigo-200 hover:bg-indigo-50 
                              dark:text-indigo-300 dark:border-indigo-700 dark:hover:bg-indigo-950 dark:hover:text-indigo-200"
                    onClick={(e) => handleAddTaskClick(e, sprint.id)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Task
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50 
                              dark:text-red-300 dark:border-red-800 dark:hover:bg-red-950 dark:hover:text-red-200"
                    onClick={(e) => handleDeleteClick(e, sprint.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                  <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-300" />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-300">
                    {completedTasks}/{totalTasks} tasks
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">{completionPercentage}% complete</span>
                </div>
                <Progress
                  value={completionPercentage}
                  className="h-2 bg-gray-200 dark:bg-gray-700"
                />
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Delete Confirmation Dialog - Improved dark mode contrast */}
      <AlertDialog open={!!sprintToDelete} onOpenChange={(open) => !open && setSprintToDelete(null)}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-gray-100">Delete Sprint</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-300">
              Are you sure you want to delete this sprint? This action cannot be undone and all sprint data will be
              lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Task to Sprint Dialog */}
      <AddTaskToSprintDialog
        isOpen={!!sprintToAddTask}
        onClose={() => setSprintToAddTask(null)}
        sprintId={sprintToAddTask || ""}
      />
    </div>
  )
}

