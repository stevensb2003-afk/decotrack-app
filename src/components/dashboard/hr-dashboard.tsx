
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserPlus, Check, X, Pencil, Trash2, CalendarIcon } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

const initialNewEmployeeData: Omit<Employee, 'id'> = {
    name: '',
    email: '',
    role: 'employee',
    idType: 'ID Nacional',
    idNumber: '',
    cellphoneNumber: '',
    licensePermission: false,
    licenses: [],
    status: 'Active',
    salary: 0,
    nationality: '',
    birthDate: Timestamp.now(),
    hireDate: Timestamp.now(),
    employmentType: 'n/a',
    salaryType: 'Salary',
};

const countries = [
    { value: "AF", label: "Afghanistan" },
    { value: "AL", label: "Albania" },
    { value: "DZ", label: "Algeria" },
    { value: "AD", label: "Andorra" },
    { value: "AO", label: "Angola" },
    { value: "AG", label: "Antigua and Barbuda" },
    { value: "AR", label: "Argentina" },
    { value: "AM", label: "Armenia" },
    { value: "AU", label: "Australia" },
    { value: "AT", label: "Austria" },
    { value: "AZ", label: "Azerbaijan" },
    { value: "BS", label: "Bahamas" },
    { value: "BH", label: "Bahrain" },
    { value: "BD", label: "Bangladesh" },
    { value: "BB", label: "Barbados" },
    { value: "BY", label: "Belarus" },
    { value: "BE", label: "Belgium" },
    { value: "BZ", label: "Belize" },
    { value: "BJ", label: "Benin" },
    { value: "BT", label: "Bhutan" },
    { value: "BO", label: "Bolivia" },
    { value: "BA", label: "Bosnia and Herzegovina" },
    { value: "BW", label: "Botswana" },
    { value: "BR", label: "Brazil" },
    { value: "BN", label: "Brunei" },
    { value: "BG", label: "Bulgaria" },
    { value: "BF", label: "Burkina Faso" },
    { value: "BI", label: "Burundi" },
    { value: "CV", label: "Cabo Verde" },
    { value: "KH", label: "Cambodia" },
    { value: "CM", label: "Cameroon" },
    { value: "CA", label: "Canada" },
    { value: "CF", label: "Central African Republic" },
    { value: "TD", label: "Chad" },
    { value: "CL", label: "Chile" },
    { value: "CN", label: "China" },
    { value: "CO", label: "Colombia" },
    { value: "KM", label: "Comoros" },
    { value: "CG", label: "Congo, Republic of the" },
    { value: "CD", label: "Congo, Democratic Republic of the" },
    { value: "CR", label: "Costa Rica" },
    { value: "CI", label: "Cote d'Ivoire" },
    { value: "HR", label: "Croatia" },
    { value: "CU", label: "Cuba" },
    { value: "CY", label: "Cyprus" },
    { value: "CZ", label: "Czechia" },
    { value: "DK", label: "Denmark" },
    { value: "DJ", label: "Djibouti" },
    { value: "DM", label: "Dominica" },
    { value: "DO", label: "Dominican Republic" },
    { value: "EC", label: "Ecuador" },
    { value: "EG", label: "Egypt" },
    { value: "SV", label: "El Salvador" },
    { value: "GQ", label: "Equatorial Guinea" },
    { value: "ER", label: "Eritrea" },
    { value: "EE", label: "Estonia" },
    { value: "SZ", label: "Eswatini" },
    { value: "ET", label: "Ethiopia" },
    { value: "FJ", label: "Fiji" },
    { value: "FI", label: "Finland" },
    { value: "FR", label: "France" },
    { value: "GA", label: "Gabon" },
    { value: "GM", label: "Gambia" },
    { value: "GE", label: "Georgia" },
    { value: "DE", label: "Germany" },
    { value: "GH", label: "Ghana" },
    { value: "GR", label: "Greece" },
    { value: "GD", label: "Grenada" },
    { value: "GT", label: "Guatemala" },
    { value: "GN", label: "Guinea" },
    { value: "GW", label: "Guinea-Bissau" },
    { value: "GY", label: "Guyana" },
    { value: "HT", label: "Haiti" },
    { value: "HN", label: "Honduras" },
    { value: "HU", label: "Hungary" },
    { value: "IS", label: "Iceland" },
    { value: "IN", label: "India" },
    { value: "ID", label: "Indonesia" },
    { value: "IR", label: "Iran" },
    { value: "IQ", label: "Iraq" },
    { value: "IE", label: "Ireland" },
    { value: "IL", label: "Israel" },
    { value: "IT", label: "Italy" },
    { value: "JM", label: "Jamaica" },
    { value: "JP", label: "Japan" },
    { value: "JO", label: "Jordan" },
    { value: "KZ", label: "Kazakhstan" },
    { value: "KE", label: "Kenya" },
    { value: "KI", label: "Kiribati" },
    { value: "KW", label: "Kuwait" },
    { value: "KG", label: "Kyrgyzstan" },
    { value: "LA", label: "Laos" },
    { value: "LV", label: "Latvia" },
    { value: "LB", label: "Lebanon" },
    { value: "LS", label: "Lesotho" },
    { value: "LR", label: "Liberia" },
    { value: "LY", label: "Libya" },
    { value: "LI", label: "Liechtenstein" },
    { value: "LT", label: "Lithuania" },
    { value: "LU", label: "Luxembourg" },
    { value: "MG", label: "Madagascar" },
    { value: "MW", label: "Malawi" },
    { value: "MY", label: "Malaysia" },
    { value: "MV", label: "Maldives" },
    { value: "ML", label: "Mali" },
    { value: "MT", label: "Malta" },
    { value: "MH", label: "Marshall Islands" },
    { value: "MR", label: "Mauritania" },
    { value: "MU", label: "Mauritius" },
    { value: "MX", label: "Mexico" },
    { value: "FM", label: "Micronesia" },
    { value: "MD", label: "Moldova" },
    { value: "MC", label: "Monaco" },
    { value: "MN", label: "Mongolia" },
    { value: "ME", label: "Montenegro" },
    { value: "MA", label: "Morocco" },
    { value: "MZ", label: "Mozambique" },
    { value: "MM", label: "Myanmar" },
    { value: "NA", label: "Namibia" },
    { value: "NR", label: "Nauru" },
    { value: "NP", label: "Nepal" },
    { value: "NL", label: "Netherlands" },
    { value: "NZ", label: "New Zealand" },
    { value: "NI", label: "Nicaragua" },
    { value: "NE", label: "Niger" },
    { value: "NG", label: "Nigeria" },
    { value: "KP", label: "North Korea" },
    { value: "MK", label: "North Macedonia" },
    { value: "NO", label: "Norway" },
    { value: "OM", label: "Oman" },
    { value: "PK", label: "Pakistan" },
    { value: "PW", label: "Palau" },
    { value: "PA", label: "Panama" },
    { value: "PG", label: "Papua New Guinea" },
    { value: "PY", label: "Paraguay" },
    { value: "PE", label: "Peru" },
    { value: "PH", label: "Philippines" },
    { value: "PL", label: "Poland" },
    { value: "PT", label: "Portugal" },
    { value: "QA", label: "Qatar" },
    { value: "RO", label: "Romania" },
    { value: "RU", label: "Russia" },
    { value: "RW", label: "Rwanda" },
    { value: "KN", label: "Saint Kitts and Nevis" },
    { value: "LC", label: "Saint Lucia" },
    { value: "VC", label: "Saint Vincent and the Grenadines" },
    { value: "WS", label: "Samoa" },
    { value: "SM", label: "San Marino" },
    { value: "ST", label: "Sao Tome and Principe" },
    { value: "SA", label: "Saudi Arabia" },
    { value: "SN", label: "Senegal" },
    { value: "RS", label: "Serbia" },
    { value: "SC", label: "Seychelles" },
    { value: "SL", label: "Sierra Leone" },
    { value: "SG", label: "Singapore" },
    { value: "SK", label: "Slovakia" },
    { value: "SI", label: "Slovenia" },
    { value: "SB", label: "Solomon Islands" },
    { value: "SO", label: "Somalia" },
    { value: "ZA", label: "South Africa" },
    { value: "KR", label: "South Korea" },
    { value: "SS", label: "South Sudan" },
    { value: "ES", label: "Spain" },
    { value: "LK", label: "Sri Lanka" },
    { value: "SD", label: "Sudan" },
    { value: "SR", label: "Suriname" },
    { value: "SE", label: "Sweden" },
    { value: "CH", label: "Switzerland" },
    { value: "SY", label: "Syria" },
    { value: "TW", label: "Taiwan" },
    { value: "TJ", label: "Tajikistan" },
    { value: "TZ", label: "Tanzania" },
    { value: "TH", label: "Thailand" },
    { value: "TL", label: "Timor-Leste" },
    { value: "TG", label: "Togo" },
    { value: "TO", label: "Tonga" },
    { value: "TT", label: "Trinidad and Tobago" },
    { value: "TN", label: "Tunisia" },
    { value: "TR", label: "Turkey" },
    { value: "TM", label: "Turkmenistan" },
    { value: "TV", label: "Tuvalu" },
    { value: "UG", label: "Uganda" },
    { value: "UA", label: "Ukraine" },
    { value: "AE", label: "United Arab Emirates" },
    { value: "GB", label: "United Kingdom" },
    { value: "US", label: "United States" },
    { value: "UY", label: "Uruguay" },
    { value: "UZ", label: "Uzbekistan" },
    { value: "VU", label: "Vanuatu" },
    { value: "VA", label: "Vatican City" },
    { value: "VE", label: "Venezuela" },
    { value: "VN", label: "Vietnam" },
    { value: "YE", label: "Yemen" },
    { value: "ZM", label: "Zambia" },
    { value: "ZW", label: "Zimbabwe" },
];

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

    const { id, ...dataToUpdate } = selectedEmployee;
    
    await updateEmployee(id, dataToUpdate);

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
        const newLicenses = [...(newEmployeeData.licenses || [])];
        newLicenses[index] = { ...newLicenses[index], [field]: value };
        setNewEmployeeData({ ...newEmployeeData, licenses: newLicenses });
    } else if (selectedEmployee) {
        const newLicenses = [...(selectedEmployee.licenses || [])];
        newLicenses[index] = { ...newLicenses[index], [field]: value };
        setSelectedEmployee({ ...selectedEmployee, licenses: newLicenses });
    }
  };

  const addLicenseField = (isNew: boolean) => {
      if (isNew) {
          if((newEmployeeData.licenses || []).length < 3) {
            setNewEmployeeData(prev => ({...prev, licenses: [...(prev.licenses || []), { type: '', number: '', country: ''}]}));
          }
      } else if (selectedEmployee && (selectedEmployee.licenses || []).length < 3) {
          setSelectedEmployee(prev => prev ? ({...prev, licenses: [...(prev.licenses || []), { type: '', number: '', country: ''}]}) : prev);
      }
  };

  const removeLicenseField = (index: number, isNew: boolean) => {
    if(isNew) {
        const newLicenses = [...(newEmployeeData.licenses || [])];
        newLicenses.splice(index, 1);
        setNewEmployeeData({ ...newEmployeeData, licenses: newLicenses });
    } else if (selectedEmployee) {
        const newLicenses = [...(selectedEmployee.licenses || [])];
        newLicenses.splice(index, 1);
        setSelectedEmployee({ ...selectedEmployee, licenses: newLicenses });
    }
  };


  const canEdit = user?.role === 'admin' || user?.role === 'hr';

  const licenseTypes = ["A1", "A2", "A3", "B1", "B2", "B3", "B4", "C1", "C2", "D1", "D2", "D3", "E1", "E2"];
  const employeeRoles: Employee['role'][] = ["Cajero", "Chofer", "Vendedor", "Recursos Humanos", "Contabilidad", "Marketing"];
  const employmentTypes: Employee['employmentType'][] = ["Full time", "Part time", "Practicant", "n/a"];
  const salaryTypes: Employee['salaryType'][] = ["Hourly", "Salary", "Profesional Services"];

  const handleDateChange = (date: Date | undefined, field: 'birthDate' | 'hireDate', isNew: boolean) => {
    if (date) {
        const timestamp = Timestamp.fromDate(date);
        if (isNew) {
            setNewEmployeeData({ ...newEmployeeData, [field]: timestamp });
        } else if (selectedEmployee) {
            setSelectedEmployee({ ...selectedEmployee, [field]: timestamp });
        }
    }
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
              <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
                      <Label htmlFor="name-create">Name</Label>
                      <Input id="name-create" value={newEmployeeData.name} onChange={e => setNewEmployeeData({...newEmployeeData, name: e.target.value})} />
                      
                      <Label htmlFor="email-create">Email</Label>
                      <Input id="email-create" type="email" value={newEmployeeData.email} onChange={e => setNewEmployeeData({...newEmployeeData, email: e.target.value})} />
                      
                      <Label htmlFor="role-create">Role</Label>
                      <Select value={newEmployeeData.role} onValueChange={(val: Employee['role']) => setNewEmployeeData({...newEmployeeData, role: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {employeeRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                        </SelectContent>
                      </Select>

                      <Label htmlFor="id-type-create">ID Type</Label>
                      <Select value={newEmployeeData.idType} onValueChange={(val: Employee['idType']) => setNewEmployeeData({...newEmployeeData, idType: val})}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ID Nacional">ID Nacional</SelectItem>
                          <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                          <SelectItem value="Cédula Extranjero">Cédula Extranjero</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Label htmlFor="id-number-create">ID Number</Label>
                      <Input id="id-number-create" value={newEmployeeData.idNumber} onChange={e => setNewEmployeeData({...newEmployeeData, idNumber: e.target.value})} />
                      
                      <Label htmlFor="cellphone-create">Cellphone Number</Label>
                      <Input id="cellphone-create" type="tel" value={newEmployeeData.cellphoneNumber} onChange={e => setNewEmployeeData({...newEmployeeData, cellphoneNumber: e.target.value})} />
                      
                      <Label htmlFor="nationality-create">Nationality</Label>
                      <Select value={newEmployeeData.nationality} onValueChange={val => setNewEmployeeData({...newEmployeeData, nationality: val})}>
                          <SelectTrigger><SelectValue placeholder="Select Nationality"/></SelectTrigger>
                          <SelectContent>
                              {countries.map(c => <SelectItem key={c.value} value={c.label}>{c.label}</SelectItem>)}
                          </SelectContent>
                      </Select>

                      <Label htmlFor="birthdate-create">Birth Date</Label>
                       <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !newEmployeeData.birthDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {newEmployeeData.birthDate ? format(newEmployeeData.birthDate.toDate(), "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={newEmployeeData.birthDate.toDate()} onSelect={date => handleDateChange(date, 'birthDate', true)} initialFocus />
                        </PopoverContent>
                      </Popover>

                      <Label htmlFor="hiredate-create">Hire Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !newEmployeeData.hireDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {newEmployeeData.hireDate ? format(newEmployeeData.hireDate.toDate(), "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={newEmployeeData.hireDate.toDate()} onSelect={date => handleDateChange(date, 'hireDate', true)} initialFocus />
                        </PopoverContent>
                      </Popover>

                      <Label htmlFor="employment-type-create">Employment Type</Label>
                      <Select value={newEmployeeData.employmentType} onValueChange={(val: Employee['employmentType']) => setNewEmployeeData({...newEmployeeData, employmentType: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {employmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>

                      <Label htmlFor="salary-type-create">Salary Type</Label>
                      <Select value={newEmployeeData.salaryType} onValueChange={(val: Employee['salaryType']) => setNewEmployeeData({...newEmployeeData, salaryType: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {salaryTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>

                       <Label htmlFor="salary-create">Salary (CRC)</Label>
                      <Input id="salary-create" type="number" value={newEmployeeData.salary} onChange={e => setNewEmployeeData({...newEmployeeData, salary: parseFloat(e.target.value) || 0})} />

                      <div className="flex items-center space-x-2">
                        <Label htmlFor="license-create">Has License?</Label>
                        <Switch id="license-create" checked={newEmployeeData.licensePermission} onCheckedChange={val => setNewEmployeeData({...newEmployeeData, licensePermission: val})} />
                      </div>
                      {newEmployeeData.licensePermission && (
                        <div className="space-y-4 rounded-md border p-4">
                           <Label>License Details</Label>
                            {(newEmployeeData.licenses || []).map((license, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex items-center gap-x-2">
                                        <div className="flex-grow">
                                            <Select value={license.type} onValueChange={value => handleLicenseChange(index, 'type', value, true)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="License Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {licenseTypes.map(type => (
                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                            </Select>
                                        </div>
                                        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeLicenseField(index, true)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                    <Input placeholder="License Number" value={license.number} onChange={e => handleLicenseChange(index, 'number', e.target.value, true)} />
                                    <Select value={license.country} onValueChange={value => handleLicenseChange(index, 'country', value, true)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {countries.map(country => (
                                                <SelectItem key={country.value} value={country.label}>{country.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                            {(newEmployeeData.licenses || []).length < 3 && (
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
                            <Select value={selectedEmployee.role} onValueChange={(val: Employee['role']) => setSelectedEmployee({...selectedEmployee, role: val})}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    {employeeRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="update-idType">ID Type</Label>
                            <Select value={selectedEmployee.idType} onValueChange={(val: Employee['idType']) => setSelectedEmployee({...selectedEmployee, idType: val})}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ID Nacional">ID Nacional</SelectItem>
                                    <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                                    <SelectItem value="Cédula Extranjero">Cédula Extranjero</SelectItem>
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
                            <Label htmlFor="update-nationality">Nationality</Label>
                            <Select value={selectedEmployee.nationality} onValueChange={val => setSelectedEmployee({...selectedEmployee, nationality: val})}>
                                <SelectTrigger><SelectValue placeholder="Select Nationality"/></SelectTrigger>
                                <SelectContent>
                                    {countries.map(c => <SelectItem key={c.value} value={c.label}>{c.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                           <Label htmlFor="update-birthdate">Birth Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !selectedEmployee.birthDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {selectedEmployee.birthDate ? format(selectedEmployee.birthDate.toDate(), "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={selectedEmployee.birthDate?.toDate()} onSelect={date => handleDateChange(date, 'birthDate', false)} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                           <Label htmlFor="update-hiredate">Hire Date</Label>
                           <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !selectedEmployee.hireDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {selectedEmployee.hireDate ? format(selectedEmployee.hireDate.toDate(), "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={selectedEmployee.hireDate?.toDate()} onSelect={date => handleDateChange(date, 'hireDate', false)} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                         <div>
                            <Label htmlFor="update-employment-type">Employment Type</Label>
                            <Select value={selectedEmployee.employmentType} onValueChange={(val: Employee['employmentType']) => setSelectedEmployee({...selectedEmployee, employmentType: val})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {employmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="update-salary-type">Salary Type</Label>
                            <Select value={selectedEmployee.salaryType} onValueChange={(val: Employee['salaryType']) => setSelectedEmployee({...selectedEmployee, salaryType: val})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {salaryTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
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
                           <Switch id="update-license" checked={selectedEmployee.licensePermission} onCheckedChange={val => setSelectedEmployee({...selectedEmployee, licensePermission: val, licenses: val ? (selectedEmployee.licenses || []) : []})} />
                        </div>
                        {selectedEmployee.licensePermission && (
                            <div className="space-y-4 rounded-md border p-4">
                                <Label>License Details</Label>
                                {(selectedEmployee.licenses || []).map((license, index) => (
                                    <div key={index} className="space-y-2">
                                        <div className="flex items-center gap-x-2">
                                            <div className="flex-grow">
                                                <Select value={license.type} onValueChange={value => handleLicenseChange(index, 'type', value, false)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="License Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {licenseTypes.map(type => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                                </Select>
                                            </div>
                                            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeLicenseField(index, false)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                        <Input placeholder="License Number" value={license.number} onChange={e => handleLicenseChange(index, 'number', e.target.value, false)} />
                                        <Select value={license.country} onValueChange={value => handleLicenseChange(index, 'country', value, false)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Country" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {countries.map(country => (
                                                    <SelectItem key={country.value} value={country.label}>{country.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                                {(selectedEmployee.licenses || []).length < 3 && (
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
                        <div className="grid grid-cols-2"><Label>Nationality</Label><p>{selectedEmployee.nationality}</p></div>
                        <div className="grid grid-cols-2"><Label>Birth Date</Label><p>{selectedEmployee.birthDate ? format(selectedEmployee.birthDate.toDate(), "PPP") : 'N/A'}</p></div>
                        <div className="grid grid-cols-2"><Label>Hire Date</Label><p>{selectedEmployee.hireDate ? format(selectedEmployee.hireDate.toDate(), "PPP") : 'N/A'}</p></div>
                        <div className="grid grid-cols-2"><Label>Employment Type</Label><p>{selectedEmployee.employmentType}</p></div>
                        <div className="grid grid-cols-2"><Label>Salary Type</Label><p>{selectedEmployee.salaryType}</p></div>
                        <div className="grid grid-cols-2"><Label>Salary</Label><p>{new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(selectedEmployee.salary)}</p></div>
                        <div className="grid grid-cols-2"><Label>Status</Label><p>{selectedEmployee.status}</p></div>
                        <div className="grid grid-cols-2"><Label>Has License?</Label><p>{selectedEmployee.licensePermission ? 'Yes' : 'No'}</p></div>
                        {selectedEmployee.licensePermission && (selectedEmployee.licenses || []).length > 0 && (
                            <div>
                                <Label>Licenses</Label>
                                <div className="space-y-2 mt-1">
                                    {(selectedEmployee.licenses || []).map((license, index) => (
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
