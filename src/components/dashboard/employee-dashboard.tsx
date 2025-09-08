
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, ArrowLeft, Hourglass, CalendarPlus, Banknote, AlertTriangle, CalendarDays, PartyPopper, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AttendanceRecord, markAttendance, getEmployeeAttendance, DailyAttendanceSummary, getDailyAttendanceSummary } from "@/services/attendanceService";
import { getEmployeeByEmail, Employee } from "@/services/employeeService";
import { Timestamp, getDoc, doc } from "firebase/firestore";
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
import { format, differenceInDays, getDaysInMonth, startOfWeek, addDays, eachDayOfInterval, addMonths, getDay, isWithinInterval, isSameDay, differenceInMilliseconds, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { createTimeOffRequest, getEmployeeTimeOffRequests, TimeOffRequest, TimeOffReason, VacationBank, getVacationBank, updateVacationBank } from "@/services/timeOffRequestService";
import { Badge } from "../ui/badge";
import { getEmployeeScheduleAssignments, Shift, getShifts, EmployeeScheduleAssignment, RotationPattern, getRotationPatterns, Holiday, getHolidays } from "@/services/scheduleService";
import { Switch } from "../ui/switch";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { db } from "@/lib/firebase";


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
  const [lastAction, setLastAction] = useState<'Entry' | 'Exit' | null>(null);
  const [timeWorked, setTimeWorked] = useState("0h 0m");
  const [isLoading, setIsLoading] = useState(true);
  const [isMarking, setIsMarking] = useState(false);
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
  const [assignments, setAssignments] = useState<EmployeeScheduleAssignment[]>([]);
  const [dailySummary, setDailySummary] = useState<DailyAttendanceSummary[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());


  const fetchEmployeeData = async () => {
    if (user?.email) {
      setIsLoading(true);
      const employeeData = await getEmployeeByEmail(user.email);

      if (employeeData) {
        setEmployee(employeeData);
        const attendanceRecords = await getEmployeeAttendance(employeeData.id, 5);
        
        if (attendanceRecords.length > 0) {
            const latestRecord = attendanceRecords.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())[0];
            setLastAction(latestRecord.type);
        }

        const summary = await getDailyAttendanceSummary(5, [employeeData]);
        setDailySummary(summary);
        
        const todayRecords = attendanceRecords.filter(r => r.timestamp.toDate().toDateString() === new Date().toDateString());
        if(todayRecords.length > 0) {
            const latestEntry = todayRecords.find(r => r.type === 'Entry');
            const latestExit = todayRecords.find(r => r.type === 'Exit');
            
            if (latestEntry && !latestExit) {
                 const diff = new Date().getTime() - latestEntry.timestamp.toMillis();
                 const hours = Math.floor(diff / 3600000);
                 const minutes = Math.floor((diff % 3600000) / 60000);
                 setTimeWorked(`${hours}h ${minutes}m (ongoing)`);
            } else if (latestEntry && latestExit && latestExit.timestamp.toMillis() > latestEntry.timestamp.toMillis()) {
                 const diff = latestExit.timestamp.toMillis() - latestEntry.timestamp.toMillis();
                 const hours = Math.floor(diff / 3600000);
                 const minutes = Math.floor((diff % 3600000) / 60000);
                 setTimeWorked(`${hours}h ${minutes}m`);
            } else {
                 setTimeWorked("0h 0m");
            }
        }


        const torRequests = await getEmployeeTimeOffRequests(employeeData.id);
        setTimeOffRequests(torRequests);

        const bank = await getVacationBank(employeeData.id);
        if (bank) {
            const hireDate = employeeData.hireDate.toDate();
            
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
         const allShifts = await getShifts();
         const allPatterns = await getRotationPatterns();
         const allAssignments = await getEmployeeScheduleAssignments();
         const allHolidays = await getHolidays();
         setShifts(allShifts);
         setRotationPatterns(allPatterns);
         setAssignments(allAssignments);
         setHolidays(allHolidays);
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [user]);
  
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3; // metres
      const φ1 = lat1 * Math.PI/180;
      const φ2 = lat2 * Math.PI/180;
      const Δφ = (lat2-lat1) * Math.PI/180;
      const Δλ = (lon2-lon1) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      return R * c;
  }
  
  const getCurrentPosition = (): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
          });
      });
  }

  const handleMarking = async (type: 'Entry' | 'Exit') => {
    if (!employee || !employee.locationId) {
        toast({ title: "Error", description: "Employee data or location not found.", variant: "destructive" });
        return;
    }
    
    setIsMarking(true);

    try {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;

        const locationDocRef = doc(db, 'locations', employee.locationId);
        const locationDoc = await getDoc(locationDocRef);

        if (!locationDoc.exists() || !locationDoc.data().latitude) {
            toast({ title: "Location Error", description: "Your assigned work location has no coordinates set.", variant: "destructive" });
            setIsMarking(false);
            return;
        }

        const locationData = locationDoc.data();
        const distance = getDistance(latitude, longitude, locationData.latitude, locationData.longitude);
        
        if (distance > 100) { // 100 meters radius
             toast({ 
                title: "Too Far to Mark", 
                description: `You must be within 100 meters of your work location. You are currently ${Math.round(distance)}m away.`, 
                variant: "destructive",
                duration: 5000,
             });
             setIsMarking(false);
             return;
        }
        
        const newRecord: Omit<AttendanceRecord, 'id'> = {
            employeeId: employee.id,
            type,
            timestamp: Timestamp.now(),
            latitude,
            longitude,
        };

        await markAttendance(newRecord);
        fetchEmployeeData();
        toast({
            title: `Marked ${type} Successfully`,
            description: `Your ${type.toLowerCase()} at ${newRecord.timestamp.toDate().toLocaleTimeString()} has been recorded.`,
        });
    } catch (error) {
        let errorMessage = "Could not mark attendance.";
        if (error instanceof GeolocationPositionError) {
           errorMessage = "Could not get your location. Please enable location services.";
        }
        console.error(`Error marking ${type}:`, error);
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
        setIsMarking(false);
    }
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
        attachmentUrl = `https://fake-storage.com/${newRequest.attachment.name}`;
         toast({title: "File Upload", description: "File upload is a mock. No real file was saved."});
    }

    const requestPayload: Omit<TimeOffRequest, 'id' | 'requestedAt' | 'status'> = {
        employeeId: employee.id,
        employeeName: employee.fullName,
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
    if (!employee) return { name: 'Not Assigned', time: '', isHoliday: false };

    const holiday = holidays.find(h => isSameDay(h.date.toDate(), date));
    if (holiday) {
        return { name: holiday.name, time: 'Holiday', isHoliday: true };
    }

    const assignmentForDate = assignments.find(a => 
        a.employeeId === employee.id && isWithinInterval(date, { start: a.startDate.toDate(), end: a.endDate.toDate() })
    );

    if (!assignmentForDate) return { name: 'Not Assigned', time: '', isHoliday: false };

    const pattern = rotationPatterns.find(p => p.id === assignmentForDate.rotationPatternId);
    if (!pattern || !pattern.weeks || pattern.weeks.length === 0) return { name: 'Invalid Pattern', time: '', isHoliday: false };

    const startDate = assignmentForDate.startDate.toDate();
    const daysSinceStart = differenceInDays(date, startDate);
    const weekIndex = Math.floor(daysSinceStart / 7) % pattern.weeks.length;
    
    const dayIndex = (getDay(date) + 6) % 7; 

    const shiftId = pattern.weeks[weekIndex]?.days[dayIndex];

    if (!shiftId) return { name: 'Day Off', time: '', isHoliday: false };

    const shiftInfo = shifts.find(s => s.id === shiftId);
    if (!shiftInfo) return { name: 'Unknown Shift', time: '', isHoliday: false };

    return {
        name: shiftInfo.name,
        time: `${format(shiftInfo.startTime, 'p')} - ${format(shiftInfo.endTime, 'p')}`,
        isHoliday: false
    };
  }

  const calculateTotalHours = (item: DailyAttendanceSummary) => {
    if (!item.clockInTimestamp || !item.clockOutTimestamp) return 'N/A';
    
    let diff = differenceInMilliseconds(item.clockOutTimestamp.toDate(), item.clockInTimestamp.toDate());
    
    if (item.mealBreakTaken) {
        diff -= 3600000;
    }

    if (diff < 0) diff = 0;
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    return `${hours}h ${minutes}m`;
  };

  // --- Calendar View Logic ---
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startingDayIndex = (getDay(monthStart) + 6) % 7; // 0 for Monday

    const getDailyScheduleForEmployee = (day: Date) => {
        if (!employee) return { type: 'none' as const };

        const holiday = holidays.find(h => isSameDay(h.date.toDate(), day));
        if (holiday) {
            return { type: 'holiday' as const, name: holiday.name };
        }
        
        const approvedLeave = timeOffRequests.find(req => 
            req.employeeId === employee.id &&
            req.status === 'approved' && 
            isWithinInterval(day, { start: req.startDate.toDate(), end: req.endDate.toDate() })
        );

        if (approvedLeave) {
             return { type: 'leave' as const, reason: approvedLeave.reason };
        }

        const assignmentForDate = assignments.find(a => 
            a.employeeId === employee.id && isWithinInterval(day, { start: a.startDate.toDate(), end: a.endDate.toDate() })
        );

        if (!assignmentForDate) {
            return { type: 'none' as const };
        }

        const pattern = rotationPatterns.find(p => p.id === assignmentForDate.rotationPatternId);
        if (!pattern || !pattern.weeks || pattern.weeks.length === 0) return { type: 'none' as const };
        
        const daysSinceStart = differenceInDays(day, assignmentForDate.startDate.toDate());
        const weekIndex = Math.floor(daysSinceStart / 7) % pattern.weeks.length;
        const dayIndex = (getDay(day) + 6) % 7;
        const shiftId = pattern.weeks[weekIndex]?.days[dayIndex];

        if (shiftId) {
            const shiftInfo = shifts.find(s => s.id === shiftId);
            if (shiftInfo) {
                return { type: 'work' as const, shift: `${shiftInfo.name}: ${format(shiftInfo.startTime, 'p')} - ${format(shiftInfo.endTime, 'p')}` };
            }
        }

        return { type: 'none' as const };
    }

    const getLeaveBackgroundColor = (reason: TimeOffReason) => {
        if (reason === 'Vacaciones') {
            return 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
        }
        return 'bg-red-200 dark:bg-red-800/50 text-red-800 dark:text-red-200';
    }
  
    const calendarWeekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];


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
            <Button onClick={() => handleMarking('Entry')} disabled={lastAction === 'Entry' || isMarking} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
              <ArrowRight className="mr-2 h-5 w-5" />
              {isMarking && lastAction !== 'Exit' ? 'Validating...' : 'Mark Entry (Clock In)'}
            </Button>
            <Button onClick={() => handleMarking('Exit')} disabled={lastAction !== 'Entry' || isMarking} className="flex-1" size="lg" variant="destructive">
              <ArrowLeft className="mr-2 h-5 w-5" />
              {isMarking && lastAction === 'Entry' ? 'Validating...' : 'Mark Exit (Clock Out)'}
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
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>My Schedule</CardTitle>
                <CardDescription>Your work schedule for the current week.</CardDescription>
            </div>
             <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon"><CalendarDays className="h-4 w-4"/></Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                   <DialogHeader>
                       <DialogTitle>My Monthly Schedule</DialogTitle>
                   </DialogHeader>
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft/></Button>
                            <h2 className="text-2xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
                            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight/></Button>
                        </div>
                        <Button onClick={() => setCurrentDate(new Date())}>Today</Button>
                    </div>
                    <TooltipProvider>
                    <div className="grid grid-cols-7 border-t border-l">
                        {calendarWeekDays.map(day => (
                            <div key={day} className="p-2 border-b border-r text-center font-bold text-sm bg-muted/50">{day}</div>
                        ))}
                        {Array.from({ length: startingDayIndex }).map((_, i) => (
                            <div key={`empty-${i}`} className="border-b border-r" />
                        ))}
                        {daysInMonth.map(day => {
                            const scheduleInfo = getDailyScheduleForEmployee(day);
                            const isToday = isSameDay(day, new Date());
                            return (
                                <div key={day.toString()} className={cn("p-2 border-b border-r min-h-[100px] h-full", isToday && "bg-blue-950")}>
                                    <div className={cn("text-right text-sm", isToday && "font-bold text-primary")}>{format(day, 'd')}</div>
                                    <div className="space-y-1 mt-1 text-xs">
                                        {scheduleInfo.type === 'holiday' && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                     <div className="flex justify-center items-center h-full">
                                                        <PartyPopper className="h-8 w-8 text-red-700 dark:text-red-500"/>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent><p>{scheduleInfo.name}</p></TooltipContent>
                                            </Tooltip>
                                        )}
                                        {scheduleInfo.type === 'leave' && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <p className={cn("truncate p-1 rounded-md cursor-default", getLeaveBackgroundColor(scheduleInfo.reason))}>
                                                        On Leave
                                                    </p>
                                                </TooltipTrigger>
                                                <TooltipContent><p>{scheduleInfo.reason}</p></TooltipContent>
                                            </Tooltip>
                                        )}
                                        {scheduleInfo.type === 'work' && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <p className="truncate p-1 rounded-md bg-green-200 dark:bg-green-800/50 text-green-800 dark:text-green-200 cursor-default">
                                                        Scheduled
                                                    </p>
                                                </TooltipTrigger>
                                                <TooltipContent><p>{scheduleInfo.shift}</p></TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                  </TooltipProvider>
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-7 gap-2">
            {weekDays.map(day => {
                const shiftInfo = getShiftForDate(day);
                return (
                    <div key={day.toString()} className={`rounded-lg border p-3 text-center ${shiftInfo.isHoliday ? 'bg-accent/20' : ''}`}>
                        <p className="text-sm font-semibold">{format(day, 'EEE')}</p>
                        <p className="text-xs text-muted-foreground">{format(day, 'MMM d')}</p>
                        {shiftInfo.isHoliday && <PartyPopper className="mx-auto mt-2 h-5 w-5 text-accent" />}
                        <p className={`text-xs mt-2 ${shiftInfo.isHoliday ? 'font-bold text-accent' : ''}`}>{shiftInfo.name}</p>
                        <p className="text-xs font-mono text-primary">{shiftInfo.time}</p>
                    </div>
                );
            })}
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
              <CardDescription>Your attendance summary for the last 5 days.</CardDescription>
          </CardHeader>
          <CardContent>
          <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Meal Break</TableHead>
                    <TableHead>Total Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {dailySummary.map((summaryItem) => (
                  <TableRow key={summaryItem.id}>
                    <TableCell>{summaryItem.date}</TableCell>
                    <TableCell className="text-primary">{summaryItem.clockIn || 'N/A'}</TableCell>
                    <TableCell className="text-destructive">{summaryItem.clockOut || 'N/A'}</TableCell>
                    <TableCell>
                        <Badge variant={summaryItem.wasScheduled ? 'default' : 'destructive'}>
                            {summaryItem.wasScheduled ? 'Yes' : 'No'}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <Switch
                            checked={summaryItem.mealBreakTaken}
                            disabled={true}
                            aria-label="Meal Break Taken"
                        />
                    </TableCell>
                    <TableCell className="font-mono">{calculateTotalHours(summaryItem)}</TableCell>
                  </TableRow>
              ))}
              </TableBody>
          </Table>
           {dailySummary.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-4">No recent activity found.</p>
            )}
          </CardContent>
      </Card>
    </div>
  );
}
