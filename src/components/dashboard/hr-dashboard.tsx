"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Calendar as CalendarIcon, UserPlus, Check, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Employee, getAllEmployees, createEmployee, updateEmployee } from '@/services/employeeService';
import { ChangeRequest, getPendingChangeRequests, updateChangeRequestStatus } from '@/services/changeRequestService';

export default function HRDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setCreateIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [effectiveDate, setEffectiveDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();
  
  const fetchData = async () => {
      const emps = await getAllEmployees();
      const reqs = await getPendingChangeRequests();
      setEmployees(emps);
      setChangeRequests(reqs);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEffectiveDate(new Date());
    setIsDialogOpen(true);
  };
  
  const handleSaveChanges = async () => {
    if (!selectedEmployee) return;

    const updatedName = (document.getElementById('name-update') as HTMLInputElement).value;
    const updatedRole = (document.getElementById('role-update') as HTMLInputElement).value;
    
    await updateEmployee(selectedEmployee.id, { name: updatedName, role: updatedRole });

    toast({
        title: "Record Updated",
        description: `Record for ${selectedEmployee?.name} effective ${format(effectiveDate || new Date(), "PPP")} has been updated.`,
    });
    setIsDialogOpen(false);
    setSelectedEmployee(null);
    fetchData();
  };

  const handleCreateEmployee = async () => {
    const name = (document.getElementById('name-create') as HTMLInputElement).value;
    const email = (document.getElementById('email-create') as HTMLInputElement).value;
    const role = (document.getElementById('role-create') as HTMLInputElement).value;

    await createEmployee({ name, email, role });

    toast({
        title: "Employee Created",
        description: `${name} has been added to the employee list.`,
    });
    setCreateIsDialogOpen(false);
    fetchData();
  };
  
  const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
    const request = changeRequests.find(req => req.id === requestId);
    if(!request) return;

    if(action === 'approved') {
        const fieldToUpdate = request.fieldName.toLowerCase() as 'name' | 'email';
        await updateEmployee(request.employeeId, { [fieldToUpdate]: request.newValue });
    }
    
    await updateChangeRequestStatus(requestId, action);

    toast({
        title: `Request ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        description: `The change request has been ${action}.`,
    });
    fetchData();
  };


  return (
    <div className="space-y-6">
      <Card>
          <CardHeader>
              <CardTitle>Change Requests</CardTitle>
              <CardDescription>Review and approve employee information changes.</CardDescription>
          </CardHeader>
          <CardContent>
              {changeRequests.length > 0 ? (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Employee</TableHead>
                              <TableHead>Field</TableHead>
                              <TableHead>Old Value</TableHead>
                              <TableHead>New Value</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {changeRequests.map((req) => (
                              <TableRow key={req.id}>
                                  <TableCell>{req.employeeName}</TableCell>
                                  <TableCell>{req.fieldName}</TableCell>
                                  <TableCell>{req.oldValue}</TableCell>
                                  <TableCell className="font-medium">{req.newValue}</TableCell>
                                  <TableCell className="text-right space-x-2">
                                      <Button size="icon" variant="outline" className="h-8 w-8 text-green-600" onClick={() => handleRequestAction(req.id, 'approved')}>
                                        <Check className="h-4 w-4" />
                                      </Button>
                                       <Button size="icon" variant="outline" className="h-8 w-8 text-red-600" onClick={() => handleRequestAction(req.id, 'rejected')}>
                                        <X className="h-4 w-4" />
                                      </Button>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              ) : (
                  <p className="text-sm text-muted-foreground">No pending change requests.</p>
              )}
          </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Employee Management</CardTitle>
              <CardDescription>View and manage employee records.</CardDescription>
            </div>
             <Dialog open={isCreateDialogOpen} onOpenChange={setCreateIsDialogOpen}>
              <DialogTrigger asChild>
                  <Button><UserPlus className="mr-2 h-4 w-4" /> Add Employee</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                      <Label htmlFor="name-create">Name</Label>
                      <Input id="name-create" placeholder="John Doe" />
                      <Label htmlFor="email-create">Email</Label>
                      <Input id="email-create" type="email" placeholder="name@example.com" />
                      <Label htmlFor="role-create">Role</Label>
                      <Input id="role-create" placeholder="Developer" />
                  </div>
                  <DialogFooter>
                      <Button onClick={handleCreateEmployee}>Add Employee</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.id}</TableCell>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.role}</TableCell>
                   <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {employee.status}
                    </span>
                   </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdateClick(employee)}>Update Information</DropdownMenuItem>
                        <DropdownMenuItem disabled>View History</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Information for {selectedEmployee?.name}</DialogTitle>
            <DialogDescription>
              Create a new record with an effective date to retain history.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name-update" className="text-right">Name</Label>
              <Input id="name-update" defaultValue={selectedEmployee?.name} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role-update" className="text-right">Role</Label>
                <Input id="role-update" defaultValue={selectedEmployee?.role} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="effective-date" className="text-right">Effective Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !effectiveDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {effectiveDate ? format(effectiveDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={effectiveDate}
                    onSelect={setEffectiveDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
