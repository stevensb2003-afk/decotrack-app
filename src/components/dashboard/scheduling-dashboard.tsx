
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, BrainCircuit, Repeat, PlusCircle, Trash2, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shift, createShift, getShifts, RotationPattern, createRotationPattern, getRotationPatterns } from '@/services/scheduleService';
import { TimePicker } from '../ui/time-picker';
import { format } from 'date-fns';
import { Time } from '@internationalized/date';
import type { TimeValue } from 'react-aria-components';
import { Checkbox } from '../ui/checkbox';

export default function SchedulingDashboard() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [rotationPatterns, setRotationPatterns] = useState<RotationPattern[]>([]);
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [isPatternDialogOpen, setIsPatternDialogOpen] = useState(false);
  
  const [newShiftName, setNewShiftName] = useState('');
  const [startTime, setStartTime] = useState<TimeValue>(new Time(9, 0));
  const [endTime, setEndTime] = useState<TimeValue>(new Time(17, 0));

  const [newPatternName, setNewPatternName] = useState('');
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  
  const { toast } = useToast();

  const fetchData = async () => {
    const shiftsData = await getShifts();
    const patternsData = await getRotationPatterns();
    setShifts(shiftsData);
    setRotationPatterns(patternsData);
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
      if(!newPatternName || selectedShifts.length === 0) {
          toast({ title: "Missing Fields", description: "Pattern name and at least one shift are required.", variant: "destructive" });
          return;
      }
      await createRotationPattern({ name: newPatternName, shiftSequence: selectedShifts });
      toast({ title: "Rotation Pattern Created", description: "The new pattern has been saved." });
      setIsPatternDialogOpen(false);
      setNewPatternName('');
      setSelectedShifts([]);
      fetchData();
  }

  const handleShiftSelection = (shiftId: string) => {
    setSelectedShifts(prev => {
        const newSelection = [...prev];
        const index = newSelection.indexOf(shiftId);
        if(index > -1) {
            newSelection.splice(index, 1);
        } else {
            newSelection.push(shiftId);
        }
        return newSelection;
    });
  };

  const getShiftNameById = (id: string) => {
      return shifts.find(s => s.id === id)?.name || 'Unknown Shift';
  }

  return (
    <Tabs defaultValue="shifts" className="space-y-4">
      <TabsList>
        <TabsTrigger value="schedule"><Calendar className="mr-2 h-4 w-4"/>Schedule</TabsTrigger>
        <TabsTrigger value="shifts"><Repeat className="mr-2 h-4 w-4"/>Shifts</TabsTrigger>
        <TabsTrigger value="patterns"><BrainCircuit className="mr-2 h-4 w-4"/>Rotation Patterns</TabsTrigger>
      </TabsList>

       <TabsContent value="schedule">
        <Card>
            <CardHeader>
                <CardTitle>Schedule</CardTitle>
                <CardDescription>Assign shifts and rotation patterns to employees.</CardDescription>
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
                            <Label>Shift Sequence (Select in order)</Label>
                            <div className="space-y-2 rounded-md border p-2 max-h-60 overflow-y-auto">
                                {shifts.map(shift => (
                                    <div key={shift.id} className="flex items-center space-x-2">
                                        <Checkbox id={`shift-${shift.id}`} onCheckedChange={() => handleShiftSelection(shift.id)} />
                                        <Label htmlFor={`shift-${shift.id}`} className="font-normal">{shift.name}</Label>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                                <p>Selected sequence:</p>
                                {selectedShifts.length > 0 ? (
                                    <ol className="list-decimal list-inside">
                                        {selectedShifts.map(id => <li key={id}>{getShiftNameById(id)}</li>)}
                                    </ol>
                                ) : <p>No shifts selected.</p>}
                            </div>
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
      
    </Tabs>
  );
}
