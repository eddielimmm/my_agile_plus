"use client"

import { useState, useEffect } from "react"
import { useTaskContext } from "../../contexts/task-context"
import { useSprintContext } from "../../contexts/sprint-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface AddTaskToSprintDialogProps {
  isOpen: boolean
  onClose: () => void
  sprintId: string
}

export function AddTaskToSprintDialog({ isOpen, onClose, sprintId }: AddTaskToSprintDialogProps) {
  const { tasks } = useTaskContext()
  const { sprints, addTasksToSprint } = useSprintContext() // Make sure we're using addTasksToSprint here
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const sprint = sprints.find((s) => s.id === sprintId)

  // Filter out tasks that are already in the sprint
  const availableTasks = tasks.filter(
    (task) =>
      !sprint?.tasks.includes(task.id) &&
      (searchQuery === "" || task.title.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Reset selected tasks when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTasks([])
      setSearchQuery("")
    }
  }, [isOpen])

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]))
  }

  const handleAddTasks = async () => {
    if (selectedTasks.length > 0) {
      await addTasksToSprint(sprintId, selectedTasks)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Tasks to Sprint</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search tasks..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {availableTasks.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              {searchQuery ? "No matching tasks found" : "No available tasks to add"}
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {availableTasks.map((task) => (
                  <div key={task.id} className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={() => handleTaskToggle(task.id)}
                    />
                    <div className="flex-1">
                      <label htmlFor={`task-${task.id}`} className="text-sm font-medium cursor-pointer">
                        {task.title}
                      </label>
                      <div className="flex items-center mt-1">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            task.size === "XS"
                              ? "bg-green-100 text-green-800"
                              : task.size === "S"
                                ? "bg-blue-100 text-blue-800"
                                : task.size === "M"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : task.size === "L"
                                    ? "bg-orange-100 text-orange-800"
                                    : task.size === "XL"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {task.size}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs text-gray-500 ml-2">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""} selected
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAddTasks} disabled={selectedTasks.length === 0}>
              Add to Sprint
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

