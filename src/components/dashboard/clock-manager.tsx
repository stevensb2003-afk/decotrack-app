
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Filter, PlusCircle, Pencil, Trash2, CalendarIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Employee, getAllEmployees } from '@/services/employeeService';
import { AttendanceRecord, getAttendanceRecordsByFilter, createAttendanceRecord, updateAttendanceRecord, deleteAttendanceRecord } from '@/services/attendanceService';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Timestamp } from 'firebase/firestore';

export default function ClockManager() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const [filters, setFilters] = useState<{ employeeId: string, startDate?: Date, endDate?: Date }>({ employeeId: 'all' });

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<Partial<AttendanceRecord> | null>(null);
    const [recordDate, setRecordDate] = useState<Date>(new Date());
    const [recordTime, setRecordTime] = useState<string>('00:00');

    const { toast } = useToast();

    const fetchInitialData = async () => {
        setIsLoading(true);
        const emps = await getAllEmployees();
        setEmployees(emps);
        // Initially fetch records for the last 7 days for all employees
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        const initialRecords = await getAttendanceRecordsByFilter({ startDate, endDate });
        setRecords(initialRecords);
        setFilters({ employeeId: 'all', startDate, endDate });
        setIsLoading(false);
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const handleFilterSearch = async () => {
        setIsLoading(true);
        const filteredRecords = await getAttendanceRecordsByFilter(filters);
        setRecords(filteredRecords);
        setIsLoading(false);
    };
    
    const handleOpenEditDialog = (record: AttendanceRecord | null) => {
        if(record) {
            setEditingRecord(record);
            const recordTimestamp = record.timestamp.toDate();
            setRecordDate(recordTimestamp);
            setRecordTime(format(recordTimestamp, 'HH:mm'));
        } else {
            // Creating a new record
            const defaultEmployee = filters.employeeId !== 'all' ? filters.employeeId : (employees[0]?.id || '');
            setEditingRecord({ employeeId: defaultEmployee, type: 'Entry' });
            setRecordDate(new Date());
            setRecordTime(format(new Date(), 'HH:mm'));
        }
        setIsEditDialogOpen(true);
    };

    const handleSaveRecord = async () => {
        if (!editingRecord || !editingRecord.employeeId || !editingRecord.type) {
            toast({ title: "Missing Information", variant: "destructive" });
            return;
        }

        const [hours, minutes] = recordTime.split(':').map(Number);
        const newTimestamp = new Date(recordDate);
        newTimestamp.setHours(hours, minutes, 0, 0);

        const payload = {
            employeeId: editingRecord.employeeId,
            type: editingRecord.type,
            timestamp: Timestamp.fromDate(newTimestamp),
        };

        if (editingRecord.id) {
            await updateAttendanceRecord(editingRecord.id, payload);
            toast({ title: "Record Updated" });
        } else {
            await createAttendanceRecord(payload);
            toast({ title: "Record Created" });
        }
        
        setIsEditDialogOpen(false);
        setEditingRecord(null);
        handleFilterSearch(); // Refresh the list
    };

    const handleDeleteRecord = async (recordId: string) => {
        await deleteAttendanceRecord(recordId);
        toast({ title: "Record Deleted", variant: "destructive" });
        handleFilterSearch();
    };

    const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e.fullName])), [employees]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Clock Manager</CardTitle>
                <CardDescription>View, edit, and manually add employee clock-in/out records.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[150px]">
                        <Label>Employee</Label>
                        <Select value={filters.employeeId} onValueChange={(val) => setFilters(prev => ({ ...prev, employeeId: val }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Employee" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Employees</SelectItem>
                                {employees.map(emp => (
                                    <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <Label>Start Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !filters.startDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {filters.startDate ? format(filters.startDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filters.startDate} onSelect={d => setFilters(p => ({...p, startDate: d}))} /></PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <Label>End Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !filters.endDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {filters.endDate ? format(filters.endDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filters.endDate} onSelect={d => setFilters(p => ({...p, endDate: d}))} /></PopoverContent>
                        </Popover>
                    </div>
                    <Button onClick={handleFilterSearch} disabled={isLoading}><Filter className="mr-2 h-4 w-4" />{isLoading ? 'Searching...' : 'Search'}</Button>
                    <Button onClick={() => handleOpenEditDialog(null)} variant="outline"><PlusCircle className="mr-2 h-4 w-4" />Add Record</Button>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center">Loading records...</TableCell></TableRow>
                            ) : records.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center">No records found for the selected filters.</TableCell></TableRow>
                            ) : (
                                records.map(rec => (
                                    <TableRow key={rec.id}>
                                        <TableCell>{employeeMap.get(rec.employeeId) || 'Unknown'}</TableCell>
                                        <TableCell>{format(rec.timestamp.toDate(), 'PPP')}</TableCell>
                                        <TableCell>{format(rec.timestamp.toDate(), 'p')}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${rec.type === 'Entry' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                                {rec.type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(rec)}><Pencil className="h-4 w-4"/></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteRecord(rec.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

             <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingRecord?.id ? 'Edit' : 'Add'} Attendance Record</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                         <div>
                            <Label>Employee</Label>
                            <Select 
                                value={editingRecord?.employeeId || ''} 
                                onValueChange={(val) => setEditingRecord(p => ({...p, employeeId: val}))}
                                disabled={!!editingRecord?.id} // Disable if editing existing record
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Type</Label>
                            <Select value={editingRecord?.type || 'Entry'} onValueChange={(val: 'Entry' | 'Exit') => setEditingRecord(p => ({...p, type: val}))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Entry">Entry (Clock In)</SelectItem>
                                    <SelectItem value="Exit">Exit (Clock Out)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                                <Label>Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {format(recordDate, "PPP")}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={recordDate} onSelect={(d) => d && setRecordDate(d)} /></PopoverContent>
                                </Popover>
                           </div>
                           <div>
                               <Label>Time</Label>
                               <Input type="time" value={recordTime} onChange={e => setRecordTime(e.target.value)} />
                           </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveRecord}>Save Record</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
