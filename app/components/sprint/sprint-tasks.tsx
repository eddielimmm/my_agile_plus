"use client"
import { Card, CardContent } from "@/components/ui/card"
import { useTaskContext } from "../../contexts/task-context"
import { useSprintContext } from "../../contexts/sprint-context"
import { TaskCard } from "../task-card" // Import the TaskCard component
import { CheckSquare } from "lucide-react"

interface SprintTasksProps {
  sprint: any | null
}

export function SprintTasks({ sprint }: SprintTasksProps) {
  const { tasks, updateTask, deleteTask } = useTaskContext()
  const { removeTaskFromSprint } = useSprintContext()

  const handleTaskCompletion = (taskId: string, isCompleted: boolean) => {
    const task = tasks.find((t) => t.id.toString() === taskId)
    if (task) {
      updateTask({ ...task, isCompleted })
    }
  }

  const handleRemoveTask = (taskId: string) => {
    if (sprint) {
      removeTaskFromSprint(taskId, sprint.id)
    }
  }

  const handleEditTask = (updatedTask: any) => {
    updateTask(updatedTask)
  }

  const handleDeleteTask = (taskId: number) => {
    deleteTask(taskId)
    if (sprint) {
      removeTaskFromSprint(taskId.toString(), sprint.id)
    }
  }

  // If no sprint is selected - Improved dark mode contrast
  if (!sprint) {
    return (
      <Card className="border border-gray-200 dark:border-gray-600 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 px-4">
          <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-4 mb-4">
            <CheckSquare className="h-8 w-8 text-gray-400 dark:text-gray-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No sprint selected</h3>
          <p className="text-gray-500 dark:text-gray-300 text-center max-w-sm">
            Select a sprint to view and manage its tasks
          </p>
        </CardContent>
      </Card>
    )
  }

  // If sprint has no tasks - Improved dark mode contrast
  if (!sprint.tasks || sprint.tasks.length === 0) {
    return (
      <Card className="border border-gray-200 dark:border-gray-600 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 px-4">
          <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-4 mb-4">
            <CheckSquare className="h-8 w-8 text-gray-400 dark:text-gray-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No tasks in this sprint</h3>
          <p className="text-gray-500 dark:text-gray-300 text-center max-w-sm mb-6">
            Add tasks to this sprint to start tracking your progress
          </p>
        </CardContent>
      </Card>
    )
  }

  // Filter tasks to only include those in the current sprint
  const sprintTasks = tasks.filter((task) => sprint.tasks?.includes(task.id.toString()) || false)

  return (
    <div className="space-y-4">
      {sprintTasks.map((task) => {
        // Remove priority from task object
        const { priority, ...taskWithoutPriority } = task;
        
        return (
          <TaskCard
            key={task.id}
            task={{
              ...taskWithoutPriority,
              folder: task.folder || "none",  // Ensure folder is never undefined
              timeEntries: task.timeEntries.map(entry => ({
                ...entry,
                start_time: entry.startTime || "00:00" // Use startTime instead of start_time
              }))
            }}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onComplete={(updatedTask) => handleTaskCompletion(updatedTask.id.toString(), updatedTask.isCompleted)}
            onRemoveFromSprint={() => handleRemoveTask(task.id.toString())}
            isInSprint={true}
          />
        );
      })}
    </div>
  )
}

