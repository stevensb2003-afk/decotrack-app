"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Calendar as CalendarIcon, UserPlus } from 'lucide-react';
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
import { mockEmployees, setMockEmployees } from '@/lib/mock-data';

export default function HRDashboard() {
  const [employees, setEmployees] = useState(mockEmployees);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setCreateIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<(typeof employees)[0] | null>(null);
  const [effectiveDate, setEffectiveDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const handleUpdateClick = (employee: (typeof employees)[0]) => {
    setSelectedEmployee(employee);
    setEffectiveDate(new Date());
    setIsDialogOpen(true);
  };
  
  const handleSaveChanges = () => {
    if (!selectedEmployee) return;

    const updatedName = (document.getElementById('name-update') as HTMLInputElement).value;
    const updatedRole = (document.getElementById('role-update') as HTMLInputElement).value;
    
    const updatedEmployees = employees.map(emp => 
      emp.id === selectedEmployee.id ? { ...emp, name: updatedName, role: updatedRole } : emp
    );
    setEmployees(updatedEmployees);
    setMockEmployees(updatedEmployees);

    toast({
        title: "Record Updated",
        description: `Record for ${selectedEmployee?.name} effective ${format(effectiveDate || new Date(), "PPP")} has been updated.`,
    });
    setIsDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleCreateEmployee = () => {
    const name = (document.getElementById('name-create') as HTMLInputElement).value;
    const email = (document.getElementById('email-create') as HTMLInputElement).value;
    const role = (document.getElementById('role-create') as HTMLInputElement).value;

    const newEmployee = {
      id: `USR${(employees.length + 1).toString().padStart(3, '0')}`,
      name,
      email,
      role,
      status: 'Absent'
    };

    const updatedEmployees = [...employees, newEmployee];
    setEmployees(updatedEmployees);
    setMockEmployees(updatedEmployees);

    toast({
        title: "Employee Created",
        description: `${name} has been added to the employee list.`,
    });
    setCreateIsDialogOpen(false);
  };


  return (
    <>
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
    </>
  );
}
