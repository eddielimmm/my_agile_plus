"use client"

import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, Folder, ChevronDown, ChevronRight, Clock, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CreateTaskDialog } from "./create-task-dialog"
import { EditTaskDialog } from "./edit-task-dialog"
import { TaskCard } from "./task-card"
import { FolderProgressBar } from "./folder-progress-bar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { differenceInDays } from "date-fns"
import { useTaskContext } from "../contexts/task-context"
import { useFolders } from "../contexts/folder-context"
import { GoalPointsInput } from "./goal-points-input"

type TaskSize = "XS" | "S" | "M" | "L" | "XL" | "XXL"
type TaskPriority = "Low" | "Medium" | "High"

type Task = {
  id: number
  title: string
  size: TaskSize
  points: number
  dueDate: Date
  folder: string | null
  timeEntries: { date: string; duration: number; startTime: string }[]
  isCompleted: boolean
  priority: TaskPriority
  description?: string
  createdAt: Date
}

type FolderType = {
  id: number
  name: string
  isOpen: boolean
}

type SortOption = "default" | "recent" | "dueDate"

export default function TaskList() {
  const { tasks, addTask: contextAddTask, updateTask, deleteTask } = useTaskContext()
  const { folders, addFolder, updateFolder, deleteFolder } = useFolders()
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false)
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [activeTab, setActiveTab] = useState<"tasks" | "folders">("tasks")
  const [sortOption, setSortOption] = useState<SortOption>("default")

  //useEffect(() => {
  //  if (activeTab === "folders") {
  //    setSortOption("default")
  //  }
  //}, [activeTab])

  const handleAddFolder = useCallback(async () => {
    if (newFolderName.trim()) {
      await addFolder(newFolderName.trim())
      setIsCreateFolderDialogOpen(false)
      setNewFolderName("")
    }
  }, [newFolderName, addFolder])

  const handleAddTask = useCallback(
    async (newTask: Omit<Task, "id" | "isCompleted" | "timeEntries" | "createdAt">) => {
      await contextAddTask(newTask)
      setIsCreateTaskDialogOpen(false)
    },
    [contextAddTask],
  )

  const editTask = useCallback(
    async (editedTask: Task) => {
      await updateTask(editedTask)
      setIsEditTaskDialogOpen(false)
      setEditingTask(null)
    },
    [updateTask],
  )

  const handleCompleteTask = useCallback(
    (completedTask: Task) => {
      updateTask(completedTask)
    },
    [updateTask],
  )

  const handleDeleteTask = useCallback(
    async (taskId: number) => {
      await deleteTask(taskId)
    },
    [deleteTask],
  )

  const toggleFolderOpen = useCallback((folderId: number) => {
    //setFolders((prevFolders) =>
    //  prevFolders.map((folder) => ({
    //    ...folder,
    //    isOpen: folder.id === folderId ? !folder.isOpen : folder.isOpen,
    //  })),
    //)
  }, [])

  const getFolderProgress = useCallback(
    (folderName: string) => {
      const folderTasks = tasks.filter((task) => task.folder === folderName)
      const completedTasks = folderTasks.filter((task) => task.isCompleted).length
      const totalTasks = folderTasks.length
      const dominantSize = getDominantSize(folderTasks)
      return { completedTasks, totalTasks, dominantSize }
    },
    [tasks],
  )

  const getDominantSize = useCallback((folderTasks: Task[]): TaskSize => {
    const sizeCounts = folderTasks.reduce(
      (acc, task) => {
        acc[task.size] = (acc[task.size] || 0) + 1
        return acc
      },
      {} as Record<TaskSize, number>,
    )

    return Object.entries(sizeCounts).reduce(
      (a, b) => (sizeCounts[a as TaskSize] > sizeCounts[b[0] as TaskSize] ? a : b[0]),
      "M" as TaskSize,
    ) as TaskSize
  }, [])

  const sortedTasks = useMemo(() => {
    const sortedTasks = [...tasks]
    switch (sortOption) {
      case "recent":
        sortedTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        break
      case "dueDate":
        sortedTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
        break
      default:
        // Keep the default order
        break
    }
    return sortedTasks
  }, [tasks, sortOption])

  const recentTasks = useMemo(() => {
    return sortedTasks.filter((task) => {
      const daysSinceCreation = differenceInDays(new Date(), task.createdAt)
      return daysSinceCreation <= 7 // Tasks created within the last 7 days
    })
  }, [sortedTasks])

  const closeToDueDateTasks = useMemo(() => {
    return sortedTasks.filter((task) => {
      const daysUntilDue = differenceInDays(task.dueDate, new Date())
      return daysUntilDue <= 3 && daysUntilDue >= 0 // Tasks due within the next 3 days
    })
  }, [sortedTasks])

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task)
    setIsEditTaskDialogOpen(true)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Tasks and Folders
          </h3>
          <p className="text-gray-600 mt-1">Manage your tasks and folders</p>
        </div>
        <div className="space-x-3 flex items-center">
          {activeTab === "tasks" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="border-2 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  Quick Access <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
                <DropdownMenuItem
                  onSelect={() => setSortOption("recent")}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Recent Tasks</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setSortOption("dueDate")}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Close to Due Date</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            onClick={() => setIsCreateFolderDialogOpen(true)}
            variant="outline"
            className="border-2 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            <Folder className="mr-2 h-4 w-4" /> New Folder
          </Button>
          <Button
            onClick={() => setIsCreateTaskDialogOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> New Task
          </Button>
        </div>
      </div>

      {/* Add the GoalPointsInput component here */}
      <GoalPointsInput />

      {/* Dialogs */}
      <CreateTaskDialog
        isOpen={isCreateTaskDialogOpen}
        onClose={() => setIsCreateTaskDialogOpen(false)}
        onCreateTask={handleAddTask}
        folders={folders}
      />

      {editingTask && (
        <EditTaskDialog
          isOpen={isEditTaskDialogOpen}
          onClose={() => {
            setIsEditTaskDialogOpen(false)
            setEditingTask(null)
          }}
          onEditTask={editTask}
          task={editingTask}
          folders={folders}
        />
      )}

      <Dialog open={isCreateFolderDialogOpen} onOpenChange={setIsCreateFolderDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold dark:text-white">Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folderName" className="font-medium dark:text-gray-300">
                Folder Name
              </Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="h-10 border-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddFolder}
              disabled={!newFolderName.trim()}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90"
            >
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "tasks" | "folders")}>
        <TabsList className="bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="tasks" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
            Tasks
          </TabsTrigger>
          <TabsTrigger value="folders" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
            Folders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-6">
          {/* Recent Tasks Section */}
          {sortOption === "recent" && recentTasks.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3 text-gray-900">Recent Tasks</h4>
              <div className="grid gap-4">
                {recentTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleEditTask}
                    onComplete={handleCompleteTask}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Due Soon Tasks Section */}
          {sortOption === "dueDate" && closeToDueDateTasks.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3 text-gray-900">Tasks Due Soon</h4>
              <div className="grid gap-4">
                {closeToDueDateTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleEditTask}
                    onComplete={handleCompleteTask}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Tasks Section */}
          {sortedTasks.length === 0 ? (
            <Card className="border-2 dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-gray-100 p-4 mb-4">
                  <PlusCircle className="h-6 w-6 text-gray-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No tasks yet</h4>
                <p className="text-gray-600 dark:text-gray-300 text-center max-w-sm mb-4">
                  Create your first task to start tracking your progress and managing your time efficiently.
                </p>
                <Button
                  onClick={() => setIsCreateTaskDialogOpen(true)}
                  variant="outline"
                  className="border-2 hover:bg-gray-50"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> New Task
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sortedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="folders" className="mt-6">
          {/* Folders Content */}
          {folders.length === 0 ? (
            <Card className="border-2 dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-4 mb-4">
                  <Folder className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No folders yet</h4>
                <p className="text-gray-600 dark:text-gray-300 text-center max-w-sm mb-4">
                  Create folders to organize your tasks and improve your workflow.
                </p>
                <Button
                  onClick={() => setIsCreateFolderDialogOpen(true)}
                  variant="outline"
                  className="border-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> New Folder
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {folders.map((folder) => {
                const folderTasks = tasks.filter((task) => task.folder === folder.name)
                const completedTasks = folderTasks.filter((task) => task.isCompleted).length
                const totalTasks = folderTasks.length
                const dominantSize = getDominantSize(folderTasks)
                return (
                  <Collapsible key={folder.id} className="w-full">
                    <Card className="hover:shadow-lg transition-all duration-200 border-0 dark:bg-gray-800">
                      <CardContent className="p-4">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center space-x-3">
                              <Folder className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">{folder.name}</h4>
                            </div>
                            <ChevronRight className="h-5 w-5 transition-transform duration-200 text-gray-500 dark:text-gray-400" />
                          </div>
                        </CollapsibleTrigger>
                        <FolderProgressBar
                          completedTasks={completedTasks}
                          totalTasks={totalTasks}
                          dominantSize={dominantSize}
                        />
                      </CardContent>
                    </Card>
                    <CollapsibleContent>
                      <div className="mt-2 ml-6 space-y-2">
                        {folderTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onEdit={handleEditTask}
                            onComplete={handleCompleteTask}
                            onDelete={handleDeleteTask}
                          />
                        ))}
                        {folderTasks.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-300">No tasks in this folder yet.</p>
                            <Button
                              onClick={() => setIsCreateTaskDialogOpen(true)}
                              variant="ghost"
                              size="sm"
                              className="mt-2 hover:bg-white dark:hover:bg-gray-600"
                            >
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Add Task
                            </Button>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

