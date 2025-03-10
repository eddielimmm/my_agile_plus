"use client"

import { Calendar } from "../components/calendar"
import { useTaskContext } from "../contexts/task-context"
import Layout from "../components/layout"

export default function CalendarPage() {
  const { tasks } = useTaskContext()

  return (
    <Layout>
      <div className="h-full flex flex-col">
        <h1 className="text-2xl font-bold mb-4">Task Calendar</h1>
        <div className="flex-grow">
          <Calendar tasks={tasks} />
        </div>
      </div>
    </Layout>
  )
}

