"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import type { Task } from "../contexts/task-context"

type TaskSize = "XS" | "S" | "M" | "L" | "XL" | "XXL"

const taskSizes: { size: TaskSize; points: number; description: string; color: string }[] = [
  { size: "XS", points: 1, description: "Very small task", color: "bg-[#81c784] text-white" },
  { size: "S", points: 2, description: "Small task", color: "bg-[#64b5f6] text-white" },
  { size: "M", points: 3, description: "Medium task", color: "bg-[#ffd54f] text-gray-800" },
  { size: "L", points: 5, description: "Large task", color: "bg-[#ff9800] text-white" },
  { size: "XL", points: 8, description: "Extra large task", color: "bg-[#f48fb1] text-white" },
  { size: "XXL", points: 13, description: "Very large task", color: "bg-[#ce93d8] text-white" },
]

interface EditTaskDialogProps {
  isOpen: boolean
  onClose: () => void
  onEditTask: (task: Task) => void
  task: Task
  folders: { id: number; name: string }[]
}

export function EditTaskDialog({ isOpen, onClose, onEditTask, task, folders }: EditTaskDialogProps) {
  const [title, setTitle] = useState(task.title)
  const [size, setSize] = useState<TaskSize>(task.size)
  const [dueDate, setDueDate] = useState<Date>(task.dueDate)
  const [dueTime, setDueTime] = useState(format(task.dueDate, "HH:mm"))
  const [folder, setFolder] = useState(task.folder || "none")
  const [description, setDescription] = useState(task.description || "")

  useEffect(() => {
    setTitle(task.title)
    setSize(task.size)
    setDueDate(task.dueDate)
    setDueTime(format(task.dueDate, "HH:mm"))
    setFolder(task.folder || "none")
    setDescription(task.description || "")
  }, [task])

  const getPointsForSize = (size: TaskSize): number => {
    const points = { XS: 1, S: 2, M: 3, L: 5, XL: 8, XXL: 13 }
    return points[size]
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title && size && dueDate) {
      const [hours, minutes] = dueTime.split(":").map(Number)
      const fullDueDate = new Date(dueDate)
      fullDueDate.setHours(hours, minutes)

      onEditTask({
        ...task,
        title,
        size,
        dueDate: fullDueDate,
        folder: folder === "none" ? undefined : folder,
        description: description || undefined,
        points: getPointsForSize(size),
      })
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-white dark:bg-gray-800 p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:text-white">
            Edit Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="font-medium text-gray-700 dark:text-gray-300">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
              className="h-10 border-2 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-medium text-gray-700 dark:text-gray-300">Size</Label>
            <RadioGroup
              value={size}
              onValueChange={(value) => setSize(value as TaskSize)}
              className="grid grid-cols-3 gap-2"
            >
              {taskSizes.map((taskSize) => (
                <div key={taskSize.size}>
                  <RadioGroupItem value={taskSize.size} id={taskSize.size} className="peer sr-only" />
                  <Label
                    htmlFor={taskSize.size}
                    className={cn(
                      "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white dark:bg-gray-700 p-2 cursor-pointer transition-colors",
                      {
                        "hover:text-green-600 hover:bg-green-50 peer-data-[state=checked]:bg-green-50 peer-data-[state=checked]:text-green-600 peer-data-[state=checked]:border-green-500 dark:hover:bg-green-900 dark:peer-data-[state=checked]:bg-green-900 dark:peer-data-[state=checked]:text-green-300":
                          taskSize.size === "XS",
                        "hover:text-purple-600 hover:bg-purple-50 peer-data-[state=checked]:bg-purple-50 peer-data-[state=checked]:text-purple-600 peer-data-[state=checked]:border-purple-500 dark:hover:bg-purple-900 dark:peer-data-[state=checked]:bg-purple-900 dark:peer-data-[state=checked]:text-purple-300":
                          taskSize.size === "S",
                        "hover:text-blue-600 hover:bg-blue-50 peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:text-blue-600 peer-data-[state=checked]:border-blue-500 dark:hover:bg-blue-900 dark:peer-data-[state=checked]:bg-blue-900 dark:peer-data-[state=checked]:text-blue-300":
                          taskSize.size === "M",
                        "hover:text-indigo-600 hover:bg-indigo-50 peer-data-[state=checked]:bg-indigo-50 peer-data-[state=checked]:text-indigo-600 peer-data-[state=checked]:border-indigo-500 dark:hover:bg-indigo-900 dark:peer-data-[state=checked]:bg-indigo-900 dark:peer-data-[state=checked]:text-indigo-300":
                          taskSize.size === "L",
                        "hover:text-violet-600 hover:bg-violet-50 peer-data-[state=checked]:bg-violet-50 peer-data-[state=checked]:text-violet-600 peer-data-[state=checked]:border-violet-500 dark:hover:bg-violet-900 dark:peer-data-[state=checked]:bg-violet-900 dark:peer-data-[state=checked]:text-violet-300":
                          taskSize.size === "XL",
                        "hover:text-fuchsia-600 hover:bg-fuchsia-50 peer-data-[state=checked]:bg-fuchsia-50 peer-data-[state=checked]:text-fuchsia-600 peer-data-[state=checked]:border-fuchsia-500 dark:hover:bg-fuchsia-900 dark:peer-data-[state=checked]:bg-fuchsia-900 dark:peer-data-[state=checked]:text-fuchsia-300":
                          taskSize.size === "XXL",
                      },
                    )}
                  >
                    <span className="font-medium">{taskSize.size}</span>
                    <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">{taskSize.points} pts</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label className="font-medium text-gray-700 dark:text-gray-300">Due Date and Time</Label>
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-10 justify-start text-left font-normal border-2",
                      !dueDate && "text-gray-500",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(newDate) => setDueDate(newDate || task.dueDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <div className="relative flex-shrink-0">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="pl-10 h-10 w-32 border-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-medium text-gray-700 dark:text-gray-300">Folder (Optional)</Label>
            <Select
              value={folder}
              onValueChange={setFolder}
            >
              <SelectTrigger className="h-10 border-2 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800">
                <SelectItem value="none" className="dark:text-white">No Folder</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.name} className="dark:text-white">
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="font-medium text-gray-700 dark:text-gray-300">Description (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={2}
              className="border-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>

          <Button
            type="submit"
            disabled={!title || !size || !dueDate}
            className="w-full h-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 mt-2"
          >
            Update Task
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

