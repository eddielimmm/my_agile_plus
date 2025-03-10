import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { TaskProvider } from "./contexts/task-context"
import { AuthProvider } from "./contexts/auth-context"
import { FolderProvider } from "./contexts/folder-context"
import { SprintProvider } from "./contexts/sprint-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Agile+",
  description: "Task management and time tracking app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <FolderProvider>
            <TaskProvider>
              <SprintProvider>{children}</SprintProvider>
            </TaskProvider>
          </FolderProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

