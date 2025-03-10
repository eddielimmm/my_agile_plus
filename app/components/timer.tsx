"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react"

type TimerMode = "work" | "shortBreak" | "longBreak"

export function Timer() {
  const [time, setTime] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<TimerMode>("work")
  const [workDuration, setWorkDuration] = useState(25)
  const [shortBreakDuration, setShortBreakDuration] = useState(5)
  const [longBreakDuration, setLongBreakDuration] = useState(15)
  const [currentSession, setCurrentSession] = useState(1)
  const [breakCount, setBreakCount] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1)
      }, 1000)
    } else if (time === 0) {
      handleTimerComplete()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, time])

  const handleTimerComplete = () => {
    if (mode === "work") {
      setBreakCount((prevCount) => prevCount + 1)
      if (breakCount === 3) {
        setMode("longBreak")
        setTime(longBreakDuration * 60)
      } else {
        setMode("shortBreak")
        setTime(shortBreakDuration * 60)
      }
    } else {
      setMode("work")
      setTime(workDuration * 60)
      if (breakCount === 4) {
        setBreakCount(0)
        setCurrentSession(1)
      } else {
        setCurrentSession((prevSession) => prevSession + 1)
      }
    }
    setIsActive(false)
  }

  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setIsActive(false)
    setMode("work")
    setTime(workDuration * 60)
    setCurrentSession(1)
    setBreakCount(0)
  }

  const skipToBreak = () => {
    if (mode === "work") {
      handleTimerComplete()
    }
  }

  const skipBreak = () => {
    if (mode === "shortBreak" || mode === "longBreak") {
      setMode("work")
      setTime(workDuration * 60)
      if (breakCount === 4) {
        setBreakCount(0)
        setCurrentSession(1)
      } else {
        setCurrentSession((prevSession) => prevSession + 1)
      }
      setIsActive(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 backdrop-blur-sm">
        {/* Session Progress */}
        <div className="text-center mb-4">
          <span className="text-sm font-medium text-gray-600">
            Session {currentSession}/4 •{" "}
            {mode === "work" ? "Focus Time" : mode === "shortBreak" ? "Short Break" : "Long Break"}
          </span>
        </div>

        {/* Timer Display */}
        <div className="text-8xl font-bold text-center tracking-wider py-8 text-black dark:text-white mb-8">
          {formatTime(time)}
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4 mb-8">
          <Button
            onClick={toggleTimer}
            size="lg"
            className="w-36 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90"
          >
            {isActive ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
            {isActive ? "Pause" : "Start"}
          </Button>
          <Button onClick={resetTimer} variant="outline" size="lg" className="w-36 h-12 border-2">
            <RotateCcw className="mr-2 h-5 w-5" />
            Reset
          </Button>
          {mode === "work" && (
            <Button onClick={skipToBreak} variant="outline" size="lg" className="w-36 h-12 border-2">
              <SkipForward className="mr-2 h-5 w-5" />
              Skip to Break
            </Button>
          )}
          {(mode === "shortBreak" || mode === "longBreak") && (
            <Button onClick={skipBreak} variant="outline" size="lg" className="w-36 h-12 border-2">
              <SkipForward className="mr-2 h-5 w-5" />
              Skip Break
            </Button>
          )}
        </div>

        {/* Settings */}
        <div className="grid grid-cols-3 gap-8 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
          {[
            { id: "workDuration", label: "Work Duration", value: workDuration, setter: setWorkDuration },
            {
              id: "shortBreakDuration",
              label: "Short Break",
              value: shortBreakDuration,
              setter: setShortBreakDuration,
            },
            { id: "longBreakDuration", label: "Long Break", value: longBreakDuration, setter: setLongBreakDuration },
          ].map(({ id, label, value, setter }) => (
            <div key={id} className="space-y-2">
              <Label htmlFor={id} className="text-center block text-gray-600 dark:text-gray-300">
                {label} (mins)
              </Label>
              <Input
                id={id}
                type="number"
                value={value}
                onChange={(e) => setter(Number(e.target.value))}
                min="1"
                className="text-center text-lg h-12 border-2 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

