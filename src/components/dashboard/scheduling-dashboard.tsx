
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, BrainCircuit, Repeat, PlusCircle, Trash2, CalendarDays, List, Filter, Pencil, PartyPopper, ChevronLeft, ChevronRight, Timer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shift, createShift, getShifts, RotationPattern, createRotationPattern, getRotationPatterns, EmployeeScheduleAssignment, createEmployeeScheduleAssignment, getEmployeeScheduleAssignments, deleteEmployeeScheduleAssignment, updateShift, updateRotationPattern, deleteRotationPattern, Holiday, getHolidays, createHoliday, updateHoliday, deleteHoliday, GracePolicy, getGracePolicies, createGracePolicy, updateGracePolicy, deleteGracePolicy } from '@/services/scheduleService';
import { format, parse, getDaysInMonth, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, isWithinInterval, differenceInDays } from 'date-fns';
import { Employee, getAllEmployees } from '@/services/employeeService';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { Timestamp } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Location, getAllLocations } from '@/services/locationService';
import { TimeOffReason, TimeOffRequest, getTimeOffRequests } from '@/services/timeOffRequestService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';


export default function SchedulingDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [rotationPatterns, setRotationPatterns] = useState<RotationPattern[]>([]);
  const [gracePolicies, setGracePolicies] = useState<GracePolicy[]>([]);
  const [assignments, setAssignments] = useState<EmployeeScheduleAssignment[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);

  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [isPatternDialogOpen, setIsPatternDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [isGracePolicyDialogOpen, setIsGracePolicyDialogOpen] = useState(false);
  
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [newShift, setNewShift] = useState({ name: '', startTime: '09:00', endTime: '17:00'});

  // State for pattern creation/editing
  const [editingPattern, setEditingPattern] = useState<RotationPattern | null>(null);
  const [patternName, setPatternName] = useState('');
  const [patternWeeks, setPatternWeeks] = useState<{ days: (string | null)[] }[]>([
    { days: Array(7).fill(null) }
  ]);
  const [patternGracePolicyId, setPatternGracePolicyId] = useState<string | null | undefined>(undefined);
  const [patternToDelete, setPatternToDelete] = useState<RotationPattern | null>(null);

  const [newAssignment, setNewAssignment] = useState<{
    employeeId: string;
    rotationPatternId: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({ employeeId: '', rotationPatternId: '', startDate: undefined, endDate: undefined });

  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [newHoliday, setNewHoliday] = useState<{name: string, date: Date | undefined}>({name: '', date: undefined});

  const [editingGracePolicy, setEditingGracePolicy] = useState<GracePolicy | null>(null);
  const [newGracePolicy, setNewGracePolicy] = useState<Omit<GracePolicy, 'id'>>({ name: '', graceInEarly: 0, graceInLate: 0, graceOutEarly: 0, graceOutLate: 0});

  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');

  const [currentDate, setCurrentDate] = useState(new Date());

  const { toast } = useToast();

  const fetchData = async () => {
    const employeesData = await getAllEmployees();
    const shiftsData = await getShifts();
    const patternsData = await getRotationPatterns();
    const assignmentsData = await getEmployeeScheduleAssignments();
    const holidaysData = await getHolidays();
    const locationsData = await getAllLocations();
    const timeOffData = await getTimeOffRequests('approved');
    const gracePoliciesData = await getGracePolicies();

    setEmployees(employeesData);
    setShifts(shiftsData);
    setRotationPatterns(patternsData);
    setAssignments(assignmentsData);
    setHolidays(holidaysData);
    setLocations(locationsData);
    setTimeOffRequests(timeOffData);
    setGracePolicies(gracePoliciesData);
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  const handleOpenEditShiftDialog = (shift: Shift) => {
    setEditingShift(shift);
    setNewShift({
        name: shift.name,
        startTime: format(shift.startTime, 'HH:mm'),
        endTime: format(shift.endTime, 'HH:mm')
    });
    setIsShiftDialogOpen(true);
  }

  const handleOpenCreateShiftDialog = () => {
    setEditingShift(null);
    setNewShift({ name: '', startTime: '09:00', endTime: '17:00' });
    setIsShiftDialogOpen(true);
  }
  
  const handleSaveShift = async () => {
    if(!newShift.name || !newShift.startTime || !newShift.endTime) {
        toast({title: "Shift details are required", variant: "destructive"});
        return;
    }

    const parseTime = (timeStr: string) => parse(timeStr, 'HH:mm', new Date());
    const startDate = parseTime(newShift.startTime);
    const endDate = parseTime(newShift.endTime);

    if(editingShift) {
        await updateShift(editingShift.id, {
            name: newShift.name,
            startTime: startDate,
            endTime: endDate
        });
        toast({ title: "Shift Updated", description: "The shift has been updated." });
    } else {
        await createShift({ 
            name: newShift.name, 
            startTime: startDate, 
            endTime: endDate
        });
        toast({ title: "Shift Created", description: "The new shift has been saved." });
    }
    setIsShiftDialogOpen(false);
    setNewShift({ name: '', startTime: '09:00', endTime: '17:00'});
    setEditingShift(null);
    fetchData();
  }

  // --- Pattern Functions ---
  const handleOpenCreatePatternDialog = () => {
    setEditingPattern(null);
    setPatternName('');
    setPatternWeeks([{ days: Array(7).fill(null) }]);
    setPatternGracePolicyId(undefined);
    setIsPatternDialogOpen(true);
  }

  const handleOpenEditPatternDialog = (pattern: RotationPattern) => {
    setEditingPattern(pattern);
    setPatternName(pattern.name);
    setPatternWeeks(pattern.weeks || [{ days: Array(7).fill(null) }]);
    setPatternGracePolicyId(pattern.gracePolicyId);
    setIsPatternDialogOpen(true);
  };

  const handleSavePattern = async () => {
    if (!patternName || patternWeeks.every(w => w.days.every(d => d === null))) {
        toast({ title: "Missing fields", description: "Pattern name and at least one shift assignment are required.", variant: "destructive" });
        return;
    }

    const patternData = { 
        name: patternName, 
        weeks: patternWeeks, 
        gracePolicyId: patternGracePolicyId === 'none' ? null : patternGracePolicyId 
    };

    if (editingPattern) {
        await updateRotationPattern(editingPattern.id, patternData);
        toast({ title: "Pattern Updated", description: "The rotation pattern has been successfully updated." });
    } else {
        await createRotationPattern(patternData);
        toast({ title: "Pattern Created", description: "The new rotation pattern has been saved." });
    }
    fetchData();
    setIsPatternDialogOpen(false);
  };

  const handleDeletePattern = async () => {
    if (!patternToDelete) return;
    const assigned = assignments.some(a => a.rotationPatternId === patternToDelete.id);
    if(assigned) {
        toast({ title: "Cannot Delete Pattern", description: "This pattern is currently assigned to one or more employees.", variant: "destructive"});
        setPatternToDelete(null);
        return;
    }

    await deleteRotationPattern(patternToDelete.id);
    toast({ title: "Pattern Deleted", description: `The "${patternToDelete.name}" pattern has been deleted.` });
    setPatternToDelete(null);
    fetchData();
  };

  const handleDayShiftChange = (weekIndex: number, dayIndex: number, shiftId: string) => {
    const newWeeks = [...patternWeeks];
    newWeeks[weekIndex].days[dayIndex] = shiftId === 'day-off' ? null : shiftId;
    setPatternWeeks(newWeeks);
  };

  const addWeekToPattern = () => {
    setPatternWeeks([...patternWeeks, { days: Array(7).fill(null) }]);
  };

  const removeWeekFromPattern = (weekIndex: number) => {
      const newWeeks = [...patternWeeks];
      newWeeks.splice(weekIndex, 1);
      setPatternWeeks(newWeeks);
  };


  const handleCreateAssignment = async () => {
    const { employeeId, rotationPatternId, startDate, endDate } = newAssignment;
    if (!employeeId || !rotationPatternId || !startDate || !endDate) {
        toast({ title: "Missing Fields", description: "All fields are required to create an assignment.", variant: "destructive" });
        return;
    }
    
    const existingAssignment = assignments.find(a => 
        a.employeeId === employeeId &&
        isWithinInterval(startDate, { start: a.startDate.toDate(), end: a.endDate.toDate() })
    );

    if (existingAssignment) {
        toast({
            title: "Assignment Conflict",
            description: "This employee already has an active assignment for the selected start date.",
            variant: "destructive",
        });
        return;
    }

    const employee = employees.find(e => e.id === employeeId);
    const pattern = rotationPatterns.find(p => p.id === rotationPatternId);

    if(!employee || !pattern) {
        toast({ title: "Invalid Data", description: "Selected employee or pattern not found.", variant: "destructive"});
        return;
    }

    await createEmployeeScheduleAssignment({
        employeeId,
        employeeName: employee.fullName,
        rotationPatternId,
        rotationPatternName: pattern.name,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
    });
    
    toast({ title: "Assignment Created", description: `${employee.fullName} has been assigned the ${pattern.name} pattern.` });
    setIsAssignmentDialogOpen(false);
    setNewAssignment({ employeeId: '', rotationPatternId: '', startDate: undefined, endDate: undefined });
    fetchData();
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
      await deleteEmployeeScheduleAssignment(assignmentId);
      toast({ title: "Assignment Deleted", description: "The schedule assignment has been removed." });
      fetchData();
  }
  
  // --- Holiday Functions ---

    const handleOpenCreateHolidayDialog = () => {
        setEditingHoliday(null);
        setNewHoliday({ name: '', date: undefined });
        setIsHolidayDialogOpen(true);
    };

    const handleOpenEditHolidayDialog = (holiday: Holiday) => {
        setEditingHoliday(holiday);
        setNewHoliday({ name: holiday.name, date: holiday.date.toDate() });
        setIsHolidayDialogOpen(true);
    };

    const handleSaveHoliday = async () => {
        const { name, date } = newHoliday;
        if (!name || !date) {
            toast({ title: "Missing fields", description: "Holiday name and date are required.", variant: "destructive" });
            return;
        }
        
        const holidayData = { name, date: Timestamp.fromDate(date) };

        if (editingHoliday) {
            await updateHoliday(editingHoliday.id, holidayData);
            toast({ title: "Holiday Updated", description: "The holiday has been successfully updated." });
        } else {
            await createHoliday(holidayData);
            toast({ title: "Holiday Created", description: "The new holiday has been saved." });
        }
        fetchData();
        setIsHolidayDialogOpen(false);
    };
    
    const handleDeleteHoliday = async (holidayId: string) => {
        await deleteHoliday(holidayId);
        toast({title: "Holiday Deleted", description: "The holiday has been removed."});
        fetchData();
    }

    // --- Grace Policy Functions ---

    const handleOpenCreateGracePolicyDialog = () => {
        setEditingGracePolicy(null);
        setNewGracePolicy({ name: '', graceInEarly: 0, graceInLate: 0, graceOutEarly: 0, graceOutLate: 0 });
        setIsGracePolicyDialogOpen(true);
    };

    const handleOpenEditGracePolicyDialog = (policy: GracePolicy) => {
        setEditingGracePolicy(policy);
        setNewGracePolicy({ ...policy });
        setIsGracePolicyDialogOpen(true);
    };

    const handleSaveGracePolicy = async () => {
        if (!newGracePolicy.name) {
            toast({ title: "Policy name is required", variant: "destructive" });
            return;
        }
        if (editingGracePolicy) {
            await updateGracePolicy(editingGracePolicy.id, newGracePolicy);
            toast({ title: "Grace Policy Updated" });
        } else {
            await createGracePolicy(newGracePolicy);
            toast({ title: "Grace Policy Created" });
        }
        fetchData();
        setIsGracePolicyDialogOpen(false);
    };

    const handleDeleteGracePolicy = async (policyId: string) => {
        const isAssigned = rotationPatterns.some(p => p.gracePolicyId === policyId);
        if (isAssigned) {
            toast({ title: "Cannot Delete Policy", description: "This policy is assigned to one or more rotation patterns.", variant: "destructive" });
            return;
        }
        await deleteGracePolicy(policyId);
        toast({ title: "Grace Policy Deleted" });
        fetchData();
    };



  const getShiftNameById = (id: string | null) => {
      if (id === null) return 'Day Off';
      return shifts.find(s => s.id === id)?.name || 'Unknown';
  }
  
  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  const filteredAssignments = useMemo(() => assignments.filter(a => {
      const employee = employeeMap.get(a.employeeId);
      const employeeMatch = filterEmployee === 'all' || a.employeeId === filterEmployee;
      const locationMatch = filterLocation === 'all' || (employee && employee.locationId === filterLocation);
      return employeeMatch && locationMatch;
  }), [assignments, filterEmployee, filterLocation, employeeMap]);

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // --- Calendar View Logic ---
    const startDay = startOfMonth(currentDate);
    const endDay = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: startDay, end: endDay });
    const startingDayIndex = (getDay(startDay) + 6) % 7; // 0 for Monday

    const getDailySchedule = (day: Date) => {
        const holiday = holidays.find(h => isSameDay(h.date.toDate(), day));
        if (holiday) {
            return { type: 'holiday' as const, name: holiday.name };
        }
    
        const onLeaveEmployeeIds = new Set<string>();
        const employeesOnLeave: { name: string; reason: TimeOffReason; employeeId: string }[] = [];

        timeOffRequests.forEach(req => {
            if (isWithinInterval(day, { start: req.startDate.toDate(), end: req.endDate.toDate() })) {
                onLeaveEmployeeIds.add(req.employeeId);
                const employee = employeeMap.get(req.employeeId);
                if (employee) {
                    const employeeMatch = filterEmployee === 'all' || req.employeeId === filterEmployee;
                    const locationMatch = filterLocation === 'all' || employee.locationId === filterLocation;

                    if(employeeMatch && locationMatch) {
                        employeesOnLeave.push({
                            name: employee.fullName,
                            reason: req.reason,
                            employeeId: req.employeeId
                        });
                    }
                }
            }
        });
          
        const scheduledEmployees = assignments
            .filter(assignment => {
                if (onLeaveEmployeeIds.has(assignment.employeeId)) {
                    return false;
                }
                const employee = employeeMap.get(assignment.employeeId);
                if (!employee) return false;
                
                const employeeMatch = filterEmployee === 'all' || assignment.employeeId === filterEmployee;
                const locationMatch = filterLocation === 'all' || employee.locationId === filterLocation;
  
                return employeeMatch && locationMatch &&
                    isWithinInterval(day, { start: assignment.startDate.toDate(), end: assignment.endDate.toDate() });
            })
            .map(assignment => {
                const pattern = rotationPatterns.find(p => p.id === assignment.rotationPatternId);
                if (!pattern) return null;
    
                const daysSinceStart = differenceInDays(day, assignment.startDate.toDate());
                if (daysSinceStart < 0) return null;
                const weekIndex = Math.floor(daysSinceStart / 7) % (pattern.weeks?.length || 1);
                const dayIndex = (getDay(day) + 6) % 7;
    
                const shiftId = pattern.weeks?.[weekIndex]?.days[dayIndex];
                if (!shiftId) return null;
    
                const shift = shifts.find(s => s.id === shiftId);
                if (!shift) return null;
    
                return {
                    name: assignment.employeeName,
                    shift: `${shift.name}: ${format(shift.startTime, 'p')} - ${format(shift.endTime, 'p')}`
                };
            }).filter((item): item is { name: string; shift: string } => item !== null);
        
        return { type: 'workday' as const, employees: scheduledEmployees, onLeave: employeesOnLeave };
      }
    
    const getLeaveBackgroundColor = (reason: TimeOffReason) => {
        if (reason === 'Vacaciones') {
            return 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
        }
        return 'bg-red-200 dark:bg-red-800/50 text-red-800 dark:text-red-200';
    }


  return (
    <Tabs defaultValue="assignments" className="space-y-4">
      <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full md:w-auto">
        <TabsTrigger value="assignments"><List className="mr-2 h-4 w-4"/>Assignments</TabsTrigger>
        <TabsTrigger value="calendar"><CalendarDays className="mr-2 h-4 w-4"/>Calendar View</TabsTrigger>
        <TabsTrigger value="holidays"><PartyPopper className="mr-2 h-4 w-4"/>Holidays</TabsTrigger>
        <TabsTrigger value="shifts"><Repeat className="mr-2 h-4 w-4"/>Shifts</TabsTrigger>
        <TabsTrigger value="patterns"><BrainCircuit className="mr-2 h-4 w-4" />Rotation Patterns</TabsTrigger>
        <TabsTrigger value="grace"><Timer className="mr-2 h-4 w-4"/>Grace Policies</TabsTrigger>
      </TabsList>
      
      <TabsContent value="assignments">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Schedule Assignments</CardTitle>
                    <CardDescription>Assign rotation patterns to employees for a specific period.</CardDescription>
                </div>
                <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
                    <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4"/>New Assignment</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Create New Schedule Assignment</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="employee-select">Employee</Label>
                                <Select value={newAssignment.employeeId} onValueChange={val => setNewAssignment(prev => ({...prev, employeeId: val}))}>
                                    <SelectTrigger><SelectValue placeholder="Select an employee" /></SelectTrigger>
                                    <SelectContent>
                                        {employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="pattern-select">Rotation Pattern</Label>
                                <Select value={newAssignment.rotationPatternId} onValueChange={val => setNewAssignment(prev => ({...prev, rotationPatternId: val}))}>
                                    <SelectTrigger><SelectValue placeholder="Select a pattern" /></SelectTrigger>
                                    <SelectContent>
                                        {rotationPatterns.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-full">
                                    <Label htmlFor="start-date">Start Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                <Calendar className="mr-2 h-4 w-4" />
                                                {newAssignment.startDate ? format(newAssignment.startDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <CalendarComponent mode="single" selected={newAssignment.startDate} onSelect={d => setNewAssignment(prev => ({...prev, startDate: d}))} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="w-full">
                                    <Label htmlFor="end-date">End Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                <Calendar className="mr-2 h-4 w-4" />
                                                {newAssignment.endDate ? format(newAssignment.endDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <CalendarComponent mode="single" selected={newAssignment.endDate} onSelect={d => setNewAssignment(prev => ({...prev, endDate: d}))} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                        <DialogFooter><Button onClick={handleCreateAssignment}>Create Assignment</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={filterLocation} onValueChange={setFilterLocation}>
                        <SelectTrigger className="w-[240px]">
                            <SelectValue placeholder="Filter by Location" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            {locations.map(loc => (
                                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                        <SelectTrigger className="w-[240px]">
                            <SelectValue placeholder="Filter by Employee" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Employees</SelectItem>
                            {employees.filter(emp => filterLocation === 'all' || emp.locationId === filterLocation).map(emp => (
                                <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {(filterEmployee !== 'all' || filterLocation !== 'all') && <Button variant="ghost" onClick={() => {setFilterEmployee('all'); setFilterLocation('all');}}>Clear</Button>}
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Rotation Pattern</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAssignments.map(a => {
                            const employee = employeeMap.get(a.employeeId);
                            return (
                                <TableRow key={a.id}>
                                    <TableCell>{a.employeeName}</TableCell>
                                    <TableCell>{employee?.locationName || 'N/A'}</TableCell>
                                    <TableCell>{a.rotationPatternName}</TableCell>
                                    <TableCell>{format(a.startDate.toDate(), "PPP")}</TableCell>
                                    <TableCell>{format(a.endDate.toDate(), "PPP")}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAssignment(a.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
                {filteredAssignments.length === 0 && <p className="text-muted-foreground text-sm py-4 text-center">No assignments found.</p>}
            </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="calendar">
          <Card>
              <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-4">
                      <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft/></Button>
                      <CardTitle className="text-2xl">{format(currentDate, 'MMMM yyyy')}</CardTitle>
                      <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight/></Button>
                  </div>
                   <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={filterLocation} onValueChange={setFilterLocation}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Filter by Location" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            {locations.map(loc => (
                                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Filter by Employee" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Employees</SelectItem>
                            {employees.filter(emp => filterLocation === 'all' || emp.locationId === filterLocation).map(emp => (
                                <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {(filterEmployee !== 'all' || filterLocation !== 'all') && <Button variant="ghost" onClick={() => {setFilterEmployee('all'); setFilterLocation('all');}}>Clear</Button>}
                  </div>
                  <Button onClick={() => setCurrentDate(new Date())}>Today</Button>
              </CardHeader>
              <CardContent className="p-0">
                  <TooltipProvider>
                    <div className="grid grid-cols-7 border-t border-l">
                        {weekDays.map(day => (
                            <div key={day} className="p-2 border-b border-r text-center font-bold text-sm bg-muted/50">{day}</div>
                        ))}
                        {Array.from({ length: startingDayIndex }).map((_, i) => (
                            <div key={`empty-${i}`} className="border-b border-r" />
                        ))}
                        {daysInMonth.map(day => {
                            const scheduleInfo = getDailySchedule(day);
                            const isToday = isSameDay(day, new Date());
                            return (
                                <div key={day.toString()} className={cn("p-2 border-b border-r min-h-[120px] h-full", isToday && "bg-blue-950")}>
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
                                        {scheduleInfo.type === 'workday' && (
                                            <>
                                                {scheduleInfo.onLeave.map(leave => (
                                                    <Tooltip key={`${leave.employeeId}-${leave.reason}`}>
                                                        <TooltipTrigger asChild>
                                                            <p className={cn("truncate p-1 rounded-md cursor-default", getLeaveBackgroundColor(leave.reason))}>
                                                                {leave.name}
                                                            </p>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>{leave.reason}</p></TooltipContent>
                                                    </Tooltip>
                                                ))}
                                                {scheduleInfo.employees.map(emp => (
                                                    <Tooltip key={emp.name}>
                                                        <TooltipTrigger asChild>
                                                            <p className="truncate p-1 rounded-md bg-green-200 dark:bg-green-800/50 text-green-800 dark:text-green-200 cursor-default">
                                                                {emp.name}
                                                            </p>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>{emp.shift}</p></TooltipContent>
                                                    </Tooltip>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                  </TooltipProvider>
              </CardContent>
          </Card>
      </TabsContent>
      
      <TabsContent value="holidays">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Holidays</CardTitle>
                    <CardDescription>Manage company holidays. Employees will not be scheduled on these days.</CardDescription>
                </div>
                <Button onClick={handleOpenCreateHolidayDialog}><PlusCircle className="mr-2 h-4 w-4"/>Add Holiday</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Holiday Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {holidays.sort((a,b) => a.date.toMillis() - b.date.toMillis()).map(h => (
                            <TableRow key={h.id}>
                                <TableCell>{h.name}</TableCell>
                                <TableCell>{format(h.date.toDate(), "PPP")}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditHolidayDialog(h)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteHoliday(h.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 {holidays.length === 0 && <p className="text-muted-foreground text-sm py-4 text-center">No holidays created yet.</p>}
            </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="shifts">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Shifts</CardTitle>
              <CardDescription>Manage the different work shifts for your company.</CardDescription>
            </div>
            <Button onClick={handleOpenCreateShiftDialog}><PlusCircle className="mr-2 h-4 w-4"/>Add Shift</Button>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Shift Name</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {shifts.map(s => (
                        <TableRow key={s.id}>
                            <TableCell>{s.name}</TableCell>
                            <TableCell>{format(s.startTime, 'p')}</TableCell>
                            <TableCell>{format(s.endTime, 'p')}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenEditShiftDialog(s)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {shifts.length === 0 && <p className="text-muted-foreground text-sm py-4 text-center">No shifts created yet.</p>}
          </CardContent>
        </Card>
      </TabsContent>

       <TabsContent value="patterns">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                    <CardTitle>Rotation Patterns</CardTitle>
                    <CardDescription>Create and manage sequences of shifts for scheduling.</CardDescription>
                    </div>
                    <Button onClick={handleOpenCreatePatternDialog}><PlusCircle className="mr-2 h-4 w-4"/>Add Pattern</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                     {rotationPatterns.map(p => (
                        <Card key={p.id}>
                            <CardHeader className="flex-row items-center justify-between">
                                <CardTitle className="text-lg">{p.name}</CardTitle>
                                <div className="flex items-center gap-2">
                                     <Button variant="ghost" size="icon" onClick={() => handleOpenEditPatternDialog(p)}>
                                        <Pencil className="h-4 w-4"/>
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => setPatternToDelete(p)}>
                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This will permanently delete the "{patternToDelete?.name}" pattern. This action cannot be undone.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel onClick={() => setPatternToDelete(null)}>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeletePattern}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {p.gracePolicyId && (
                                    <div className="mb-2 text-sm">
                                        <span className="font-semibold">Grace Policy:</span> {gracePolicies.find(gp => gp.id === p.gracePolicyId)?.name || 'N/A'}
                                    </div>
                                )}
                                {p.weeks && p.weeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className="mb-4">
                                        <p className="font-semibold mb-2">Week {weekIndex + 1}</p>
                                        <div className="grid grid-cols-7 gap-2">
                                            {weekDays.map((day, dayIndex) => (
                                                <div key={dayIndex} className="p-2 rounded-md border text-center bg-muted/50">
                                                    <p className="text-xs font-bold">{day}</p>
                                                    <p className="text-sm">{getShiftNameById(week.days[dayIndex])}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                    {rotationPatterns.length === 0 && <p className="text-muted-foreground text-sm py-4 text-center">No rotation patterns created yet.</p>}
                </CardContent>
            </Card>
      </TabsContent>
      
      <TabsContent value="grace">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                <CardTitle>Grace Policies</CardTitle>
                <CardDescription>Define grace periods for clock-ins and clock-outs.</CardDescription>
                </div>
                <Button onClick={handleOpenCreateGracePolicyDialog}><PlusCircle className="mr-2 h-4 w-4"/>Add Policy</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Policy Name</TableHead>
                            <TableHead>In Early (min)</TableHead>
                            <TableHead>In Late (min)</TableHead>
                            <TableHead>Out Early (min)</TableHead>
                            <TableHead>Out Late (min)</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {gracePolicies.map(p => (
                            <TableRow key={p.id}>
                                <TableCell>{p.name}</TableCell>
                                <TableCell>{p.graceInEarly}</TableCell>
                                <TableCell>{p.graceInLate}</TableCell>
                                <TableCell>{p.graceOutEarly}</TableCell>
                                <TableCell>{p.graceOutLate}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditGracePolicyDialog(p)}>
                                        <Pencil className="h-4 w-4"/>
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteGracePolicy(p.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {gracePolicies.length === 0 && <p className="text-muted-foreground text-sm py-4 text-center">No grace policies created yet.</p>}
            </CardContent>
        </Card>
      </TabsContent>

       <Dialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>{editingShift ? "Edit Shift" : "Create New Shift"}</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="shift-name">Shift Name</Label>
                        <Input id="shift-name" value={newShift.name} onChange={e => setNewShift({...newShift, name: e.target.value})} placeholder="e.g., Morning Shift"/>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-full">
                            <Label>Start Time</Label>
                            <Input type="time" value={newShift.startTime} onChange={e => setNewShift({...newShift, startTime: e.target.value})} />
                        </div>
                        <div className="w-full">
                            <Label>End Time</Label>
                            <Input type="time" value={newShift.endTime} onChange={e => setNewShift({...newShift, endTime: e.target.value})} />
                        </div>
                    </div>
                </div>
                <DialogFooter><Button onClick={handleSaveShift}>Save Shift</Button></DialogFooter>
            </DialogContent>
        </Dialog>
      
        <Dialog open={isPatternDialogOpen} onOpenChange={setIsPatternDialogOpen}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{editingPattern ? "Edit Rotation Pattern" : "Create New Rotation Pattern"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div>
                        <Label htmlFor="pattern-name">Pattern Name</Label>
                        <Input id="pattern-name" value={patternName} onChange={(e) => setPatternName(e.target.value)} placeholder="e.g., 2-Week Standard Rotation" />
                    </div>
                     <div>
                        <Label htmlFor="grace-policy-select">Grace Policy</Label>
                        <Select value={patternGracePolicyId || 'none'} onValueChange={setPatternGracePolicyId}>
                            <SelectTrigger><SelectValue placeholder="Select a grace policy (optional)" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Grace Policy</SelectItem>
                                {gracePolicies.map(gp => <SelectItem key={gp.id} value={gp.id}>{gp.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    {patternWeeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="p-4 border rounded-lg space-y-3">
                             <div className="flex justify-between items-center">
                                <Label className="font-semibold text-lg">Week {weekIndex + 1}</Label>
                                {patternWeeks.length > 1 && (
                                    <Button variant="ghost" size="icon" onClick={() => removeWeekFromPattern(weekIndex)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                {weekDays.map((day, dayIndex) => (
                                    <div key={dayIndex} className="space-y-1">
                                        <Label htmlFor={`week-${weekIndex}-day-${dayIndex}`}>{day}</Label>
                                        <Select value={week.days[dayIndex] || 'day-off'} onValueChange={(shiftId) => handleDayShiftChange(weekIndex, dayIndex, shiftId)}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="day-off">Day Off</SelectItem>
                                                {shifts.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    <Button variant="outline" onClick={addWeekToPattern}>Add Week</Button>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPatternDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSavePattern}>Save Pattern</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingHoliday ? "Edit Holiday" : "Create New Holiday"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="holiday-name">Holiday Name</Label>
                        <Input id="holiday-name" value={newHoliday.name} onChange={e => setNewHoliday({...newHoliday, name: e.target.value})} placeholder="e.g., New Year's Day"/>
                    </div>
                    <div>
                       <Label htmlFor="holiday-date">Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newHoliday.date && "text-muted-foreground")}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {newHoliday.date ? format(newHoliday.date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <CalendarComponent mode="single" selected={newHoliday.date} onSelect={d => setNewHoliday(prev => ({...prev, date: d}))} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => setIsHolidayDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveHoliday}>Save Holiday</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isGracePolicyDialogOpen} onOpenChange={setIsGracePolicyDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingGracePolicy ? 'Edit Grace Policy' : 'Create New Grace Policy'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="gp-name">Policy Name</Label>
                        <Input id="gp-name" value={newGracePolicy.name} onChange={e => setNewGracePolicy({...newGracePolicy, name: e.target.value})} placeholder="e.g., Standard Policy" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="gp-in-early">Clock-in Early (min)</Label>
                            <Input id="gp-in-early" type="number" value={newGracePolicy.graceInEarly} onChange={e => setNewGracePolicy({...newGracePolicy, graceInEarly: parseInt(e.target.value) || 0})} />
                        </div>
                         <div>
                            <Label htmlFor="gp-in-late">Clock-in Late (min)</Label>
                            <Input id="gp-in-late" type="number" value={newGracePolicy.graceInLate} onChange={e => setNewGracePolicy({...newGracePolicy, graceInLate: parseInt(e.target.value) || 0})} />
                        </div>
                         <div>
                            <Label htmlFor="gp-out-early">Clock-out Early (min)</Label>
                            <Input id="gp-out-early" type="number" value={newGracePolicy.graceOutEarly} onChange={e => setNewGracePolicy({...newGracePolicy, graceOutEarly: parseInt(e.target.value) || 0})} />
                        </div>
                         <div>
                            <Label htmlFor="gp-out-late">Clock-out Late (min)</Label>
                            <Input id="gp-out-late" type="number" value={newGracePolicy.graceOutLate} onChange={e => setNewGracePolicy({...newGracePolicy, graceOutLate: parseInt(e.target.value) || 0})} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsGracePolicyDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveGracePolicy}>Save Policy</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </Tabs>
  );
}
