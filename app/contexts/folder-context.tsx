"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"
import { supabase } from "@/lib/supabase"

export interface Folder {
  id: string
  name: string
  tasksCompleted?: number
  totalTasks?: number
  created_at: string
}

interface FolderContextType {
  folders: Folder[]
  addFolder: (name: string) => Promise<void>
  updateFolder: (id: string, name: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
}

const FolderContext = createContext<FolderContextType | undefined>(undefined)

export function FolderProvider({ children }: { children: React.ReactNode }) {
  const [folders, setFolders] = useState<Folder[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchFolders()
    }
  }, [user])

  async function fetchFolders() {
    try {
      const { data, error } = await supabase.from("folders").select("*").order("created_at", { ascending: true })

      if (error) {
        throw error
      }

      setFolders(data || [])
    } catch (error) {
      console.error("Error fetching folders:", error)
    }
  }

  async function addFolder(name: string) {
    try {
      const { data, error } = await supabase.from("folders").insert({ name, user_id: user?.id }).select()

      if (error) {
        throw error
      }

      setFolders([...folders, data[0]])
    } catch (error) {
      console.error("Error adding folder:", error)
    }
  }

  async function updateFolder(id: string, name: string) {
    try {
      const { error } = await supabase.from("folders").update({ name }).eq("id", id)

      if (error) {
        throw error
      }

      setFolders(folders.map((folder) => (folder.id === id ? { ...folder, name } : folder)))
    } catch (error) {
      console.error("Error updating folder:", error)
    }
  }

  async function deleteFolder(id: string) {
    try {
      const { error } = await supabase.from("folders").delete().eq("id", id)

      if (error) {
        throw error
      }

      setFolders(folders.filter((folder) => folder.id !== id))
    } catch (error) {
      console.error("Error deleting folder:", error)
    }
  }

  return (
    <FolderContext.Provider value={{ folders, addFolder, updateFolder, deleteFolder }}>
      {children}
    </FolderContext.Provider>
  )
}

export function useFolders() {
  const context = useContext(FolderContext)
  if (context === undefined) {
    throw new Error("useFolders must be used within a FolderProvider")
  }
  return context
}

