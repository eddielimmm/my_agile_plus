import { supabase } from "./supabase"

export interface Report {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export async function createReport(userId: string, title: string, content: string): Promise<Report | null> {
  try {
    const { data, error } = await supabase.from("reports").insert({ user_id: userId, title, content }).select().single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating report:", error)
    return null
  }
}

export async function getReports(userId: string): Promise<Report[]> {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching reports:", error)
    return []
  }
}

export async function getReportById(reportId: string): Promise<Report | null> {
  try {
    const { data, error } = await supabase.from("reports").select("*").eq("id", reportId).single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching report:", error)
    return null
  }
}

export async function updateReport(reportId: string, title: string, content: string): Promise<Report | null> {
  try {
    const { data, error } = await supabase
      .from("reports")
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq("id", reportId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating report:", error)
    return null
  }
}

export async function deleteReport(reportId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("reports").delete().eq("id", reportId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting report:", error)
    return false
  }
}

