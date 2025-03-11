import { supabase } from "@/lib/supabase"

export async function updateReportTable(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Fetch tasks for the user
  const { data: tasks, error: tasksError } = await supabase.from("tasks").select("*").eq("user_id", userId)

  if (tasksError) {
    console.error("Error fetching tasks:", tasksError)
    return
  }

  // Calculate aggregated data
  const totalTimeSpent = tasks.reduce(
    (sum: number, task: any) => 
      sum + task.timeEntries.reduce(
        (s: number, e: any) => s + e.duration, 
        0
      ), 
    0
  )
  
  const completedTasks = tasks.filter((task: any) => task.isCompleted).length
  const pointsEarned = tasks.reduce((sum: number, task: any) => (task.isCompleted ? sum + task.points : sum), 0)

  // Calculate task size breakdown
  const taskSizeBreakdown = tasks.reduce((acc: Record<string, number>, task: any) => {
    acc[task.size] = (acc[task.size] || 0) + 1
    return acc
  }, {})

  // Calculate time distribution
  const timeDistribution = tasks.reduce((acc: Record<number, number>, task: any) => {
    task.timeEntries.forEach((entry: any) => {
      const hour = new Date(entry.startTime).getHours()
      acc[hour] = (acc[hour] || 0) + entry.duration
    })
    return acc
  }, {})

  // Calculate completion time averages
  const completionTimeRaw = tasks.reduce((acc: Record<string, number[]>, task: any) => {
    if (task.isCompleted) {
      const totalTime = task.timeEntries.reduce((sum: number, entry: any) => sum + entry.duration, 0)
      if (!acc[task.size]) acc[task.size] = []
      acc[task.size].push(totalTime)
    }
    return acc
  }, {} as Record<string, number[]>)

  // Calculate the averages in a separate object
  const completionTimeAverages = Object.fromEntries(
    Object.entries(completionTimeRaw).map(([size, times]) => [
      size, 
      times.length > 0 ? times.reduce((a: number, b: number) => a + b, 0) / times.length : 0
    ])
  )

  // Calculate monthly points
  const monthlyPoints = tasks.reduce((acc: Record<string, number>, task: any) => {
    if (task.isCompleted) {
      const monthKey = task.createdAt.toISOString().slice(0, 7)
      acc[monthKey] = (acc[monthKey] || 0) + task.points
    }
    return acc
  }, {})

  // Update or insert into the reports table
  const { data, error } = await supabase
    .from("reports")
    .upsert({
      user_id: userId,
      report_date: today.toISOString(),
      total_time_spent: totalTimeSpent,
      completed_tasks: completedTasks,
      points_earned: pointsEarned,
      task_size_breakdown: taskSizeBreakdown,
      time_distribution: timeDistribution,
      completion_time_averages: completionTimeAverages,
      monthly_points: monthlyPoints,
    })
    .select()

  if (error) {
    console.error("Error updating report:", error)
  } else {
    console.log("Report updated successfully")
  }
}

