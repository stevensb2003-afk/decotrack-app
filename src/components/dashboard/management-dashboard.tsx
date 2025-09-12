
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserCheck, UserX } from "lucide-react";
import { getAllEmployees, Employee } from '@/services/employeeService';
import { getDailyAttendanceSummary, DailyAttendanceSummary, updateAttendanceDetail } from '@/services/attendanceService';
import { collection, onSnapshot, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { differenceInMilliseconds } from 'date-fns';

export default function ManagementDashboard() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [summary, setSummary] = useState<DailyAttendanceSummary[]>([]);
    const [presentCount, setPresentCount] = useState(0);

    const fetchData = async () => {
        const emps = await getAllEmployees();
        setEmployees(emps);

        if (emps.length > 0) {
            const summaryData = await getDailyAttendanceSummary(30, emps);
            setSummary(summaryData);
        }
    };

    useEffect(() => {
        fetchData();
        
        const q = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, async () => {
            // Refetch all data on any attendance change
            const emps = await getAllEmployees();
            setEmployees(emps);
            if (emps.length > 0) {
                const summaryData = await getDailyAttendanceSummary(30, emps);
                setSummary(summaryData);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (employees.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const attendanceQuery = query(
                collection(db, 'attendance'),
                where('timestamp', '>=', today)
            );

            const unsubscribe = onSnapshot(attendanceQuery, (snapshot) => {
                const latestActions = new Map<string, 'Entry' | 'Exit'>();
                
                // Get the most recent action for each employee today
                const sortedDocs = snapshot.docs.sort((a,b) => b.data().timestamp.toMillis() - a.data().timestamp.toMillis());

                sortedDocs.forEach(doc => {
                    const record = doc.data() as { employeeId: string; type: 'Entry' | 'Exit'; timestamp: Timestamp };
                    if (!latestActions.has(record.employeeId)) {
                        latestActions.set(record.employeeId, record.type);
                    }
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

    const handleMealBreakToggle = async (summaryId: string, currentValue: boolean) => {
        // Optimistic UI update
        setSummary(currentSummary =>
            currentSummary.map(item =>
                item.id === summaryId
                    ? { ...item, mealBreakTaken: !currentValue }
                    : item
            )
        );

        try {
            await updateAttendanceDetail(summaryId, { mealBreakTaken: !currentValue });
            toast({ title: 'Meal Break Updated', description: 'The meal break status has been changed.' });
        } catch (error) {
            // Revert UI if update fails
             setSummary(currentSummary =>
                currentSummary.map(item =>
                    item.id === summaryId
                        ? { ...item, mealBreakTaken: currentValue } // Revert to original value
                        : item
                )
            );
            toast({ title: 'Update Failed', description: 'Could not update meal break status.', variant: 'destructive' });
        }
    };

    const calculateTotalHours = (item: DailyAttendanceSummary) => {
        if (!item.clockInTimestamp || !item.clockOutTimestamp) return 'N/A';
        
        let diff = differenceInMilliseconds(item.clockOutTimestamp.toDate(), item.clockInTimestamp.toDate());
        
        if (item.mealBreakTaken) {
            diff -= 3600000; // Deduct 1 hour in milliseconds
        }

        if (diff < 0) diff = 0;
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);

        return `${hours}h ${minutes}m`;
    };

    const totalEmployees = employees.length;
    const absentEmployees = totalEmployees - presentCount;
    const canEditMealBreak = user?.role === 'admin' || user?.role === 'hr';

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
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead className="hidden sm:table-cell">Date</TableHead>
                        <TableHead>Clock In</TableHead>
                        <TableHead>Clock Out</TableHead>
                        <TableHead className="hidden sm:table-cell">Scheduled</TableHead>
                        <TableHead className="hidden sm:table-cell">Meal Break</TableHead>
                        <TableHead>Total</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {summary.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">
                                <div>{item.employeeName}</div>
                                <div className="text-muted-foreground text-xs sm:hidden">{item.date}</div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{item.date}</TableCell>
                            <TableCell className="text-primary">{item.clockIn || 'N/A'}</TableCell>
                            <TableCell className="text-destructive">{item.clockOut || 'N/A'}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                                <Badge variant={item.wasScheduled ? 'default' : 'destructive'}>
                                    {item.wasScheduled ? 'Yes' : 'No'}
                                </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                                <Switch
                                    checked={item.mealBreakTaken}
                                    onCheckedChange={() => handleMealBreakToggle(item.id, item.mealBreakTaken)}
                                    disabled={!canEditMealBreak}
                                    aria-label="Toggle Meal Break"
                                />
                            </TableCell>
                             <TableCell className="font-mono">{calculateTotalHours(item)}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
             {summary.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-4">No attendance records found.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
