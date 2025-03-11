"use client"

import { useState } from "react"
import { TaskCard } from "./task-card"
import { useTaskContext } from "../contexts/task-context"

interface FolderTasksProps {
  folderName: string
}

export function FolderTasks({ folderName }: FolderTasksProps) {
  const { tasks, updateTask, deleteTask } = useTaskContext()
  
  // Get tasks for this folder
  const folderTasks = tasks.filter(task => task.folder === folderName)
  
  const handleEditTask = (updatedTask: any) => {
    updateTask(updatedTask)
  }
  
  const handleCompleteTask = (completedTask: any) => {
    updateTask(completedTask)
  }
  
  const handleDeleteTask = (taskId: number) => {
    deleteTask(taskId)
  }
  
  if (folderTasks.length === 0) {
    return <div className="text-center py-4 text-gray-500">No tasks in this folder</div>
  }
  
  return (
    <div className="space-y-4">
      {folderTasks.map(task => {
        // Create a new task object without the priority property
        const { priority, ...taskWithoutPriority } = task;
        
        return (
          <TaskCard
            key={task.id}
            task={{
              ...taskWithoutPriority,
              folder: task.folder || "none",
              timeEntries: task.timeEntries.map(entry => ({
                ...entry,
                start_time: entry.startTime || "00:00"
              }))
            }}
            onEdit={handleEditTask}
            onComplete={handleCompleteTask}
            onDelete={handleDeleteTask}
          />
        );
      })}
    </div>
  )
} 