
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, ArrowLeft, Hourglass, CalendarPlus, Banknote, AlertTriangle, CalendarDays } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AttendanceRecord, markAttendance, getEmployeeAttendance } from "@/services/attendanceService";
import { getEmployeeByEmail, Employee } from "@/services/employeeService";
import { Timestamp } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays, getDaysInMonth, startOfWeek, addDays, eachDayOfInterval, addMonths, getDay, isWithinInterval } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { createTimeOffRequest, getEmployeeTimeOffRequests, TimeOffRequest, TimeOffReason, VacationBank, getVacationBank, updateVacationBank } from "@/services/timeOffRequestService";
import { Badge } from "../ui/badge";
import { getEmployeeScheduleAssignments, Shift, getShifts, EmployeeScheduleAssignment, RotationPattern, getRotationPatterns } from "@/services/scheduleService";

const timeOffReasons: TimeOffReason[] = [
    'Vacaciones',
    'Incapacidad por enfermedad',
    'Licencia de maternidad',
    'Licencia de paternidad',
,'Licencia por adoción'
    ,'Permiso para cita médica'
    ,'Licencia por duelo'
    ,'Licencia por Matrimonio'
];

export default function EmployeeDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [lastAction, setLastAction] = useState<'Entry' | 'Exit' | null>(null);
  const [timeWorked, setTimeWorked] = useState("0h 0m");
  const [isLoading, setIsLoading] = useState(true);
  const [isTorDialogOpen, setTorDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState<{
      reason: TimeOffReason | '',
      startDate: Date | undefined,
      endDate: Date | undefined,
      hours?: number,
      comments?: string,
      attachment?: File | null,
  }>({ reason: '', startDate: undefined, endDate: undefined });
  const [vacationBank, setVacationBank] = useState<VacationBank | null>(null);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  
  // Schedule state
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [rotationPatterns, setRotationPatterns] = useState<RotationPattern[]>([]);
  const [assignment, setAssignment] = useState<EmployeeScheduleAssignment | null>(null);


  const fetchEmployeeData = async () => {
    if (user?.email) {
      setIsLoading(true);
      const employeeData = await getEmployeeByEmail(user.email);
      if (employeeData) {
        setEmployee(employeeData);
        const attendanceRecords = await getEmployeeAttendance(employeeData.id, 5);
        setRecords(attendanceRecords);
        const torRequests = await getEmployeeTimeOffRequests(employeeData.id);
        setTimeOffRequests(torRequests);

        const bank = await getVacationBank(employeeData.id);
        if (bank) {
            const hireDate = employeeData.hireDate.toDate();
            
            // Simplified accrual logic
            const today = new Date();
            let accruedDays = 0;
            let lastAccrual = hireDate;

            while(addMonths(lastAccrual, 1) <= today) {
                accruedDays++;
                lastAccrual = addMonths(lastAccrual, 1);
            }
            
            const usedDays = torRequests
                .filter(req => req.reason === 'Vacaciones' && req.status === 'approved')
                .reduce((total, req) => {
                    const days = differenceInDays(req.endDate.toDate(), req.startDate.toDate()) + 1;
                    return total + days;
                }, 0);
            
            const newBalance = accruedDays - usedDays;
            
            if (bank.balance !== newBalance) {
                await updateVacationBank(bank.id, { balance: newBalance });
                setVacationBank({ ...bank, balance: newBalance });
            } else {
                setVacationBank(bank);
            }
        }
         // Fetch all scheduling data
         const allShifts = await getShifts();
         const allPatterns = await getRotationPatterns();
         const allAssignments = await getEmployeeScheduleAssignments();
         setShifts(allShifts);
         setRotationPatterns(allPatterns);
         
         const employeeAssignment = allAssignments.find(a => a.employeeId === employeeData.id && isWithinInterval(new Date(), { start: a.startDate.toDate(), end: a.endDate.toDate() }));
         setAssignment(employeeAssignment || null);
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
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
    if (!employee) return;

    const newRecord = { 
        employeeId: employee.id, 
        type, 
        timestamp: Timestamp.now() 
    };
    await markAttendance(newRecord);
    
    const newRecords = await getEmployeeAttendance(employee.id, 5);
    setRecords(newRecords);

    toast({
      title: `Marked ${type} Successfully`,
      description: `Your ${type.toLowerCase()} at ${newRecord.timestamp.toDate().toLocaleTimeString()} has been recorded.`,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewRequest(prev => ({...prev, attachment: e.target.files ? e.target.files[0] : null}));
  }

  const handleSubmitRequest = async () => {
    if(!employee || !newRequest.reason || !newRequest.startDate || !newRequest.endDate) {
        toast({title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive"});
        return;
    }

    if (newRequest.reason === 'Vacaciones') {
      const requestedDays = differenceInDays(newRequest.endDate, newRequest.startDate) + 1;
      if (!vacationBank || vacationBank.balance < requestedDays) {
        toast({
          title: "Insufficient Vacation Balance",
          description: `You do not have enough days for this request. Your balance is ${vacationBank?.balance || 0} days.`,
          variant: "destructive"
        });
        return;
      }
    }

    let attachmentUrl = undefined;
    if(newRequest.attachment) {
        // In a real app, upload this to Firebase Storage and get URL
        attachmentUrl = `https://fake-storage.com/${newRequest.attachment.name}`;
         toast({title: "File Upload", description: "File upload is a mock. No real file was saved."});
    }

    const requestPayload: Omit<TimeOffRequest, 'id' | 'requestedAt' | 'status'> = {
        employeeId: employee.id,
        employeeName: employee.name,
        reason: newRequest.reason,
        startDate: Timestamp.fromDate(newRequest.startDate),
        endDate: Timestamp.fromDate(newRequest.endDate),
    };
    
    if (newRequest.hours) {
        requestPayload.hours = newRequest.hours;
    }
    if (newRequest.comments) {
        requestPayload.comments = newRequest.comments;
    }
    if (attachmentUrl) {
        requestPayload.attachmentUrl = attachmentUrl;
    }

    await createTimeOffRequest(requestPayload);
    
    toast({ title: "Request Submitted", description: "Your time off request has been sent for approval." });
    setTorDialogOpen(false);
    setNewRequest({ reason: '', startDate: undefined, endDate: undefined });
    fetchEmployeeData();
  }

  const getStatusVariant = (status: TimeOffRequest['status']) => {
    switch(status) {
        case 'approved': return 'default';
        case 'rejected': return 'destructive';
        case 'pending': return 'secondary';
        default: return 'outline';
    }
  }
  
  const weekDays = eachDayOfInterval({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 6),
  });

  const getShiftForDate = (date: Date) => {
    if (!assignment) return { name: 'Not Assigned', time: ''};

    const pattern = rotationPatterns.find(p => p.id === assignment.rotationPatternId);
    if (!pattern || !pattern.weeks || pattern.weeks.length === 0) return { name: 'Invalid Pattern', time: ''};

    const startDate = assignment.startDate.toDate();
    const daysSinceStart = differenceInDays(date, startDate);
    const weekIndex = Math.floor(daysSinceStart / 7) % pattern.weeks.length;
    
    // getDay returns 0 for Sunday, we want 6
    const dayIndex = (getDay(date) + 6) % 7; 

    const shiftId = pattern.weeks[weekIndex]?.days[dayIndex];

    if (!shiftId) return { name: 'Day Off', time: '' };

    const shiftInfo = shifts.find(s => s.id === shiftId);
    if (!shiftInfo) return { name: 'Unknown Shift', time: '' };

    return {
        name: shiftInfo.name,
        time: `${format(shiftInfo.startTime, 'p')} - ${format(shiftInfo.endTime, 'p')}`
    };
  }


  if(isLoading) {
    return <div>Loading dashboard...</div>
  }

  return (
    <div className="grid gap-6">
      <div className="grid md:grid-cols-2 gap-6">
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
        <div className="grid grid-cols-2 gap-6">
            <Card>
                <CardHeader className="items-center text-center pb-2">
                    <Hourglass className="h-8 w-8 text-primary" />
                    <CardTitle>Time Worked</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-3xl font-bold">{timeWorked}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="items-center text-center pb-2">
                    <Banknote className="h-8 w-8 text-primary" />
                    <CardTitle>Vacation Days</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-3xl font-bold">{vacationBank?.balance || 0}</p>
                    { (vacationBank?.balance || 0) > 15 && (
                        <p className="text-xs text-destructive flex items-center justify-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Balance over 15 days
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>My Schedule</CardTitle>
            <CardDescription>Your work schedule for the current week.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-7 gap-2">
            {weekDays.map(day => (
                <div key={day.toString()} className="rounded-lg border p-3 text-center">
                    <p className="text-sm font-semibold">{format(day, 'EEE')}</p>
                    <p className="text-xs text-muted-foreground">{format(day, 'MMM d')}</p>
                    <p className="text-xs mt-2">{getShiftForDate(day).name}</p>
                    <p className="text-xs font-mono text-primary">{getShiftForDate(day).time}</p>
                </div>
            ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>My Time Off Requests</CardTitle>
                <CardDescription>Request time off and see your request history.</CardDescription>
            </div>
            <Dialog open={isTorDialogOpen} onOpenChange={setTorDialogOpen}>
                <DialogTrigger asChild>
                    <Button><CalendarPlus className="mr-2 h-4 w-4" /> New Request</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>New Time Off Request</DialogTitle>
                        <DialogDescription>Complete the form to submit your request.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-6">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason</Label>
                            <Select value={newRequest.reason} onValueChange={(val: TimeOffReason) => setNewRequest({...newRequest, reason: val})}>
                                <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
                                <SelectContent>
                                    {timeOffReasons.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="start-date">Start Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !newRequest.startDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {newRequest.startDate ? format(newRequest.startDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={newRequest.startDate} onSelect={(d) => setNewRequest(prev => ({...prev, startDate: d}))} initialFocus weekStartsOn={1} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-date">End Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !newRequest.endDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {newRequest.endDate ? format(newRequest.endDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={newRequest.endDate} onSelect={(d) => setNewRequest(prev => ({...prev, endDate: d}))} initialFocus weekStartsOn={1} />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {newRequest.reason === "Permiso para cita médica" && (
                            <div className="space-y-2">
                                <Label htmlFor="hours">Hours</Label>
                                <Input id="hours" type="number" value={newRequest.hours || ''} onChange={e => setNewRequest(prev => ({...prev, hours: parseInt(e.target.value)}))} />
                            </div>
                        )}

                        {newRequest.reason === "Incapacidad por enfermedad" && (
                             <div className="space-y-2">
                                <Label htmlFor="attachment">Medical Certificate</Label>
                                <Input id="attachment" type="file" onChange={handleFileChange} />
                            </div>
                        )}
                        
                        <div className="space-y-2">
                           <Label htmlFor="comments">Comments</Label>
                           <Textarea id="comments" value={newRequest.comments || ''} onChange={e => setNewRequest(prev => ({...prev, comments: e.target.value}))} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTorDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmitRequest}>Submit Request</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Reason</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {timeOffRequests.slice(0,5).map(req => (
                        <TableRow key={req.id}>
                            <TableCell>{req.reason}</TableCell>
                            <TableCell>{format(req.startDate.toDate(), "PPP")} - {format(req.endDate.toDate(), "PPP")}</TableCell>
                            <TableCell><Badge variant={getStatusVariant(req.status)}>{req.status}</Badge></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {timeOffRequests.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">You have no time off requests.</p>
            )}
        </CardContent>
      </Card>
      <Card>
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
    </div>
  );
}

    
    