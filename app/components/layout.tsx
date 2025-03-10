"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Menu, X, Home, Calendar, Timer, BarChart2, FileText, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { NotificationDropdown } from "./notification-dropdown"
import { useAuth } from "../contexts/auth-context"
import { UserProfile } from "./user-profile"

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [currentPath, setCurrentPath] = useState("/")

  useEffect(() => {
    setCurrentPath(window.location.pathname)
  }, [])
  const { user } = useAuth()
  const router = useRouter()

  if (!user) {
    router.push("/signin")
    return null
  }

  const Logo = () => (
    <Link
      href="/"
      className={cn(
        "text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent p-2",
        isNavOpen ? "mr-auto" : "mx-auto",
      )}
    >
      Agile+
    </Link>
  )

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav
        className={cn(
          "bg-white dark:bg-gray-800 shadow-xl transition-all duration-300 ease-in-out relative border-r border-gray-100 dark:border-gray-700",
          isNavOpen ? "w-64" : "w-20",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center p-4 border-b border-gray-100 dark:border-gray-700">
            {isNavOpen && <Logo />}
            {isNavOpen ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsNavOpen(false)}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 ml-auto rounded-full"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsNavOpen(true)}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 mx-auto rounded-full"
              >
                <Menu className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </Button>
            )}
          </div>
          <ul className="space-y-1 mt-4 px-2 flex-grow">
            <NavItem
              icon={<Home className="h-5 w-5" />}
              label="Dashboard"
              href="/"
              isOpen={isNavOpen}
              active={currentPath === "/"}
            />
            <NavItem
              icon={<Calendar className="h-5 w-5" />}
              label="Calendar"
              href="/calendar"
              isOpen={isNavOpen}
              active={currentPath === "/calendar"}
            />
            <NavItem
              icon={<Timer className="h-5 w-5" />}
              label="Timer"
              href="/timer"
              isOpen={isNavOpen}
              active={currentPath === "/timer"}
            />
            <NavItem
              icon={<FileText className="h-5 w-5" />}
              label="Report"
              href="/report"
              isOpen={isNavOpen}
              active={currentPath === "/report"}
            />
            <NavItem
              icon={<BarChart2 className="h-5 w-5" />}
              label="Insights"
              href="/insights"
              isOpen={isNavOpen}
              active={currentPath === "/insights"}
            />
            <NavItem
              icon={<Zap className="h-5 w-5" />}
              label="Sprint"
              href="/sprint"
              isOpen={isNavOpen}
              active={currentPath === "/sprint"}
            />
          </ul>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10 border-b border-gray-100 dark:border-gray-700">
          <div className="max-w-7xl mx-auto py-4 px-6 flex justify-between items-center">
            <div className="flex items-center space-x-4">{!isNavOpen && <Logo />}</div>
            <div className="flex items-center space-x-4">
              <NotificationDropdown />
              <UserProfile />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto h-full">{children}</div>
        </main>
      </div>
    </div>
  )
}

// NavItem Component
function NavItem({
  icon,
  label,
  href,
  isOpen,
  active = false,
}: {
  icon: React.ReactNode
  label: string
  href: string
  isOpen: boolean
  active?: boolean
}) {
  return (
    <li>
      <Link href={href}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-12 transition-all duration-200",
            active
              ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 font-medium"
              : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100",
            !isOpen && "justify-center px-0",
          )}
        >
          {icon}
          {isOpen && <span className="ml-3">{label}</span>}
        </Button>
      </Link>
    </li>
  )
}

