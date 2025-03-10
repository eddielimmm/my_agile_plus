"use client"

import { useState } from "react"
import { useFolders } from "../contexts/folder-context"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

const FolderView = ({ folders }) => {
  const { deleteFolder } = useFolders()
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null)

  const handleDelete = async (folderId: string) => {
    if (window.confirm("Are you sure you want to delete this folder?")) {
      setDeletingFolder(folderId)
      try {
        await deleteFolder(folderId)
      } catch (error) {
        console.error("Error deleting folder:", error)
      }
      setDeletingFolder(null)
    }
  }

  return (
    <div className="space-y-4">
      {folders.map((folder) => (
        <div key={folder.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="text-primary">{folder.name}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(folder.id)}
              disabled={deletingFolder === folder.id}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm text-muted-foreground mb-2">
            {folder.tasksCompleted || "0"}/{folder.totalTasks || "0"} tasks completed
          </div>

          <Progress value={((folder.tasksCompleted || 0) / (folder.totalTasks || 1)) * 100} className="h-2" />

          <div className="text-right text-sm text-muted-foreground mt-1">
            {Math.round(((folder.tasksCompleted || 0) / (folder.totalTasks || 1)) * 100)}%
          </div>
        </div>
      ))}
    </div>
  )
}

export default FolderView

