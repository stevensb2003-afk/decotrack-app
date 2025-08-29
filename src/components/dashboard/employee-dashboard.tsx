"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, ArrowLeft, Hourglass } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type AttendanceRecord = {
  type: 'Entry' | 'Exit';
  timestamp: Date;
};

const mockRecords: AttendanceRecord[] = [
  { type: 'Exit', timestamp: new Date(new Date().getTime() - 24 * 60 * 60 * 1000) },
  { type: 'Entry', timestamp: new Date(new Date().getTime() - (24 + 8) * 60 * 60 * 1000) },
  { type: 'Exit', timestamp: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000) },
  { type: 'Entry', timestamp: new Date(new Date().getTime() - (2* 24 + 8) * 60 * 60 * 1000) },
  { type: 'Exit', timestamp: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000) },
];


export default function EmployeeDashboard() {
  const { toast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>(mockRecords);
  const [lastAction, setLastAction] = useState<'Exit' | 'Entry' | null>(null);
  const [timeWorked, setTimeWorked] = useState("0h 0m");

  useEffect(() => {
    if (records.length > 0) {
      setLastAction(records[0].type);
    }
  }, [records]);
  
  useEffect(() => {
    const todayRecords = records.filter(r => new Date(r.timestamp).toDateString() === new Date().toDateString());
    const latestEntry = todayRecords.find(r => r.type === 'Entry');
    const latestExit = todayRecords.find(r => r.type === 'Exit');

    if (latestExit && latestEntry && latestExit.timestamp > latestEntry.timestamp) {
        const diff = latestExit.timestamp.getTime() - latestEntry.timestamp.getTime();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        setTimeWorked(`${hours}h ${minutes}m`);
    } else {
        setTimeWorked("0h 0m");
    }
  }, [records]);

  const handleMarking = (type: 'Entry' | 'Exit') => {
    const newRecord = { type, timestamp: new Date() };
    setRecords([newRecord, ...records]);
    setLastAction(type);
    toast({
      title: `Marked ${type} Successfully`,
      description: `Your ${type.toLowerCase()} at ${newRecord.timestamp.toLocaleTimeString()} has been recorded.`,
    });
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>My Attendance</CardTitle>
          <CardDescription>Mark your daily entry and exit points.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => handleMarking('Entry')} disabled={lastAction === 'Entry'} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" size="lg">
            <ArrowRight className="mr-2 h-5 w-5" />
            Mark Entry
          </Button>
          <Button onClick={() => handleMarking('Exit')} disabled={lastAction !== 'Entry'} className="flex-1" size="lg">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Mark Exit
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
                    <TableCell>{new Date(record.timestamp).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(record.timestamp).toLocaleTimeString()}</TableCell>
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
