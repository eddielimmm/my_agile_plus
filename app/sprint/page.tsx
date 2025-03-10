"use client"

import { useState } from "react"
import Layout from "../components/layout"
import { SprintList } from "../components/sprint/sprint-list"
import { SprintTasks } from "../components/sprint/sprint-tasks"
import { CreateSprintDialog } from "../components/sprint/create-sprint-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useSprintContext } from "../contexts/sprint-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SprintGoalPointsInput } from "../components/sprint/sprint-goal-points-input"

export default function SprintPage() {
  const [isCreateSprintDialogOpen, setIsCreateSprintDialogOpen] = useState(false)
  const { currentSprint } = useSprintContext()

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section - Improved dark mode contrast */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Sprints and Tasks</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage your sprints and sprint tasks</p>
          </div>
          <Button
            onClick={() => setIsCreateSprintDialogOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> New Sprint
          </Button>
        </div>

        {/* Sprint Goal Points - Positioned between header and tabs */}
        <div className="py-2">
          <SprintGoalPointsInput />
        </div>

        {/* Tabs Section - Improved dark mode contrast */}
        <div className="mt-6">
          <Tabs defaultValue="sprints" className="w-full">
            <TabsList className="w-full bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <TabsTrigger
                value="sprints"
                className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 dark:text-gray-200 dark:data-[state=active]:text-white"
              >
                Sprints
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 dark:text-gray-200 dark:data-[state=active]:text-white"
              >
                Tasks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sprints" className="mt-6">
              <SprintList onCreateSprint={() => setIsCreateSprintDialogOpen(true)} />
            </TabsContent>

            <TabsContent value="tasks" className="mt-6">
              <SprintTasks sprint={currentSprint} />
            </TabsContent>
          </Tabs>
        </div>

        <CreateSprintDialog isOpen={isCreateSprintDialogOpen} onClose={() => setIsCreateSprintDialogOpen(false)} />
      </div>
    </Layout>
  )
}

