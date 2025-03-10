"use client"

import type React from "react"

import { TaskProvider } from "../contexts/task-context"

export default function Providers({ children }: { children: React.ReactNode }) {
  return <TaskProvider>{children}</TaskProvider>
}

