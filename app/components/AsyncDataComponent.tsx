"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface DataItem {
  id: number
  name: string
  // Add other fields as necessary
}

export function AsyncDataComponent() {
  const [data, setData] = useState<DataItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        const { data: fetchedData, error } = await supabase.from("your_table_name").select("*")

        if (error) throw error

        if (isMounted) {
          setData(fetchedData)
          setIsLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message)
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>Async Data</h1>
      <ul>
        {data.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  )
}

