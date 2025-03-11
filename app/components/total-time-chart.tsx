"use client"

import { useState, useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import {
  startOfWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format,
  subMonths,
  addWeeks,
} from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTaskContext } from "../contexts/task-context"

type TimeRange = "day" | "week" | "month"

const COLORS = ["#81c784", "#64b5f6", "#ffd54f", "#ff9800", "#f48fb1", "#ce93d8"]

export function TotalTimeChart() {
  const { tasks } = useTaskContext()
  const [timeRange, setTimeRange] = useState<TimeRange>("day")
  const [dateRange, setDateRange] = useState<[Date, Date]>([subMonths(new Date(), 1), new Date()])

  const data = useMemo(() => {
    const start = startOfWeek(dateRange[0])
    const end = dateRange[1]

    let intervals: Date[]
    let formatString: string

    switch (timeRange) {
      case "day":
        intervals = eachDayOfInterval({ start, end })
        formatString = "yyyy-MM-dd"
        break
      case "week":
        intervals = eachWeekOfInterval({ start, end })
        formatString = "yyyy-'W'ww"
        break
      case "month":
        intervals = eachMonthOfInterval({ start, end })
        formatString = "yyyy-MM"
        break
    }

    return intervals.map((date) => {
      let totalHours = 0

      tasks.forEach((task) => {
        task.timeEntries.forEach((entry) => {
          const entryDate = new Date(entry.date)
          if (
            (timeRange === "day" && format(entryDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")) ||
            (timeRange === "week" && entryDate >= startOfWeek(date) && entryDate < startOfWeek(addWeeks(date, 1))) ||
            (timeRange === "month" &&
              entryDate.getMonth() === date.getMonth() &&
              entryDate.getFullYear() === date.getFullYear())
          ) {
            totalHours += entry.duration / 3600 // Convert seconds to hours
          }
        })
      })

      return {
        date: format(date, formatString),
        displayDate: format(date, "MMM d"),
        hours: totalHours,
      }
    })
  }, [tasks, timeRange, dateRange])

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>Total Time Spent</CardTitle>
        <div className="flex space-x-2">
          <Button onClick={() => setTimeRange("day")} variant={timeRange === "day" ? "default" : "outline"}>
            Daily
          </Button>
          <Button onClick={() => setTimeRange("week")} variant={timeRange === "week" ? "default" : "outline"}>
            Weekly
          </Button>
          <Button onClick={() => setTimeRange("month")} variant={timeRange === "month" ? "default" : "outline"}>
            Monthly
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="displayDate" />
            <YAxis />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length > 0 && payload[0]?.value !== undefined) {
                  const value = typeof payload[0].value === 'number' 
                    ? payload[0].value.toFixed(2) 
                    : Number(payload[0].value).toFixed(2);
                  
                  return (
                    <div className="bg-white dark:bg-gray-800 p-2 border rounded shadow dark:border-gray-700">
                      <p className="text-gray-900 dark:text-gray-100">{`Date: ${payload[0].payload.displayDate}`}</p>
                      <p className="text-gray-900 dark:text-gray-100">{`Hours: ${value}`}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="hours" fill="#81c784" key="total-time-bar">
              {data.map((entry, index) => (
                <Cell key={`cell-total-time-${entry.date}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

