"use client"

import { useState, useEffect, useCallback } from "react"
import { differenceInDays, format } from "date-fns"
import { Bell, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTaskContext } from "../contexts/task-context"
import { cn } from "@/lib/utils"

export function NotificationDropdown() {
  const { tasks } = useTaskContext()
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastChecked, setLastChecked] = useState<Date>(new Date())

  // Get tasks due within 3 days
  const getDueSoonTasks = useCallback(() => {
    return tasks.filter((task) => {
      if (task.isCompleted) return false
      const daysUntilDue = differenceInDays(task.dueDate, new Date())
      return daysUntilDue >= 0 && daysUntilDue <= 3
    })
  }, [tasks])

  // Update unread count
  useEffect(() => {
    const dueSoonTasks = getDueSoonTasks()
    const newTasks = dueSoonTasks.filter(
      (task) => task.createdAt > lastChecked || !localStorage.getItem(`notification-${task.id}-seen`),
    )
    setUnreadCount(newTasks.length)
  }, [getDueSoonTasks, lastChecked])

  const handleOpen = () => {
    setLastChecked(new Date())
    const dueSoonTasks = getDueSoonTasks()
    dueSoonTasks.forEach((task) => {
      localStorage.setItem(`notification-${task.id}-seen`, "true")
    })
    setUnreadCount(0)
  }

  const dueSoonTasks = getDueSoonTasks()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full h-9 w-9 transition-colors"
          onClick={handleOpen}
        >
          <Bell className="h-5 w-5 text-gray-600 dark:text-white" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-white p-2 shadow-lg rounded-lg border border-gray-100">
        {dueSoonTasks.length > 0 ? (
          dueSoonTasks.map((task) => {
            const daysUntilDue = differenceInDays(task.dueDate, new Date())
            return (
              <DropdownMenuItem
                key={task.id}
                className="flex flex-col items-start py-3 px-4 hover:bg-gray-50 rounded-md transition-colors"
              >
                <div className="font-medium text-gray-900 mb-1">{task.title}</div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-gray-400 mr-1.5" />
                  <span
                    className={cn(
                      "text-gray-600",
                      daysUntilDue === 0 && "text-red-600 font-medium",
                      daysUntilDue === 1 && "text-orange-600 font-medium",
                    )}
                  >
                    Due {format(task.dueDate, "MMM d, yyyy")}
                    {daysUntilDue === 0
                      ? " (Today)"
                      : daysUntilDue === 1
                        ? " (Tomorrow)"
                        : ` (in ${daysUntilDue} days)`}
                  </span>
                </div>
              </DropdownMenuItem>
            )
          })
        ) : (
          <DropdownMenuItem className="py-8 text-center text-gray-500 hover:bg-gray-50 rounded-md">
            <div className="flex flex-col items-center">
              <Bell className="h-6 w-6 text-gray-400 mb-2" />
              <span>No upcoming deadlines</span>
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

