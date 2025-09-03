
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserCheck, UserX } from "lucide-react";
import { getAllEmployees, Employee } from '@/services/employeeService';
import { getDailyAttendanceSummary, DailyAttendanceSummary } from '@/services/attendanceService';
import { AttendanceRecord } from '@/services/attendanceService';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ManagementDashboard() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [summary, setSummary] = useState<DailyAttendanceSummary[]>([]);
    const [presentCount, setPresentCount] = useState(0);

    const fetchData = async () => {
        const emps = await getAllEmployees();
        setEmployees(emps);
        
        const summaryData = await getDailyAttendanceSummary(10, emps);
        setSummary(summaryData);
        
        const q = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, async () => {
            const updatedEmps = await getAllEmployees();
            const updatedSummary = await getDailyAttendanceSummary(10, updatedEmps);
            setEmployees(updatedEmps);
            setSummary(updatedSummary);
        });

        return () => unsubscribe();
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (employees.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const attendanceQuery = query(
                collection(db, 'attendance'),
                where('timestamp', '>=', today),
                orderBy('timestamp', 'asc') // Fetch in chronological order
            );

            const unsubscribe = onSnapshot(attendanceQuery, (snapshot) => {
                const latestActions = new Map<string, 'Entry' | 'Exit'>();
                // Process records in order to find the *last* action for each employee
                snapshot.docs.forEach(doc => {
                    const record = doc.data() as AttendanceRecord;
                    latestActions.set(record.employeeId, record.type);
                });

                let presentToday = 0;
                for (const type of latestActions.values()) {
                    if (type === 'Entry') {
                        presentToday++;
                    }
                }
                setPresentCount(presentToday);
            });

            return () => unsubscribe();
        }
    }, [employees]);

    const totalEmployees = employees.length;
    const absentEmployees = totalEmployees - presentCount;

    const kpiData = [
        { title: "Total Employees", value: totalEmployees.toString(), icon: Users, change: "All registered employees" },
        { title: "Present Employees", value: presentCount.toString(), icon: UserCheck, change: totalEmployees > 0 ? `${Math.round((presentCount/totalEmployees)*100)}% attendance` : `0% attendance` },
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
          <CardTitle>Daily Attendance Report</CardTitle>
          <CardDescription>A summary of employee clock-in and clock-out times.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {summary.map((daySummary, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium">{daySummary.employeeName}</TableCell>
                        <TableCell>{daySummary.date}</TableCell>
                        <TableCell className="text-primary">{daySummary.clockIn || 'N/A'}</TableCell>
                        <TableCell className="text-destructive">{daySummary.clockOut || 'N/A'}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
             {summary.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-4">No attendance records found.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
