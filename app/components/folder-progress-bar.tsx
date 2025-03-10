"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

type TaskSize = "XS" | "S" | "M" | "L" | "XL" | "XXL"

interface FolderProgressBarProps {
  completedTasks: number
  totalTasks: number
  dominantSize: TaskSize
}

const sizeColors = {
  XS: "#81c784",
  S: "#64b5f6",
  M: "#ffd54f",
  L: "#ff9800",
  XL: "#f48fb1",
  XXL: "#ce93d8",
}

export function FolderProgressBar({ completedTasks, totalTasks, dominantSize }: FolderProgressBarProps) {
  const [percentage, setPercentage] = useState(0)

  useEffect(() => {
    const newPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    setPercentage(newPercentage)
  }, [completedTasks, totalTasks])

  return (
    <div className="mt-3 mb-2">
      <div className="flex justify-between items-center mb-2 text-sm font-medium">
        <span className="text-gray-600">
          {completedTasks}/{totalTasks} tasks completed
        </span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          key={percentage}
          className="font-bold text-gray-800"
        >
          {percentage.toFixed(0)}%
        </motion.span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
        <motion.div
          className="h-full rounded-full transition-colors duration-300"
          style={{
            backgroundColor: sizeColors[dominantSize],
            boxShadow: "0 1px 2px rgba(0,0,0,0.1) inset",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
    </div>
  )
}

