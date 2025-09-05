
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, X, Eye, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TimeOffRequest, getTimeOffRequests, updateTimeOffRequestStatus } from '@/services/timeOffRequestService';
import { format, isWithinInterval } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Employee, getAllEmployees } from '@/services/employeeService';
import { cn } from '@/lib/utils';

export default function TimeOffDashboard() {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    const reqs = await getTimeOffRequests();
    const emps = await getAllEmployees();
    setRequests(reqs);
    setEmployees(emps);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestAction = async (requestId: string, status: 'approved' | 'rejected') => {
    await updateTimeOffRequestStatus(requestId, status);
    toast({
      title: `Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      description: `The time off request has been ${status}.`,
    });
    fetchData();
  };

  const getStatusVariant = (status: TimeOffRequest['status']) => {
    switch(status) {
        case 'approved': return 'default';
        case 'rejected': return 'destructive';
        case 'pending': return 'secondary';
        default: return 'outline';
    }
  }

  const filteredRequests = requests.filter(r => {
      const statusMatch = r.status === filterStatus;
      const employeeMatch = filterEmployee === 'all' || r.employeeId === filterEmployee;
      const dateMatch = !filterDate || isWithinInterval(filterDate, {
          start: r.startDate.toDate(),
          end: r.endDate.toDate()
      });
      return statusMatch && employeeMatch && dateMatch;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Time Off Requests</CardTitle>
          <CardDescription>Review and manage employee time off requests.</CardDescription>
           <div className="flex flex-col md:flex-row gap-2 pt-2">
              <div className="flex gap-2">
                <Button variant={filterStatus === 'pending' ? 'secondary' : 'ghost'} onClick={() => setFilterStatus('pending')}>Pending</Button>
                <Button variant={filterStatus === 'approved' ? 'secondary' : 'ghost'} onClick={() => setFilterStatus('approved')}>Approved</Button>
                <Button variant={filterStatus === 'rejected' ? 'secondary' : 'ghost'} onClick={() => setFilterStatus('rejected')}>Rejected</Button>
              </div>
              <div className="flex gap-2">
                <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Employee" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        {employees.map(emp => (
                            <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-[240px] justify-start text-left font-normal", !filterDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filterDate ? format(filterDate, "PPP") : <span>Filter by date...</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={filterDate}
                            onSelect={setFilterDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
                 { (filterEmployee !== 'all' || filterDate) && (
                    <Button variant="ghost" onClick={() => { setFilterEmployee('all'); setFilterDate(undefined); }}>Clear</Button>
                )}
              </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.employeeName}</TableCell>
                  <TableCell>{req.reason}</TableCell>
                  <TableCell>{format(req.startDate.toDate(), "PPP")} - {format(req.endDate.toDate(), "PPP")}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setSelectedRequest(req)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {req.status === 'pending' && (
                      <>
                        <Button size="icon" variant="outline" className="h-8 w-8 text-green-600" onClick={() => handleRequestAction(req.id, 'approved')}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 text-red-600" onClick={() => handleRequestAction(req.id, 'rejected')}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredRequests.length === 0 && (
             <p className="text-sm text-muted-foreground text-center py-4">No {filterStatus} requests match the current filters.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Request Details</DialogTitle>
                <DialogDescription>
                    Time off request from {selectedRequest?.employeeName}.
                </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
                <div className="grid gap-4 py-4 text-sm">
                   <div className="grid grid-cols-2"><span className="font-semibold">Reason:</span><span>{selectedRequest.reason}</span></div>
                   <div className="grid grid-cols-2"><span className="font-semibold">Start Date:</span><span>{format(selectedRequest.startDate.toDate(), "PPP")}</span></div>
                   <div className="grid grid-cols-2"><span className="font-semibold">End Date:</span><span>{format(selectedRequest.endDate.toDate(), "PPP")}</span></div>
                   {selectedRequest.hours && <div className="grid grid-cols-2"><span className="font-semibold">Hours:</span><span>{selectedRequest.hours}</span></div>}
                   <div className="grid grid-cols-1"><span className="font-semibold">Comments:</span><p className="col-span-2 text-muted-foreground">{selectedRequest.comments || 'N/A'}</p></div>
                   {selectedRequest.attachmentUrl && (
                       <div className="grid grid-cols-1">
                           <span className="font-semibold">Attachment:</span>
                           <a href={selectedRequest.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">View Attachment</a>
                       </div>
                   )}
                </div>
            )}
             <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
