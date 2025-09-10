

"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Filter, PlusCircle, Pencil, Trash2, CalendarIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Employee, getAllEmployees } from '@/services/employeeService';
import { DailyAttendanceSummary, getDailySummariesByFilter, updateAttendanceDetail, updateOrCreateAttendanceRecord } from '@/services/attendanceService';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parse, startOfDay, differenceInMilliseconds } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';

type EditableSummary = Partial<DailyAttendanceSummary> & {
    newClockInTime?: string; // HH:mm
    newClockOutTime?: string; // HH:mm
    isNew?: boolean;
};

export default function ClockManager() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [summaries, setSummaries] = useState<DailyAttendanceSummary[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const [filters, setFilters] = useState<{ employeeId: string, startDate?: Date, endDate?: Date }>({ employeeId: 'all' });

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingSummary, setEditingSummary] = useState<EditableSummary | null>(null);

    const { toast } = useToast();

    const fetchInitialData = async () => {
        setIsLoading(true);
        const emps = await getAllEmployees();
        setEmployees(emps);
        // Initially fetch records for the last 7 days for all employees
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        const initialSummaries = await getDailySummariesByFilter({ startDate, endDate });
        setSummaries(initialSummaries);
        setFilters({ employeeId: 'all', startDate, endDate });
        setIsLoading(false);
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const handleFilterSearch = async () => {
        setIsLoading(true);
        const filteredSummaries = await getDailySummariesByFilter(filters);
        setSummaries(filteredSummaries);
        setIsLoading(false);
    };
    
    const handleOpenEditDialog = (summary: DailyAttendanceSummary | null) => {
        if(summary) {
            setEditingSummary({
                ...summary,
                newClockInTime: summary.clockIn ? format(summary.clockInTimestamp!.toDate(), 'HH:mm') : '',
                newClockOutTime: summary.clockOut ? format(summary.clockOutTimestamp!.toDate(), 'HH:mm') : '',
            });
        } else {
             // Creating a new record
            setEditingSummary({
                employeeId: filters.employeeId !== 'all' ? (employees.find(e => e.id === filters.employeeId)?.id || '') : (employees[0]?.id || ''),
                dateKey: format(new Date(), 'yyyy-MM-dd'),
                newClockInTime: '',
                newClockOutTime: '',
                mealBreakTaken: true,
                isNew: true,
            })
        }
        setIsEditDialogOpen(true);
    };

    const handleSaveSummary = async () => {
        if (!editingSummary?.employeeId || !editingSummary.dateKey) {
            toast({ title: "Error", description: "Employee and date are required.", variant: "destructive" });
            return;
        }

        setIsLoading(true);

        try {
            const { employeeId, dateKey, newClockInTime, newClockOutTime, mealBreakTaken, isNew } = editingSummary;
            const summaryId = `${employeeId}-${dateKey}`;
            const targetDate = parse(dateKey, 'yyyy-MM-dd', new Date());

            // Check if a record for this day and employee already exists if creating new
            if (isNew && summaries.some(s => s.id === summaryId)) {
                toast({ title: "Record Exists", description: "A record for this employee on this day already exists. Please edit the existing record.", variant: "destructive"});
                setIsLoading(false);
                return;
            }

            // Update Clock In
            const clockInDate = newClockInTime ? parse(newClockInTime, 'HH:mm', targetDate) : null;
            await updateOrCreateAttendanceRecord(employeeId, targetDate, 'Entry', clockInDate);

            // Update Clock Out
            const clockOutDate = newClockOutTime ? parse(newClockOutTime, 'HH:mm', targetDate) : null;
            await updateOrCreateAttendanceRecord(employeeId, targetDate, 'Exit', clockOutDate);
            
            // Update Meal Break
            if (mealBreakTaken !== undefined) {
                 await updateAttendanceDetail(summaryId, { mealBreakTaken });
            }

            toast({ title: "Record Saved", description: "The attendance record has been successfully updated." });
            setIsEditDialogOpen(false);
            setEditingSummary(null);
            await handleFilterSearch(); // Refresh data

        } catch (error) {
            console.error("Failed to save summary:", error);
            toast({ title: "Save Failed", description: "An error occurred while saving.", variant: "destructive" });
        } finally {
             setIsLoading(false);
        }
    };
    
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
                                <TableHead>Clock In</TableHead>
                                <TableHead>Clock Out</TableHead>
                                <TableHead>Scheduled</TableHead>
                                <TableHead>Meal Break</TableHead>
                                <TableHead>Total Hours</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={8} className="text-center">Loading records...</TableCell></TableRow>
                            ) : summaries.length === 0 ? (
                                <TableRow><TableCell colSpan={8} className="text-center">No records found for the selected filters.</TableCell></TableRow>
                            ) : (
                                summaries.map(summary => (
                                    <TableRow key={summary.id}>
                                        <TableCell>{summary.employeeName}</TableCell>
                                        <TableCell>{summary.date}</TableCell>
                                        <TableCell>{summary.clockIn || 'N/A'}</TableCell>
                                        <TableCell>{summary.clockOut || 'N/A'}</TableCell>
                                        <TableCell>
                                             <Badge variant={summary.wasScheduled ? 'default' : 'destructive'}>
                                                {summary.wasScheduled ? 'Yes' : 'No'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                             <Switch
                                                checked={summary.mealBreakTaken}
                                                disabled={true} // Display only
                                                aria-label="Meal Break Taken"
                                            />
                                        </TableCell>
                                        <TableCell className="font-mono">{calculateTotalHours(summary)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(summary)}><Pencil className="h-4 w-4"/></Button>
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
                        <DialogTitle>{editingSummary?.isNew ? 'Add' : 'Edit'} Attendance Record</DialogTitle>
                    </DialogHeader>
                    {editingSummary && (
                        <div className="grid gap-4 py-4">
                            <div>
                                <Label>Employee</Label>
                                <Select 
                                    value={editingSummary.employeeId || ''} 
                                    onValueChange={(val) => setEditingSummary(p => p ? {...p, employeeId: val} : null)}
                                    disabled={!editingSummary.isNew}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal" disabled={!editingSummary.isNew}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {editingSummary.dateKey ? format(parse(editingSummary.dateKey, 'yyyy-MM-dd', new Date()), "PPP") : "Select a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar 
                                            mode="single" 
                                            selected={editingSummary.dateKey ? parse(editingSummary.dateKey, 'yyyy-MM-dd', new Date()) : undefined} 
                                            onSelect={(d) => d && setEditingSummary(p => p ? {...p, dateKey: format(d, 'yyyy-MM-dd')} : null)}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Clock In Time</Label>
                                <Input type="time" value={editingSummary.newClockInTime} onChange={e => setEditingSummary(p => p ? {...p, newClockInTime: e.target.value} : null)} />
                            </div>
                            <div>
                                <Label>Clock Out Time</Label>
                                <Input type="time" value={editingSummary.newClockOutTime} onChange={e => setEditingSummary(p => p ? {...p, newClockOutTime: e.target.value} : null)} />
                            </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="meal-break-toggle"
                                    checked={!!editingSummary.mealBreakTaken}
                                    onCheckedChange={val => setEditingSummary(p => p ? {...p, mealBreakTaken: val} : null)}
                                />
                                <Label htmlFor="meal-break-toggle">Meal Break Taken</Label>
                            </div>

                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSummary} disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Record'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
