"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserCheck, UserX, ArrowRight, ArrowLeft } from "lucide-react";
import { getAllEmployees, Employee } from '@/services/employeeService';
import { getRecentActivities, RecentActivity } from '@/services/attendanceService';

export default function ManagementDashboard() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [activities, setActivities] = useState<RecentActivity[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const emps = await getAllEmployees();
            const acts = await getRecentActivities();
            setEmployees(emps);
            setActivities(acts);
        };
        fetchData();
    }, []);

    const totalEmployees = employees.length;
    const presentEmployees = employees.filter(e => e.status === 'Present').length;
    const absentEmployees = totalEmployees - presentEmployees;

    const kpiData = [
        { title: "Total Employees", value: totalEmployees.toString(), icon: Users, change: "All registered employees" },
        { title: "Present Employees", value: presentEmployees.toString(), icon: UserCheck, change: totalEmployees > 0 ? `${Math.round((presentEmployees/totalEmployees)*100)}% attendance` : `0% attendance` },
        { title: "Absent Employees", value: absentEmployees.toString(), icon: UserX, change: totalEmployees > 0 ? `${Math.round((absentEmployees/totalEmployees)*100)}% absent` : `0% absent` },
    ];

  return (
    <div className="grid gap-6">
      <div className="grid md:grid-cols-3 gap-6">
        {kpiData.map((item, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">{item.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Real-time Entry/Exit Report</CardTitle>
          <CardDescription>A live feed of employee attendance activities.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Time</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {activities.map((activity, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium">{activity.name}</TableCell>
                        <TableCell>
                            <span className={`flex items-center gap-2 ${activity.type === 'Entry' ? 'text-primary' : 'text-destructive'}`}>
                            {activity.type === 'Entry' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                            {activity.type}
                            </span>
                        </TableCell>
                        <TableCell>{activity.time}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
