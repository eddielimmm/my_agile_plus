"use client"

import { useState } from "react"
import Layout from "../components/layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PatternRecognition } from "../components/insights/pattern-recognition"
import { AIPersonalizedRecommendations } from "../components/insights/ai-personalized-recommendations"
import { PredictiveAnalysis } from "../components/insights/predictive-analysis"

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState("ai-recommendations")

  return (
    <Layout>
      <div className="h-full flex flex-col space-y-4">
        <h1 className="text-2xl font-bold">Insights</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-800">
            <TabsTrigger value="ai-recommendations">Smart Recommendation</TabsTrigger>
            <TabsTrigger value="pattern-recognition">Pattern Recognition</TabsTrigger>
            <TabsTrigger value="predictive-analysis">Predictive Analysis</TabsTrigger>
          </TabsList>
          <TabsContent value="ai-recommendations">
            <AIPersonalizedRecommendations />
          </TabsContent>
          <TabsContent value="pattern-recognition">
            <PatternRecognition />
          </TabsContent>
          <TabsContent value="predictive-analysis">
            <PredictiveAnalysis />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}

