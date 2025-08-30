
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartTooltip, ChartTooltipContent, ChartContainer } from "@/components/ui/chart"

const chartData = [
  { department: "Developer", present: 4, absent: 0 },
  { department: "Designer", present: 1, absent: 1 },
  { department: "Manager", present: 0, absent: 1 },
  { department: "QA Engineer", present: 2, absent: 0 },
]

export default function ReportsDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance by Department</CardTitle>
        <CardDescription>A summary of employee presence and absence across departments for today.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[350px] w-full">
            <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <ChartTooltip 
                        content={<ChartTooltipContent />}
                    />
                    <Bar dataKey="present" fill="var(--color-chart-2)" radius={4} />
                    <Bar dataKey="absent" fill="var(--color-destructive)" radius={4} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
