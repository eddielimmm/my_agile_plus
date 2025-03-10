import { supabase } from "@/lib/supabase"

// Function to get report data from either Supabase or localStorage
export async function getReportData(userId: string, date: Date) {
  // Try to get from Supabase first
  try {
    const dateStr = date.toISOString().split("T")[0]
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", userId)
      .eq("report_date", date.toISOString())
      .single()

    if (error) {
      // If there's an error, try localStorage
      return getReportFromLocalStorage(userId, date)
    }

    // If data is fetched from Supabase or localStorage, we need to recalculate based on the specific date
    if (data) {
      const tasks = await fetchTasksForUser(userId)
      const recalculatedData = calculateReportData(userId, date, tasks)
      return recalculatedData
    }

    return null
  } catch (error) {
    // If there's an exception, try localStorage
    return getReportFromLocalStorage(userId, date)
  }
}

// Helper function to get report data from localStorage
function getReportFromLocalStorage(userId: string, date: Date) {
  const dateStr = date.toISOString().split("T")[0]
  const key = `${userId}_report_${dateStr}`
  const reportStr = localStorage.getItem(key)

  if (reportStr) {
    try {
      return JSON.parse(reportStr)
    } catch (e) {
      return null
    }
  }
  return null
}

// Function to get all reports for a user within a date range
export async function getReportsInRange(userId: string, startDate: Date, endDate: Date) {
  // Try to get from Supabase first
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", userId)
      .gte("report_date", startDate.toISOString())
      .lte("report_date", endDate.toISOString())

    if (error) {
      // If there's an error, try localStorage
      return getReportsFromLocalStorage(userId, startDate, endDate)
    }

    return data
  } catch (error) {
    // If there's an exception, try localStorage
    return getReportsFromLocalStorage(userId, startDate, endDate)
  }
}

// Helper function to get reports from localStorage within a date range
function getReportsFromLocalStorage(userId: string, startDate: Date, endDate: Date) {
  const reports = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const report = getReportFromLocalStorage(userId, currentDate)
    if (report) {
      reports.push(report)
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return reports
}

// Add this new function to fetch tasks
async function fetchTasksForUser(userId: string) {
  const { data, error } = await supabase.from("tasks").select("*").eq("user_id", userId)

  if (error) {
    console.error("Error fetching tasks:", error)
    return []
  }

  return data
}

// Add this new function to calculate report data
function calculateReportData(userId: string, date: Date, tasks: any[]) {
  // This function should implement the same logic as in the TaskContext
  // but using the provided tasks and date instead of the current state
  // ... implement the calculation logic here ...
}

