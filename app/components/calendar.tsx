"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// Ensure moment is in the browser environment
if (typeof window !== "undefined") {
  momentLocalizer(moment)
}

type TaskSize = "XS" | "S" | "M" | "L" | "XL" | "XXL"
type TaskPriority = "Low" | "Medium" | "High"

interface TimeEntry {
  duration: number
}

interface Task {
  id: number
  title: string
  size: TaskSize
  dueDate: Date
  isCompleted: boolean
  timeSpent: number
  timeEntries?: TimeEntry[]
  priority: TaskPriority
  description?: string
}

interface CalendarProps {
  tasks: Task[]
}

const sizeColors = {
  XS: "#4CAF50",
  S: "#2196F3",
  M: "#FFC107",
  L: "#FF9800",
  XL: "#E91E63",
  XXL: "#9C27B0",
}

export function Calendar({ tasks }: CalendarProps) {
  const processedTasks = tasks.map(task => ({
    ...task,
    timeSpent: task.timeSpent !== undefined ? task.timeSpent : 
      (task.timeEntries ? task.timeEntries.reduce((total, entry) => total + (entry.duration || 0), 0) : 0)
  }))
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    setEvents(
      processedTasks.map((task) => ({
        id: task.id,
        title: task.title,
        start: new Date(task.dueDate),
        end: new Date(task.dueDate),
        allDay: true,
        resource: task,
      })),
    )
  }, [processedTasks])

  const eventStyleGetter = useCallback((event: any) => {
    const task = event.resource as Task
    return {
      style: {
        backgroundColor: sizeColors[task.size],
        borderRadius: "0",
        opacity: 0.8,
        color: "white",
        border: "none",
        display: "block",
      },
    }
  }, [])

  const handleSelectEvent = useCallback((event: any) => {
    setSelectedTask(event.resource)
  }, [])

  return (
    <TooltipProvider>
      <div className="h-full relative">
        <BigCalendar
          localizer={momentLocalizer(moment)}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "calc(100vh - 120px)" }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          views={["month"]}
          className={cn("bg-gray-100 text-gray-900", "dark:bg-gray-800 dark:text-gray-100")}
          components={{
            toolbar: CalendarToolbar,
            event: EventComponent,
          }}
        />
        {selectedTask && <TaskDetails task={selectedTask} onClose={() => setSelectedTask(null)} />}
      </div>
    </TooltipProvider>
  )
}

const CalendarToolbar: React.FC<any> = (props) => {
  return (
    <div className="flex justify-between items-center mb-4 p-2 bg-gray-200 dark:bg-gray-700 rounded">
      <div>
        <Button onClick={() => props.onNavigate("PREV")} variant="outline" size="sm" className="mr-2">
          Previous
        </Button>
        <Button onClick={() => props.onNavigate("NEXT")} variant="outline" size="sm">
          Next
        </Button>
      </div>
      <h2 className="text-xl font-semibold">{props.label}</h2>
      <Button onClick={() => props.onNavigate("TODAY")} variant="outline" size="sm">
        Today
      </Button>
    </div>
  )
}

const EventComponent: React.FC<{ event: any }> = ({ event }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="px-2 py-1 text-xs font-medium truncate">
        {event.title} ({(event.resource as Task).size})
      </div>
    </TooltipTrigger>
    <TooltipContent>
      <TaskTooltip task={event.resource as Task} />
    </TooltipContent>
  </Tooltip>
)

const TaskTooltip: React.FC<{ task: Task }> = ({ task }) => (
  <Card className="w-64 bg-white dark:bg-gray-700 shadow-lg">
    <CardContent className="p-4">
      <h3 className="font-bold mb-2 dark:text-gray-100">{task.title}</h3>
      <p className="dark:text-gray-300">Size: {task.size}</p>
      <p className="dark:text-gray-300">Priority: {task.priority}</p>
      <p className="dark:text-gray-300">Time Spent: {formatTime(task.timeSpent)}</p>
      <p className="dark:text-gray-300">Status: {task.isCompleted ? "Completed" : "In Progress"}</p>
    </CardContent>
  </Card>
)

const TaskDetails: React.FC<{ task: Task; onClose: () => void }> = ({ task, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="dark:text-gray-100">{task.title}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close task details">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="dark:text-gray-400">Task Details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 dark:text-gray-300">
          <p>
            <span className="font-semibold">Size:</span> {task.size}
          </p>
          <p>
            <span className="font-semibold">Priority:</span> {task.priority}
          </p>
          <p>
            <span className="font-semibold">Due Date:</span> {task.dueDate.toLocaleDateString()}
          </p>
          <p>
            <span className="font-semibold">Time Spent:</span> {formatTime(task.timeSpent)}
          </p>
          <p>
            <span className="font-semibold">Status:</span> {task.isCompleted ? "Completed" : "In Progress"}
          </p>
          {task.description && (
            <div>
              <p className="font-semibold">Description:</p>
              <p className="mt-1">{task.description}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </CardFooter>
    </Card>
  </div>
)

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

