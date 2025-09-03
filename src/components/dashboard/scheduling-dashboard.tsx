
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, BrainCircuit, Repeat, PlusCircle, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shift, RotationPattern, Schedule, createShift, getShifts, createRotationPattern, getRotationPatterns, generateSchedule, getScheduleForMonth, Holiday } from '@/services/scheduleService';
import { Employee, getAllEmployees } from '@/services/employeeService';
import { TimePicker } from '../ui/time-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { format } from 'date-fns';
import { Time } from '@internationalized/date';
import type { TimeValue } from 'react-aria-components';

export default function SchedulingDashboard() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [rotationPatterns, setRotationPatterns] = useState<RotationPattern[]>([]);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [isPatternDialogOpen, setIsPatternDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [newShiftName, setNewShiftName] = useState('');
  const [startTime, setStartTime] = useState<TimeValue>(new Time(9, 0));
  const [endTime, setEndTime] = useState<TimeValue>(new Time(17, 0));

  const [newPattern, setNewPattern] = useState({ name: '', shiftIds: [] as string[] });
  
  const { toast } = useToast();

  const fetchData = async () => {
    const [shiftsData, patternsData, employeesData] = await Promise.all([
      getShifts(),
      getRotationPatterns(),
      getAllEmployees(),
    ]);
    setShifts(shiftsData);
    setRotationPatterns(patternsData);
    setEmployees(employeesData);
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  const handleCreateShift = async () => {
    if(!newShiftName) {
        toast({title: "Shift name is required", variant: "destructive"});
        return;
    }

    const today = new Date();
    const startDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), startTime.hour, startTime.minute);
    const endDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), endTime.hour, endTime.minute);

    await createShift({ name: newShiftName, startTime: startDateTime, endTime: endDateTime });
    toast({ title: "Shift Created", description: "The new shift has been saved." });
    setIsShiftDialogOpen(false);
    setNewShiftName('');
    setStartTime(new Time(9,0));
    setEndTime(new Time(17,0));
    fetchData();
  }

  const handleCreatePattern = async () => {
    if(!newPattern.name || newPattern.shiftIds.length === 0) {
        toast({title: "Pattern name and at least one shift are required", variant: "destructive"});
        return;
    }
    await createRotationPattern({ name: newPattern.name, shiftSequence: newPattern.shiftIds });
    toast({ title: "Rotation Pattern Created", description: "The new pattern has been saved." });
    setIsPatternDialogOpen(false);
    setNewPattern({ name: '', shiftIds: [] });
    fetchData();
  }
  
  const handleGenerateSchedules = async () => {
      toast({ title: "Feature not implemented", description: "The automatic schedule generation is not yet available." });
  };

  return (
    <Tabs defaultValue="schedule" className="space-y-4">
      <TabsList>
        <TabsTrigger value="schedule"><Calendar className="mr-2 h-4 w-4"/>Schedule</TabsTrigger>
        <TabsTrigger value="shifts"><Repeat className="mr-2 h-4 w-4"/>Shifts</TabsTrigger>
        <TabsTrigger value="patterns"><BrainCircuit className="mr-2 h-4 w-4"/>Rotation Patterns</TabsTrigger>
      </TabsList>
      
      <TabsContent value="schedule">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Employee Schedule</CardTitle>
                <CardDescription>View the generated schedule for all employees.</CardDescription>
            </div>
            <Button onClick={handleGenerateSchedules} disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Generate Schedule"}
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">Calendar view will be available here once schedules are generated.</p>
            {/* Calendar View will be implemented here */}
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
            <Dialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
                <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4"/>Add Shift</Button></DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create New Shift</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="shift-name">Shift Name</Label>
                            <Input id="shift-name" value={newShiftName} onChange={e => setNewShiftName(e.target.value)} placeholder="e.g., Morning Shift"/>
                        </div>
                        <div className="flex gap-4">
                           <TimePicker label="Start Time" value={startTime} onChange={setStartTime} />
                           <TimePicker label="End Time" value={endTime} onChange={setEndTime} />
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleCreateShift}>Create Shift</Button></DialogFooter>
                </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
             {shifts.map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 border-b">
                    <span>{s.name} ({format(s.startTime, 'p')} - {format(s.endTime, 'p')})</span>
                </div>
            ))}
            {shifts.length === 0 && <p className="text-muted-foreground text-sm">No shifts created yet.</p>}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="patterns">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Rotation Patterns</CardTitle>
                <CardDescription>Create and manage shift rotation patterns for employees.</CardDescription>
            </div>
            <Dialog open={isPatternDialogOpen} onOpenChange={setIsPatternDialogOpen}>
                <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4"/>Add Pattern</Button></DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create New Rotation Pattern</DialogTitle></DialogHeader>
                     <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="pattern-name">Pattern Name</Label>
                            <Input id="pattern-name" value={newPattern.name} onChange={e => setNewPattern({...newPattern, name: e.target.value})} placeholder="e.g., Weekly Rotation"/>
                        </div>
                        <div>
                            <Label>Shift Sequence</Label>
                            {newPattern.shiftIds.map((shiftId, index) => (
                                <div key={index} className="flex items-center gap-2 mt-2">
                                    <Select value={shiftId} onValueChange={val => {
                                        const newIds = [...newPattern.shiftIds];
                                        newIds[index] = val;
                                        setNewPattern({...newPattern, shiftIds: newIds});
                                    }}>
                                        <SelectTrigger><SelectValue placeholder={`Day ${index + 1}`} /></SelectTrigger>
                                        <SelectContent>
                                            {shifts.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        const newIds = newPattern.shiftIds.filter((_, i) => i !== index);
                                        setNewPattern({...newPattern, shiftIds: newIds});
                                    }}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" className="mt-2" onClick={() => setNewPattern({...newPattern, shiftIds: [...newPattern.shiftIds, '']})}>Add Day to Pattern</Button>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleCreatePattern}>Create Pattern</Button></DialogFooter>
                </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {rotationPatterns.map(p => (
                <div key={p.id} className="p-2 border-b">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.shiftSequence.map(sid => shifts.find(s => s.id === sid)?.name || 'Unknown').join(' -> ')}</p>
                </div>
            ))}
            {rotationPatterns.length === 0 && <p className="text-muted-foreground text-sm">No patterns created yet.</p>}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
