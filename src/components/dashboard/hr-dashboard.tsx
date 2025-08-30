"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserPlus, Check, X, Pencil, Trash2 } from 'lucide-react';
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
import { Employee, License, getAllEmployees, createEmployee, updateEmployee } from '@/services/employeeService';
import { ChangeRequest, getPendingChangeRequests, updateChangeRequestStatus } from '@/services/changeRequestService';
import { Switch } from '../ui/switch';
import { useAuth } from '@/hooks/use-auth';

const initialNewEmployeeData: Omit<Employee, 'id'> = {
    name: '',
    email: '',
    role: '',
    idType: 'Cédula',
    idNumber: '',
    cellphoneNumber: '',
    licensePermission: false,
    licenses: [],
    status: 'Active',
    salary: 0
};

export default function HRDashboard() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [isCreateDialogOpen, setCreateIsDialogOpen] = useState(false);
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [isEditingDetail, setIsEditingDetail] = useState(false);

  const [newEmployeeData, setNewEmployeeData] = useState<Omit<Employee, 'id'>>(initialNewEmployeeData);

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

  const handleViewDetailsClick = (employee: Employee) => {
    setSelectedEmployee(JSON.parse(JSON.stringify(employee)));
    setIsDetailViewOpen(true);
    setIsEditingDetail(false);
  };
  
  const handleSaveChanges = async () => {
    if (!selectedEmployee) return;
    
    await updateEmployee(selectedEmployee.id, selectedEmployee);

    toast({
        title: "Record Updated",
        description: `Record for ${selectedEmployee.name} has been updated.`,
    });
    setIsEditingDetail(false);
    setIsDetailViewOpen(false);
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
    setNewEmployeeData(initialNewEmployeeData);
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

  const handleLicenseChange = (index: number, field: keyof License, value: string, isNew: boolean) => {
    if (isNew) {
        const newLicenses = [...newEmployeeData.licenses];
        newLicenses[index] = { ...newLicenses[index], [field]: value };
        setNewEmployeeData({ ...newEmployeeData, licenses: newLicenses });
    } else if (selectedEmployee) {
        const newLicenses = [...selectedEmployee.licenses];
        newLicenses[index] = { ...newLicenses[index], [field]: value };
        setSelectedEmployee({ ...selectedEmployee, licenses: newLicenses });
    }
  };

  const addLicenseField = (isNew: boolean) => {
      if (isNew) {
          if(newEmployeeData.licenses.length < 3) {
            setNewEmployeeData(prev => ({...prev, licenses: [...prev.licenses, { type: '', number: '', country: ''}]}));
          }
      } else if (selectedEmployee && selectedEmployee.licenses.length < 3) {
          setSelectedEmployee(prev => prev ? ({...prev, licenses: [...prev.licenses, { type: '', number: '', country: ''}]}) : prev);
      }
  };

  const removeLicenseField = (index: number, isNew: boolean) => {
    if(isNew) {
        const newLicenses = [...newEmployeeData.licenses];
        newLicenses.splice(index, 1);
        setNewEmployeeData({ ...newEmployeeData, licenses: newLicenses });
    } else if (selectedEmployee) {
        const newLicenses = [...selectedEmployee.licenses];
        newLicenses.splice(index, 1);
        setSelectedEmployee({ ...selectedEmployee, licenses: newLicenses });
    }
  };


  const canEdit = user?.role === 'admin' || user?.role === 'hr';

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

                       <Label htmlFor="salary-create">Salary (CRC)</Label>
                      <Input id="salary-create" type="number" value={newEmployeeData.salary} onChange={e => setNewEmployeeData({...newEmployeeData, salary: parseFloat(e.target.value) || 0})} />

                      <div className="flex items-center space-x-2">
                        <Label htmlFor="license-create">Has License?</Label>
                        <Switch id="license-create" checked={newEmployeeData.licensePermission} onCheckedChange={val => setNewEmployeeData({...newEmployeeData, licensePermission: val})} />
                      </div>
                      {newEmployeeData.licensePermission && (
                        <div className="space-y-4 rounded-md border p-4">
                           <Label>License Details</Label>
                            {newEmployeeData.licenses.map((license, index) => (
                                <div key={index} className="space-y-2 relative">
                                    <Input placeholder="License Type (e.g. Car, Motorcycle)" value={license.type} onChange={e => handleLicenseChange(index, 'type', e.target.value, true)} />
                                    <Input placeholder="License Number" value={license.number} onChange={e => handleLicenseChange(index, 'number', e.target.value, true)} />
                                    <Input placeholder="Country" value={license.country} onChange={e => handleLicenseChange(index, 'country', e.target.value, true)} />
                                    <Button variant="ghost" size="icon" className="absolute top-0 right-0" onClick={() => removeLicenseField(index, true)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                            {newEmployeeData.licenses.length < 3 && (
                                <Button variant="outline" size="sm" onClick={() => addLicenseField(true)}>Add License</Button>
                            )}
                        </div>
                      )}
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id} className="cursor-pointer" onClick={() => handleViewDetailsClick(employee)}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.role}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                        {employee.status}
                    </span>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex-row items-center justify-between">
            <DialogTitle>Details for {selectedEmployee?.name}</DialogTitle>
            {canEdit && (
                <Button variant="ghost" size="icon" onClick={() => setIsEditingDetail(!isEditingDetail)}>
                    <Pencil className="h-4 w-4" />
                </Button>
            )}
          </DialogHeader>
          {selectedEmployee && (
             <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
                
                {isEditingDetail ? (
                    <>
                        <div>
                            <Label htmlFor="update-name">Name</Label>
                            <Input id="update-name" value={selectedEmployee.name} onChange={(e) => setSelectedEmployee({...selectedEmployee, name: e.target.value})} />
                        </div>
                        <div>
                            <Label htmlFor="update-role">Role</Label>
                            <Input id="update-role" value={selectedEmployee.role} onChange={(e) => setSelectedEmployee({...selectedEmployee, role: e.target.value})} />
                        </div>
                        <div>
                            <Label htmlFor="update-idType">ID Type</Label>
                            <Select value={selectedEmployee.idType} onValueChange={(val: Employee['idType']) => setSelectedEmployee({...selectedEmployee, idType: val})}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cédula">Cédula</SelectItem>
                                    <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                                    <SelectItem value="Residencia">Residencia</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="update-idNumber">ID Number</Label>
                            <Input id="update-idNumber" value={selectedEmployee.idNumber} onChange={(e) => setSelectedEmployee({...selectedEmployee, idNumber: e.target.value})} />
                        </div>
                        <div>
                            <Label htmlFor="update-cellphone">Cellphone</Label>
                            <Input id="update-cellphone" value={selectedEmployee.cellphoneNumber} onChange={(e) => setSelectedEmployee({...selectedEmployee, cellphoneNumber: e.target.value})} />
                        </div>
                        <div>
                            <Label htmlFor="update-salary">Salary (CRC)</Label>
                            <Input id="update-salary" type="number" value={selectedEmployee.salary} onChange={(e) => setSelectedEmployee({...selectedEmployee, salary: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div>
                            <Label htmlFor="update-status">Status</Label>
                            <Select value={selectedEmployee.status} onValueChange={(val: Employee['status']) => setSelectedEmployee({...selectedEmployee, status: val})}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="LOA">LOA</SelectItem>
                                    <SelectItem value="Terminated">Terminated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                           <Label htmlFor="update-license">Has License?</Label>
                           <Switch id="update-license" checked={selectedEmployee.licensePermission} onCheckedChange={val => setSelectedEmployee({...selectedEmployee, licensePermission: val, licenses: val ? selectedEmployee.licenses : []})} />
                        </div>
                        {selectedEmployee.licensePermission && (
                            <div className="space-y-4 rounded-md border p-4">
                                <Label>License Details</Label>
                                {(selectedEmployee.licenses || []).map((license, index) => (
                                    <div key={index} className="space-y-2 relative">
                                        <Input placeholder="License Type" value={license.type} onChange={e => handleLicenseChange(index, 'type', e.target.value, false)} />
                                        <Input placeholder="License Number" value={license.number} onChange={e => handleLicenseChange(index, 'number', e.target.value, false)} />
                                        <Input placeholder="Country" value={license.country} onChange={e => handleLicenseChange(index, 'country', e.target.value, false)} />
                                        <Button variant="ghost" size="icon" className="absolute top-0 right-0" onClick={() => removeLicenseField(index, false)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                {selectedEmployee.licenses.length < 3 && (
                                    <Button variant="outline" size="sm" onClick={() => addLicenseField(false)}>Add License</Button>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="grid grid-cols-2"><Label>Name</Label><p>{selectedEmployee.name}</p></div>
                        <div className="grid grid-cols-2"><Label>Email</Label><p>{selectedEmployee.email}</p></div>
                        <div className="grid grid-cols-2"><Label>Role</Label><p>{selectedEmployee.role}</p></div>
                        <div className="grid grid-cols-2"><Label>ID Type</Label><p>{selectedEmployee.idType}</p></div>
                        <div className="grid grid-cols-2"><Label>ID Number</Label><p>{selectedEmployee.idNumber}</p></div>
                        <div className="grid grid-cols-2"><Label>Cellphone</Label><p>{selectedEmployee.cellphoneNumber}</p></div>
                        <div className="grid grid-cols-2"><Label>Salary</Label><p>{new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(selectedEmployee.salary)}</p></div>
                        <div className="grid grid-cols-2"><Label>Status</Label><p>{selectedEmployee.status}</p></div>
                        <div className="grid grid-cols-2"><Label>Has License?</Label><p>{selectedEmployee.licensePermission ? 'Yes' : 'No'}</p></div>
                        {selectedEmployee.licensePermission && (selectedEmployee.licenses || []).length > 0 && (
                            <div>
                                <Label>Licenses</Label>
                                <div className="space-y-2 mt-1">
                                    {selectedEmployee.licenses.map((license, index) => (
                                        <div key={index} className="p-2 border rounded-md text-sm">
                                            <p><strong>Type:</strong> {license.type}</p>
                                            <p><strong>Number:</strong> {license.number}</p>
                                            <p><strong>Country:</strong> {license.country}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </>
                )}
            </div>
          )}
          {isEditingDetail && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditingDetail(false)}>Cancel</Button>
              <Button type="submit" onClick={handleSaveChanges}>Save Changes</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
