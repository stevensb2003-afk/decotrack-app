
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, BrainCircuit, Repeat, PlusCircle, Trash2, CalendarDays, List, Filter, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shift, createShift, getShifts, RotationPattern, createRotationPattern, getRotationPatterns, EmployeeScheduleAssignment, createEmployeeScheduleAssignment, getEmployeeScheduleAssignments, deleteEmployeeScheduleAssignment, updateShift } from '@/services/scheduleService';
import { format } from 'date-fns';
import { Employee, getAllEmployees } from '@/services/employeeService';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { Timestamp } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';


export default function SchedulingDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [rotationPatterns, setRotationPatterns] = useState<RotationPattern[]>([]);
  const [assignments, setAssignments] = useState<EmployeeScheduleAssignment[]>([]);

  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [isPatternDialogOpen, setIsPatternDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [newShift, setNewShift] = useState({ name: '', startTime: '09:00', endTime: '17:00'});

  const [newPatternName, setNewPatternName] = useState('');
  const [selectedShiftsForPattern, setSelectedShiftsForPattern] = useState<string[]>([]);
  
  const [newAssignment, setNewAssignment] = useState<{
    employeeId: string;
    rotationPatternId: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({ employeeId: '', rotationPatternId: '', startDate: undefined, endDate: undefined });

  const [filterEmployee, setFilterEmployee] = useState('all');

  const { toast } = useToast();

  const fetchData = async () => {
    const employeesData = await getAllEmployees();
    const shiftsData = await getShifts();
    const patternsData = await getRotationPatterns();
    const assignmentsData = await getEmployeeScheduleAssignments();
    setEmployees(employeesData);
    setShifts(shiftsData);
    setRotationPatterns(patternsData);
    setAssignments(assignmentsData);
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
    const [startHours, startMinutes] = newShift.startTime.split(':').map(Number);
    const [endHours, endMinutes] = newShift.endTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startHours, startMinutes, 0, 0);
    const endDate = new Date();
    endDate.setHours(endHours, endMinutes, 0, 0);

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

  const handleCreatePattern = async () => {
      if(!newPatternName || selectedShiftsForPattern.length === 0) {
          toast({ title: "Missing Fields", description: "Pattern name and at least one shift are required.", variant: "destructive" });
          return;
      }
      await createRotationPattern({ name: newPatternName, shiftSequence: selectedShiftsForPattern });
      toast({ title: "Rotation Pattern Created", description: "The new pattern has been saved." });
      setIsPatternDialogOpen(false);
      setNewPatternName('');
      setSelectedShiftsForPattern([]);
      fetchData();
  }

  const handleCreateAssignment = async () => {
    const { employeeId, rotationPatternId, startDate, endDate } = newAssignment;
    if (!employeeId || !rotationPatternId || !startDate || !endDate) {
        toast({ title: "Missing Fields", description: "All fields are required to create an assignment.", variant: "destructive" });
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
        employeeName: employee.name,
        rotationPatternId,
        rotationPatternName: pattern.name,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
    });
    
    toast({ title: "Assignment Created", description: `${employee.name} has been assigned the ${pattern.name} pattern.` });
    setIsAssignmentDialogOpen(false);
    setNewAssignment({ employeeId: '', rotationPatternId: '', startDate: undefined, endDate: undefined });
    fetchData();
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
      await deleteEmployeeScheduleAssignment(assignmentId);
      toast({ title: "Assignment Deleted", description: "The schedule assignment has been removed." });
      fetchData();
  }

  const handleShiftSelectionForPattern = (shiftId: string) => {
    setSelectedShiftsForPattern(prev => {
        const newSelection = [...prev, shiftId];
        return newSelection;
    });
  };

  const getShiftNameById = (id: string) => {
      return shifts.find(s => s.id === id)?.name || 'Unknown Shift';
  }

  const filteredAssignments = filterEmployee === 'all' 
    ? assignments 
    : assignments.filter(a => a.employeeId === filterEmployee);

  return (
    <Tabs defaultValue="assignments" className="space-y-4">
      <TabsList>
        <TabsTrigger value="assignments"><List className="mr-2 h-4 w-4"/>Assignments</TabsTrigger>
        <TabsTrigger value="calendar"><CalendarDays className="mr-2 h-4 w-4"/>Calendar View</TabsTrigger>
        <TabsTrigger value="shifts"><Repeat className="mr-2 h-4 w-4"/>Shifts</TabsTrigger>
        <TabsTrigger value="patterns"><BrainCircuit className="mr-2 h-4 w-4"/>Rotation Patterns</TabsTrigger>
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
                                        {employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
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
                                <div>
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
                                <div>
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
                    <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                        <SelectTrigger className="w-[240px]">
                            <SelectValue placeholder="Filter by Employee" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Employees</SelectItem>
                            {employees.map(emp => (
                                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {filterEmployee !== 'all' && <Button variant="ghost" onClick={() => setFilterEmployee('all')}>Clear</Button>}
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Rotation Pattern</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAssignments.map(a => (
                            <TableRow key={a.id}>
                                <TableCell>{a.employeeName}</TableCell>
                                <TableCell>{a.rotationPatternName}</TableCell>
                                <TableCell>{format(a.startDate.toDate(), "PPP")}</TableCell>
                                <TableCell>{format(a.endDate.toDate(), "PPP")}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteAssignment(a.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {filteredAssignments.length === 0 && <p className="text-muted-foreground text-sm py-4 text-center">No assignments found.</p>}
            </CardContent>
        </Card>
      </TabsContent>

       <TabsContent value="calendar">
        <Card>
            <CardHeader>
                <CardTitle>Calendar View</CardTitle>
                <CardDescription>A monthly view of the generated employee schedules.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">This feature is under construction. Please check back later.</p>
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
             <Dialog open={isPatternDialogOpen} onOpenChange={setIsPatternDialogOpen}>
                <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4"/>Add Pattern</Button></DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create New Rotation Pattern</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="pattern-name">Pattern Name</Label>
                            <Input id="pattern-name" value={newPatternName} onChange={e => setNewPatternName(e.target.value)} placeholder="e.g., Weekly Rotation"/>
                        </div>
                        <div>
                            <Label>Shift Sequence (Add in order)</Label>
                            <div className="space-y-2 rounded-md border p-2 min-h-20">
                                {selectedShiftsForPattern.map((shiftId, index) => (
                                    <div key={`${shiftId}-${index}`} className="flex items-center justify-between bg-muted p-1 rounded-sm">
                                        <span>{index + 1}. {getShiftNameById(shiftId)}</span>
                                    </div>
                                ))}
                            </div>
                             <div className="flex flex-wrap gap-2 mt-2">
                                {shifts.map(shift => (
                                    <Button key={shift.id} variant="outline" size="sm" onClick={() => handleShiftSelectionForPattern(shift.id)}>
                                        Add "{getShiftNameById(shift.id)}"
                                    </Button>
                                ))}
                            </div>
                             {selectedShiftsForPattern.length > 0 && 
                                <Button variant="destructive" size="sm" onClick={() => setSelectedShiftsForPattern([])} className="mt-2">Clear Sequence</Button>
                            }
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleCreatePattern}>Create Pattern</Button></DialogFooter>
                </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
             {rotationPatterns.map(p => (
                <div key={p.id} className="flex flex-col p-2 border-b">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-sm text-muted-foreground">
                        {p.shiftSequence.map(id => getShiftNameById(id)).join(' -> ')}
                    </span>
                </div>
            ))}
            {rotationPatterns.length === 0 && <p className="text-muted-foreground text-sm py-4 text-center">No rotation patterns created yet.</p>}
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
      
    </Tabs>
  );
}
