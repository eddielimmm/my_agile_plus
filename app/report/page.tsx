"use client"

import Layout from "../components/layout"
import { TotalTimeChart } from "../components/total-time-chart"
import { TaskSizeBreakdown } from "../components/task-size-breakdown"
import { TimeDistributionChart } from "../components/time-distribution-chart"
import { CompletionTimeAverages } from "../components/completion-time-averages"

export default function ReportPage() {
  return (
    <Layout>
      <div className="h-full flex flex-col">
        <h1 className="text-2xl font-bold mb-4">Report</h1>
        <div className="flex-grow space-y-6">
          <TotalTimeChart />
          <TaskSizeBreakdown />
          <TimeDistributionChart />
          <CompletionTimeAverages />
        </div>
      </div>
    </Layout>
  )
}

