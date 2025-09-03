
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
import { Shift, createShift, getShifts } from '@/services/scheduleService';
import { TimePicker } from '../ui/time-picker';
import { format } from 'date-fns';
import { Time } from '@internationalized/date';
import type { TimeValue } from 'react-aria-components';

export default function SchedulingDashboard() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  
  const [newShiftName, setNewShiftName] = useState('');
  const [startTime, setStartTime] = useState<TimeValue>(new Time(9, 0));
  const [endTime, setEndTime] = useState<TimeValue>(new Time(17, 0));
  
  const { toast } = useToast();

  const fetchData = async () => {
    const shiftsData = await getShifts();
    setShifts(shiftsData);
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

  return (
    <Tabs defaultValue="shifts" className="space-y-4">
      <TabsList>
        <TabsTrigger value="schedule" disabled><Calendar className="mr-2 h-4 w-4"/>Schedule</TabsTrigger>
        <TabsTrigger value="shifts"><Repeat className="mr-2 h-4 w-4"/>Shifts</TabsTrigger>
        <TabsTrigger value="patterns" disabled><BrainCircuit className="mr-2 h-4 w-4"/>Rotation Patterns</TabsTrigger>
      </TabsList>
      
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
      
    </Tabs>
  );
}
