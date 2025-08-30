"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, ArrowLeft, Hourglass } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AttendanceRecord, markAttendance, getEmployeeAttendance } from "@/services/attendanceService";
import { getEmployeeByEmail } from "@/services/employeeService";
import { Timestamp } from "firebase/firestore";

export default function EmployeeDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [lastAction, setLastAction] = useState<'Entry' | 'Exit' | null>(null);
  const [timeWorked, setTimeWorked] = useState("0h 0m");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (user?.email) {
        setIsLoading(true);
        const employee = await getEmployeeByEmail(user.email);
        if (employee) {
          setEmployeeId(employee.id);
          const attendanceRecords = await getEmployeeAttendance(employee.id, 5);
          setRecords(attendanceRecords);
        }
        setIsLoading(false);
      }
    };
    fetchEmployeeData();
  }, [user]);

  useEffect(() => {
    if (records.length > 0) {
      const latestRecord = records.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())[0];
      setLastAction(latestRecord.type);
    }
  }, [records]);
  
  useEffect(() => {
    if (records.length === 0) return;

    const todayRecords = records.filter(r => r.timestamp.toDate().toDateString() === new Date().toDateString());
    const latestEntry = todayRecords.find(r => r.type === 'Entry');
    
    if (lastAction === 'Exit' && latestEntry) {
        const latestExit = todayRecords.find(r => r.type === 'Exit');
        if (latestExit && latestExit.timestamp.toMillis() > latestEntry.timestamp.toMillis()) {
            const diff = latestExit.timestamp.toMillis() - latestEntry.timestamp.toMillis();
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            setTimeWorked(`${hours}h ${minutes}m`);
        }
    } else if (lastAction === 'Entry' && latestEntry) {
        const diff = new Date().getTime() - latestEntry.timestamp.toMillis();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        setTimeWorked(`${hours}h ${minutes}m (ongoing)`);
    } else {
        setTimeWorked("0h 0m");
    }
  }, [records, lastAction]);

  const handleMarking = async (type: 'Entry' | 'Exit') => {
    if (!employeeId) return;

    const newRecord = { 
        employeeId, 
        type, 
        timestamp: Timestamp.now() 
    };
    await markAttendance(newRecord);
    
    const newRecords = await getEmployeeAttendance(employeeId, 5);
    setRecords(newRecords);

    toast({
      title: `Marked ${type} Successfully`,
      description: `Your ${type.toLowerCase()} at ${newRecord.timestamp.toDate().toLocaleTimeString()} has been recorded.`,
    });
  };

  if(isLoading) {
    return <div>Loading dashboard...</div>
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>My Attendance</CardTitle>
          <CardDescription>Mark your daily entry and exit points.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => handleMarking('Entry')} disabled={lastAction === 'Entry'} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
            <ArrowRight className="mr-2 h-5 w-5" />
            Mark Entry (Clock In)
          </Button>
          <Button onClick={() => handleMarking('Exit')} disabled={lastAction !== 'Entry'} className="flex-1" size="lg" variant="destructive">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Mark Exit (Clock Out)
          </Button>
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your last 5 attendance marks.</CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {records.slice(0, 5).map((record, index) => (
                    <TableRow key={index}>
                    <TableCell>
                        <span className={`flex items-center gap-2 font-medium ${record.type === 'Entry' ? 'text-primary' : 'text-destructive'}`}>
                        {record.type === 'Entry' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                        {record.type}
                        </span>
                    </TableCell>
                    <TableCell>{record.timestamp.toDate().toLocaleDateString()}</TableCell>
                    <TableCell>{record.timestamp.toDate().toLocaleTimeString()}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="items-center text-center">
                <Hourglass className="h-8 w-8 text-primary" />
                <CardTitle>Time Worked Today</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-4xl font-bold">{timeWorked}</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
