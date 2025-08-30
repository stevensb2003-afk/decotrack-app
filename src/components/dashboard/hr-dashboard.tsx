"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, UserPlus, Check, X, Calendar as CalendarIcon } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Employee, getAllEmployees, createEmployee, updateEmployee } from '@/services/employeeService';
import { ChangeRequest, getPendingChangeRequests, updateChangeRequestStatus } from '@/services/changeRequestService';
import { Switch } from '../ui/switch';

export default function HRDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [isCreateDialogOpen, setCreateIsDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [newEmployeeData, setNewEmployeeData] = useState<Omit<Employee, 'id'>>({
      name: '',
      email: '',
      role: '',
      idType: 'Cédula',
      idNumber: '',
      cellphoneNumber: '',
      licensePermission: false,
      status: 'Active',
      salary: 0
  });

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
    setIsUpdateDialogOpen(true);
  };
  
  const handleSaveChanges = async () => {
    if (!selectedEmployee) return;
    
    // Assuming you have form fields bound to selectedEmployee state
    await updateEmployee(selectedEmployee.id, selectedEmployee);

    toast({
        title: "Record Updated",
        description: `Record for ${selectedEmployee.name} has been updated.`,
    });
    setIsUpdateDialogOpen(false);
    setSelectedEmployee(null);
    fetchData();
  };

  const handleCreateEmployee = async () => {
    if (!newEmployeeData.name || !newEmployeeData.email || !newEmployeeData.role) {
      toast({ title: "Missing Fields", description: "Name, email and role are required.", variant: "destructive" });
      return;
    }
    
    await createEmployee(newEmployeeData);

    toast({
        title: "Employee Created",
        description: `${newEmployeeData.name} has been added to the employee list.`,
    });
    setCreateIsDialogOpen(false);
    setNewEmployeeData({
        name: '', email: '', role: '', idType: 'Cédula', idNumber: '', 
        cellphoneNumber: '', licensePermission: false, status: 'Active', salary: 0
    });
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

  const getStatusColor = (status: 'Active' | 'LOA' | 'Terminated') => {
      switch (status) {
          case 'Active': return 'bg-green-100 text-green-800';
          case 'LOA': return 'bg-yellow-100 text-yellow-800';
          case 'Terminated': return 'bg-red-100 text-red-800';
          default: return 'bg-gray-100 text-gray-800';
      }
  }

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
              <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
                      <Label htmlFor="name-create">Name</Label>
                      <Input id="name-create" value={newEmployeeData.name} onChange={e => setNewEmployeeData({...newEmployeeData, name: e.target.value})} />
                      
                      <Label htmlFor="email-create">Email</Label>
                      <Input id="email-create" type="email" value={newEmployeeData.email} onChange={e => setNewEmployeeData({...newEmployeeData, email: e.target.value})} />
                      
                      <Label htmlFor="role-create">Role</Label>
                      <Input id="role-create" value={newEmployeeData.role} onChange={e => setNewEmployeeData({...newEmployeeData, role: e.target.value})} />

                      <Label htmlFor="id-type-create">ID Type</Label>
                      <Select value={newEmployeeData.idType} onValueChange={(val: Employee['idType']) => setNewEmployeeData({...newEmployeeData, idType: val})}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cédula">Cédula</SelectItem>
                          <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                          <SelectItem value="Residencia">Residencia</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Label htmlFor="id-number-create">ID Number</Label>
                      <Input id="id-number-create" value={newEmployeeData.idNumber} onChange={e => setNewEmployeeData({...newEmployeeData, idNumber: e.target.value})} />
                      
                      <Label htmlFor="cellphone-create">Cellphone Number</Label>
                      <Input id="cellphone-create" type="tel" value={newEmployeeData.cellphoneNumber} onChange={e => setNewEmployeeData({...newEmployeeData, cellphoneNumber: e.target.value})} />

                      <div className="flex items-center space-x-2">
                        <Label htmlFor="license-create">Has License?</Label>
                        <Switch id="license-create" checked={newEmployeeData.licensePermission} onCheckedChange={val => setNewEmployeeData({...newEmployeeData, licensePermission: val})} />
                      </div>

                       <Label htmlFor="salary-create">Salary (CRC)</Label>
                      <Input id="salary-create" type="number" value={newEmployeeData.salary} onChange={e => setNewEmployeeData({...newEmployeeData, salary: parseFloat(e.target.value) || 0})} />
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
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.role}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.status)}`}>
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
      
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Information for {selectedEmployee?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
            {selectedEmployee && Object.entries(selectedEmployee).map(([key, value]) => {
                if(['id', 'email'].includes(key)) return null;
                const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                
                if (key === 'status') {
                    return (
                        <div key={key}>
                            <Label htmlFor={`update-${key}`}>{label}</Label>
                            <Select value={value} onValueChange={(val: Employee['status']) => setSelectedEmployee({...selectedEmployee, status: val})}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="LOA">LOA</SelectItem>
                                    <SelectItem value="Terminated">Terminated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )
                }

                 if (key === 'idType') {
                    return (
                        <div key={key}>
                            <Label htmlFor={`update-${key}`}>{label}</Label>
                            <Select value={value} onValueChange={(val: Employee['idType']) => setSelectedEmployee({...selectedEmployee, idType: val})}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cédula">Cédula</SelectItem>
                                    <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                                    <SelectItem value="Residencia">Residencia</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )
                }
                
                if (key === 'licensePermission') {
                    return (
                         <div className="flex items-center space-x-2" key={key}>
                            <Label htmlFor={`update-${key}`}>{label}</Label>
                            <Switch id={`update-${key}`} checked={value} onCheckedChange={val => setSelectedEmployee({...selectedEmployee, licensePermission: val})} />
                        </div>
                    )
                }

                return (
                    <div key={key}>
                        <Label htmlFor={`update-${key}`}>{label}</Label>
                        <Input 
                            id={`update-${key}`} 
                            value={value} 
                            type={key === 'salary' ? 'number' : 'text'}
                            onChange={(e) => setSelectedEmployee({...selectedEmployee, [key]: key === 'salary' ? parseFloat(e.target.value) || 0 : e.target.value})} 
                        />
                    </div>
                )
            })}
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
