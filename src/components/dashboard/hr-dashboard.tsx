

"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserPlus, Check, X, Pencil, Trash2, CalendarIcon, Camera, Building, Filter, FileText, Gift, Upload, CalendarClock, Play } from 'lucide-react';
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
import { ScheduledChange, createScheduledChange, getScheduledChangesForEmployee, applyScheduledChanges } from '@/services/scheduledChangeService';
import { Switch } from '../ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format, differenceInYears, differenceInMonths, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import { updateUserPassword } from '@/services/userService';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Location, createLocation, getAllLocations, updateLocation } from '@/services/locationService';
import { Benefit, createBenefit, getAllBenefits, updateBenefit, deleteBenefit, BenefitApplicability } from '@/services/benefitService';
import { Textarea } from '../ui/textarea';

const initialNewEmployeeData: Omit<Employee, 'id' | 'fullName'> = {
    firstName: '',
    lastName: '',
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
    avatarUrl: '',
    locationId: '',
    locationName: '',
    managerName: '',
    contractSigned: false,
    CCSS: false,
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

const employeeFields: { value: keyof Employee; label: string; inputType: 'text' | 'number' | 'select' }[] = [
    { value: 'role', label: 'Role', inputType: 'select' },
    { value: 'salary', label: 'Salary', inputType: 'number' },
    { value: 'employmentType', label: 'Employment Type', inputType: 'select' },
    { value: 'salaryType', label: 'Salary Type', inputType: 'select' },
    { value: 'status', label: 'Status', inputType: 'select' },
    { value: 'locationId', label: 'Location', inputType: 'select' },
];

export default function HRDashboard() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [scheduledChanges, setScheduledChanges] = useState<ScheduledChange[]>([]);

  const [isCreateDialogOpen, setCreateIsDialogOpen] = useState(false);
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [isSchedulingChange, setIsSchedulingChange] = useState(false);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);


  const [newEmployeeData, setNewEmployeeData] = useState<Omit<Employee, 'id' | 'fullName'>>(initialNewEmployeeData);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationManager, setLocationManager] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterEmployee, setFilterEmployee] = useState('all');

  const [isBenefitDialogOpen, setIsBenefitDialogOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [newBenefitData, setNewBenefitData] = useState<Omit<Benefit, 'id' | 'locationName'>>({ name: '', description: '', locationId: '', appliesTo: 'All' });

  const [newScheduledChange, setNewScheduledChange] = useState<{
    fieldName: keyof Employee | '';
    newValue: string;
    effectiveDate: Date | undefined;
  }>({ fieldName: '', newValue: '', effectiveDate: undefined });

  const { toast } = useToast();

  const fetchData = async () => {
      const emps = await getAllEmployees();
      const locs = await getAllLocations();
      const bens = await getAllBenefits();
      setEmployees(emps);
      setLocations(locs);
      setBenefits(bens);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewDetailsClick = async (employee: Employee) => {
    const employeeCopy: Employee = {
        ...employee,
        birthDate: employee.birthDate,
        hireDate: employee.hireDate,
        licenses: employee.licenses ? [...employee.licenses] : []
    };
    setSelectedEmployee(employeeCopy);
    const changes = await getScheduledChangesForEmployee(employee.id);
    setScheduledChanges(changes);
    setIsDetailViewOpen(true);
    setIsEditingDetail(false);
  };
  
  const handleSaveChanges = async () => {
    if (!selectedEmployee) return;

    await updateEmployee(selectedEmployee.id, selectedEmployee);

    toast({
        title: "Record Updated",
        description: `Record for ${selectedEmployee.fullName} has been updated.`,
    });
    setIsEditingDetail(false);
    setIsDetailViewOpen(false);
    fetchData();
  };

  const handleCreateEmployee = async () => {
    if (!newEmployeeData.firstName || !newEmployeeData.email || !newEmployeeData.role) {
      toast({ title: "Missing Fields", description: "First name, email and role are required.", variant: "destructive" });
      return;
    }
    
    await createEmployee(newEmployeeData);

    toast({
        title: "Employee Created",
        description: `${newEmployeeData.firstName} ${newEmployeeData.lastName} has been added to the employee list.`,
    });
    setCreateIsDialogOpen(false);
    setNewEmployeeData(initialNewEmployeeData);
    fetchData();
  };
  
  const getStatusColor = (status: 'Active' | 'LOA' | 'Terminated') => {
      switch (status) {
          case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
          case 'LOA': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
          case 'Terminated': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
          default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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

  const handleLicenseDateChange = (index: number, date: Date | undefined, isNew: boolean) => {
    if(!date) return;
    const timestamp = Timestamp.fromDate(date);

    if (isNew) {
        const newLicenses = [...(newEmployeeData.licenses || [])];
        newLicenses[index] = { ...newLicenses[index], expirationDate: timestamp };
        setNewEmployeeData({ ...newEmployeeData, licenses: newLicenses });
    } else if (selectedEmployee) {
        const newLicenses = [...(selectedEmployee.licenses || [])];
        newLicenses[index] = { ...newLicenses[index], expirationDate: timestamp };
        setSelectedEmployee({ ...selectedEmployee, licenses: newLicenses });
    }
  };


  const addLicenseField = (isNew: boolean) => {
      if (isNew) {
          if((newEmployeeData.licenses || []).length < 3) {
            setNewEmployeeData(prev => ({...prev, licenses: [...(prev.licenses || []), { type: '', number: '', country: '', expirationDate: Timestamp.now()}]}));
          }
      } else if (selectedEmployee && (selectedEmployee.licenses || []).length < 3) {
          setSelectedEmployee(prev => prev ? ({...prev, licenses: [...(prev.licenses || []), { type: '', number: '', country: '', expirationDate: Timestamp.now()}]}) : prev);
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
  const employeeRoles: Employee['role'][] = ["Cajero", "Chofer", "Vendedor", "Recursos Humanos", "Contabilidad", "Marketing", "Manager"];
  const employmentTypes: Employee['employmentType'][] = ["Full time", "Part time", "Practicant", "n/a"];
  const salaryTypes: Employee['salaryType'][] = ["Hourly", "Salary", "Profesional Services"];
  const statusTypes: Employee['status'][] = ["Active", "LOA", "Terminated"];

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

  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleLocationSelect = (locationId: string, isNew: boolean, isScheduleChange: boolean = false) => {
      const location = locations.find(l => l.id === locationId);
      if (!location) return;

      if (isScheduleChange) {
        setNewScheduledChange(prev => ({ ...prev, newValue: locationId }));
      } else if(isNew) {
          setNewEmployeeData(prev => ({
              ...prev,
              locationId: location.id,
              locationName: location.name,
              managerName: location.managerName || 'N/A'
          }));
      } else if (selectedEmployee) {
          setSelectedEmployee(prev => prev ? ({
              ...prev,
              locationId: location.id,
              locationName: location.name,
              managerName: location.managerName || 'N/A'
          }) : prev);
      }
  }

  const handleSaveLocation = async () => {
    if (!newLocationName) {
        toast({title: "Location name is required", variant: "destructive"});
        return;
    }
    const manager = employees.find(e => e.id === locationManager);

    const locationData = {
        name: newLocationName,
        managerId: manager?.id || '',
        managerName: manager?.fullName || '',
    }

    if (editingLocation) {
        await updateLocation(editingLocation.id, locationData);
        toast({title: "Location Updated"});
    } else {
        await createLocation(locationData);
        toast({title: "Location Created"});
    }
    
    setNewLocationName("");
    setLocationManager("");
    setEditingLocation(null);
    setIsLocationDialogOpen(false);
    fetchData();
  };
  
  const handleOpenLocationDialog = (location: Location | null) => {
    setEditingLocation(location);
    setNewLocationName(location?.name || "");
    setLocationManager(location?.managerId || "");
    setIsLocationDialogOpen(true);
  };
  
  const managementEmployees = employees.filter(e => e.role === 'Manager');
  
  const filteredEmployees = employees.filter(emp => {
      const locationMatch = filterLocation === 'all' || emp.locationId === filterLocation;
      const employeeMatch = filterEmployee === 'all' || emp.id === filterEmployee;
      return locationMatch && employeeMatch;
  });

  const handleContractStatusChange = async (employeeId: string, field: 'contractSigned' | 'CCSS', value: boolean) => {
      await updateEmployee(employeeId, { [field]: value });
      setEmployees(prev => prev.map(emp => emp.id === employeeId ? { ...emp, [field]: value } : emp));
      toast({title: "Status Updated", description: "Employee contract status has been updated."});
  };

  const handleOpenBenefitDialog = (benefit: Benefit | null) => {
    if (benefit) {
        setEditingBenefit(benefit);
        setNewBenefitData({
            name: benefit.name,
            description: benefit.description,
            locationId: benefit.locationId,
            appliesTo: benefit.appliesTo
        });
    } else {
        setEditingBenefit(null);
        setNewBenefitData({ name: '', description: '', locationId: '', appliesTo: 'All' });
    }
    setIsBenefitDialogOpen(true);
  };

  const handleSaveBenefit = async () => {
    if (!newBenefitData.name || !newBenefitData.locationId || !newBenefitData.appliesTo) {
        toast({title: "All fields are required", variant: "destructive"});
        return;
    }
    const location = locations.find(l => l.id === newBenefitData.locationId);
    if (!location) return;

    const benefitPayload = { ...newBenefitData, locationName: location.name };

    if (editingBenefit) {
        await updateBenefit(editingBenefit.id, benefitPayload);
        toast({title: "Benefit Updated"});
    } else {
        await createBenefit(benefitPayload);
        toast({title: "Benefit Created"});
    }
    fetchData();
    setIsBenefitDialogOpen(false);
  };

  const handleDeleteBenefit = async (benefitId: string) => {
    await deleteBenefit(benefitId);
    toast({title: "Benefit Deleted"});
    fetchData();
  };

  const benefitApplicabilityOptions: BenefitApplicability[] = ['All', 'Employee', 'Manager', 'HR'];

  const calculateSeniority = (hireDate: Timestamp): string => {
    const today = new Date();
    const start = hireDate.toDate();
    const years = differenceInYears(today, start);
    const months = differenceInMonths(today, start) % 12;

    const yearString = years > 0 ? `${years} year${years > 1 ? 's' : ''}` : '';
    const monthString = months > 0 ? `${months} month${months > 1 ? 's' : ''}` : '';

    if (years > 0 && months > 0) {
        return `${yearString}, ${monthString}`;
    }
    return yearString || monthString || 'Less than a month';
  };

  const handleScheduleChange = async () => {
    if (!selectedEmployee || !newScheduledChange.fieldName || !newScheduledChange.effectiveDate) {
        toast({ title: "Missing fields", description: "Field, new value, and effective date are required.", variant: "destructive" });
        return;
    }

    await createScheduledChange({
        employeeId: selectedEmployee.id,
        fieldName: newScheduledChange.fieldName,
        newValue: newScheduledChange.newValue,
        effectiveDate: Timestamp.fromDate(newScheduledChange.effectiveDate),
        status: 'pending'
    });

    toast({ title: "Change Scheduled", description: "The employee data change has been scheduled." });
    setIsSchedulingChange(false);
    setNewScheduledChange({ fieldName: '', newValue: '', effectiveDate: undefined });
    // Refetch changes for the employee
    const changes = await getScheduledChangesForEmployee(selectedEmployee.id);
    setScheduledChanges(changes);
  };

  const handleRunApplyChanges = async () => {
    setIsApplyingChanges(true);
    try {
        const result = await applyScheduledChanges();
        toast({
            title: "Scheduled Changes Applied",
            description: `${result.appliedChangesCount} changes were successfully applied.`,
        });
        fetchData(); // Refetch all data to reflect changes
    } catch (error) {
        console.error("Error applying scheduled changes:", error);
        toast({
            title: "Error Applying Changes",
            description: "An error occurred while applying scheduled changes.",
            variant: "destructive",
        });
    } finally {
        setIsApplyingChanges(false);
    }
  };


  const renderValueInputForScheduling = () => {
    const field = employeeFields.find(f => f.value === newScheduledChange.fieldName);
    if (!field) return null;

    switch (field.value) {
        case 'role':
            return (
                <Select value={newScheduledChange.newValue} onValueChange={val => setNewScheduledChange(p => ({ ...p, newValue: val }))}>
                    <SelectTrigger><SelectValue placeholder="Select new role" /></SelectTrigger>
                    <SelectContent>{employeeRoles.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
            );
        case 'employmentType':
             return (
                <Select value={newScheduledChange.newValue} onValueChange={val => setNewScheduledChange(p => ({ ...p, newValue: val }))}>
                    <SelectTrigger><SelectValue placeholder="Select new employment type" /></SelectTrigger>
                    <SelectContent>{employmentTypes.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
            );
        case 'salaryType':
             return (
                <Select value={newScheduledChange.newValue} onValueChange={val => setNewScheduledChange(p => ({ ...p, newValue: val }))}>
                    <SelectTrigger><SelectValue placeholder="Select new salary type" /></SelectTrigger>
                    <SelectContent>{salaryTypes.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
            );
        case 'status':
             return (
                <Select value={newScheduledChange.newValue} onValueChange={val => setNewScheduledChange(p => ({ ...p, newValue: val }))}>
                    <SelectTrigger><SelectValue placeholder="Select new status" /></SelectTrigger>
                    <SelectContent>{statusTypes.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
            );
        case 'locationId':
             return (
                 <Select value={newScheduledChange.newValue} onValueChange={val => handleLocationSelect(val, false, true)}>
                    <SelectTrigger><SelectValue placeholder="Select new location" /></SelectTrigger>
                    <SelectContent>{locations.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
                </Select>
            );
        case 'salary':
            return <Input type="number" value={newScheduledChange.newValue} onChange={e => setNewScheduledChange(p => ({ ...p, newValue: e.target.value }))} />;
        default:
            return <Input value={newScheduledChange.newValue} onChange={e => setNewScheduledChange(p => ({ ...p, newValue: e.target.value }))} />;
    }
  };
  
  const getChangeValueLabel = (change: ScheduledChange): string => {
    if (change.fieldName === 'locationId') {
        return locations.find(l => l.id === change.newValue)?.name || change.newValue;
    }
    return change.newValue;
  };


  return (
    <div className="space-y-6">
      <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Scheduled Changes Runner</CardTitle>
              <CardDescription>Manually trigger the process to apply all pending scheduled changes.</CardDescription>
            </div>
            <Button onClick={handleRunApplyChanges} disabled={isApplyingChanges}>
                <Play className="mr-2 h-4 w-4" />
                {isApplyingChanges ? 'Applying...' : 'Apply Pending Changes'}
            </Button>
          </CardHeader>
      </Card>
      
      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
        </TabsList>
        <TabsContent value="employees">
            <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                    <CardTitle>Employee Management</CardTitle>
                    <CardDescription>View and manage employee records.</CardDescription>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <Select value={filterLocation} onValueChange={setFilterLocation}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Filter by Location" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Locations</SelectItem>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Filter by Employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Employees</SelectItem>
                                    {employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             {(filterEmployee !== 'all' || filterLocation !== 'all') && <Button variant="ghost" onClick={() => {setFilterEmployee('all'); setFilterLocation('all');}}>Clear</Button>}
                        </div>
                        <Dialog open={isCreateDialogOpen} onOpenChange={setCreateIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><UserPlus className="mr-2 h-4 w-4" /> Add Employee</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="firstName-create">First Name</Label>
                                        <Input id="firstName-create" value={newEmployeeData.firstName} onChange={e => setNewEmployeeData({...newEmployeeData, firstName: e.target.value})} />
                                    </div>
                                    <div>
                                        <Label htmlFor="lastName-create">Last Name</Label>
                                        <Input id="lastName-create" value={newEmployeeData.lastName} onChange={e => setNewEmployeeData({...newEmployeeData, lastName: e.target.value})} />
                                    </div>
                                </div>
                                
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
                                    <SelectItem value="DIMEX">DIMEX</SelectItem>
                                    </SelectContent>
                                </Select>
                                
                                <div>
                                    <Label htmlFor="id-number-create">ID Number</Label>
                                    <Input id="id-number-create" value={newEmployeeData.idNumber} onChange={e => setNewEmployeeData({...newEmployeeData, idNumber: e.target.value})} />
                                </div>
                                
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
                                
                                <Label htmlFor="location-create">Location</Label>
                                <Select onValueChange={val => handleLocationSelect(val, true)}>
                                    <SelectTrigger><SelectValue placeholder="Select Location"/></SelectTrigger>
                                    <SelectContent>
                                        {locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <div>
                                    <Label>Manager</Label>
                                    <p className='text-sm text-muted-foreground'>{newEmployeeData.managerName || 'N/A'}</p>
                                </div>


                                <div className="flex items-center space-x-2">
                                    <Label htmlFor="license-create">Has License?</Label>
                                    <Switch id="license-create" checked={newEmployeeData.licensePermission} onCheckedChange={val => setNewEmployeeData({...newEmployeeData, licensePermission: val})} />
                                </div>
                                {newEmployeeData.licensePermission && (
                                    <div className="space-y-4 rounded-md border p-4">
                                    <Label>License Details</Label>
                                        {(newEmployeeData.licenses || []).map((license, index) => (
                                            <div key={index} className="space-y-2 border-t pt-2">
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
                                                <div>
                                                    <Input placeholder="License Number" value={license.number} onChange={e => handleLicenseChange(index, 'number', e.target.value, true)} />
                                                </div>
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
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !license.expirationDate && "text-muted-foreground")}>
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {license.expirationDate ? format(license.expirationDate.toDate(), "PPP") : <span>Expiration Date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar mode="single" selected={license.expirationDate?.toDate()} onSelect={date => handleLicenseDateChange(index, date, true)} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
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
                    </div>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredEmployees.map((employee) => (
                        <TableRow key={employee.id} className="cursor-pointer" onClick={() => handleViewDetailsClick(employee)}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={employee.avatarUrl || ''} alt={employee.fullName} />
                                    <AvatarFallback>{getInitials(employee.fullName)}</AvatarFallback>
                                </Avatar>
                                {employee.fullName}
                            </div>
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.role}</TableCell>
                        <TableCell>{employee.locationName || 'N/A'}</TableCell>
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
        </TabsContent>
        <TabsContent value="locations">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Locations</CardTitle>
                        <CardDescription>Manage your company's store locations and managers.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenLocationDialog(null)}><Building className="mr-2 h-4 w-4"/>Add Location</Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Location Name</TableHead>
                                <TableHead>Manager</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {locations.map(loc => (
                                <TableRow key={loc.id}>
                                    <TableCell>{loc.name}</TableCell>
                                    <TableCell>{loc.managerName || 'Not Assigned'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenLocationDialog(loc)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="contracts" className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Contract Status</CardTitle>
                    <CardDescription>Manage employee contract and insurance status.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Contract Signed</TableHead>
                                <TableHead>CCSS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.map(emp => (
                                <TableRow key={emp.id}>
                                    <TableCell>{emp.fullName}</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={emp.contractSigned}
                                            onCheckedChange={(value) => handleContractStatusChange(emp.id, 'contractSigned', value)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={emp.CCSS}
                                            onCheckedChange={(value) => handleContractStatusChange(emp.id, 'CCSS', value)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                 <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Benefits Management</CardTitle>
                        <CardDescription>Create and manage general benefits for employees by location.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenBenefitDialog(null)}><Gift className="mr-2 h-4 w-4" /> Add Benefit</Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Benefit Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Applies To</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {benefits.map(ben => (
                                <TableRow key={ben.id}>
                                    <TableCell>{ben.name}</TableCell>
                                    <TableCell>{ben.description}</TableCell>
                                    <TableCell>{ben.locationName}</TableCell>
                                    <TableCell>{ben.appliesTo}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenBenefitDialog(ben)}>
                                            <Pencil className="h-4 w-4"/>
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteBenefit(ben.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      
      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="flex-row items-center justify-between">
            <div className='flex items-center gap-4'>
                <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedEmployee?.avatarUrl || ''} alt={selectedEmployee?.fullName} />
                    <AvatarFallback>{getInitials(selectedEmployee?.fullName)}</AvatarFallback>
                </Avatar>
                <DialogTitle>Details for {selectedEmployee?.fullName}</DialogTitle>
            </div>
          </DialogHeader>
          {selectedEmployee && (
             <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Current Details</TabsTrigger>
                    <TabsTrigger value="changes">Scheduled Changes</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                     <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-6">
                        {isEditingDetail ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="update-firstName">First Name</Label>
                                        <Input id="update-firstName" value={selectedEmployee.firstName} onChange={(e) => setSelectedEmployee(prev => prev ? {...prev, firstName: e.target.value} : null)} />
                                    </div>
                                     <div>
                                        <Label htmlFor="update-lastName">Last Name</Label>
                                        <Input id="update-lastName" value={selectedEmployee.lastName} onChange={(e) => setSelectedEmployee(prev => prev ? {...prev, lastName: e.target.value} : null)} />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="update-role">Role</Label>
                                    <Select value={selectedEmployee.role} onValueChange={(val: Employee['role']) => setSelectedEmployee(prev => prev ? {...prev, role: val} : null)}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            {employeeRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="update-idType">ID Type</Label>
                                    <Select value={selectedEmployee.idType} onValueChange={(val: Employee['idType']) => setSelectedEmployee(prev => prev ? {...prev, idType: val} : null)}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ID Nacional">ID Nacional</SelectItem>
                                            <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                                            <SelectItem value="Cédula Extranjero">Cédula Extranjero</SelectItem>
                                            <SelectItem value="DIMEX">DIMEX</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="update-idNumber">ID Number</Label>
                                    <Input id="update-idNumber" value={selectedEmployee.idNumber || ''} onChange={(e) => setSelectedEmployee(prev => prev ? {...prev, idNumber: e.target.value} : null)} />
                                </div>
                                <div>
                                    <Label htmlFor="update-cellphone">Cellphone</Label>
                                    <Input id="update-cellphone" value={selectedEmployee.cellphoneNumber || ''} onChange={(e) => setSelectedEmployee(prev => prev ? {...prev, cellphoneNumber: e.target.value} : null)} />
                                </div>
                                <div>
                                    <Label htmlFor="update-nationality">Nationality</Label>
                                    <Select value={selectedEmployee.nationality} onValueChange={val => setSelectedEmployee(prev => prev ? {...prev, nationality: val} : null)}>
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
                                    <Select value={selectedEmployee.employmentType} onValueChange={(val: Employee['employmentType']) => setSelectedEmployee(prev => prev ? {...prev, employmentType: val} : null)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {employmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="update-salary-type">Salary Type</Label>
                                    <Select value={selectedEmployee.salaryType} onValueChange={(val: Employee['salaryType']) => setSelectedEmployee(prev => prev ? {...prev, salaryType: val} : null)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {salaryTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="update-salary">Salary (CRC)</Label>
                                    <Input id="update-salary" type="number" value={selectedEmployee.salary || 0} onChange={(e) => setSelectedEmployee(prev => prev ? {...prev, salary: parseFloat(e.target.value) || 0} : null)} />
                                </div>
                                <div>
                                    <Label htmlFor="update-location">Location</Label>
                                    <Select value={selectedEmployee.locationId || ''} onValueChange={val => handleLocationSelect(val, false)}>
                                        <SelectTrigger><SelectValue placeholder="Select Location"/></SelectTrigger>
                                        <SelectContent>
                                            {locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div>
                                    <Label>Manager</Label>
                                    <p className='text-sm text-muted-foreground'>{selectedEmployee.managerName || 'N/A'}</p>
                                </div>
                                <div>
                                    <Label htmlFor="update-status">Status</Label>
                                    <Select value={selectedEmployee.status} onValueChange={(val: Employee['status']) => setSelectedEmployee(prev => prev ? {...prev, status: val} : null)}>
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
                                   <Switch id="update-license" checked={selectedEmployee.licensePermission} onCheckedChange={val => setSelectedEmployee(prev => prev ? {...prev, licensePermission: val, licenses: val ? (selectedEmployee.licenses || []) : []} : null)} />
                                </div>
                                {selectedEmployee.licensePermission && (
                                    <div className="space-y-4 rounded-md border p-4">
                                        <Label>License Details</Label>
                                        {(selectedEmployee.licenses || []).map((license, index) => (
                                            <div key={index} className="space-y-2 border-t pt-2">
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
                                                 <div>
                                                    <Input placeholder="License Number" value={license.number} onChange={e => handleLicenseChange(index, 'number', e.target.value, false)} />
                                                </div>
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
                                                 <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !license.expirationDate && "text-muted-foreground")}>
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {license.expirationDate ? format(license.expirationDate.toDate(), "PPP") : <span>Expiration Date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar mode="single" selected={license.expirationDate?.toDate()} onSelect={date => handleLicenseDateChange(index, date, false)} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
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
                                <div className="grid grid-cols-2"><Label>Full Name</Label><p>{selectedEmployee.fullName}</p></div>
                                <div className="grid grid-cols-2"><Label>Email</Label><p>{selectedEmployee.email}</p></div>
                                <div className="grid grid-cols-2"><Label>Role</Label><p>{selectedEmployee.role}</p></div>
                                <div className="grid grid-cols-2"><Label>ID Type</Label><p>{selectedEmployee.idType}</p></div>
                                <div className="grid grid-cols-2"><Label>ID Number</Label><p>{selectedEmployee.idNumber || 'N/A'}</p></div>
                                <div className="grid grid-cols-2"><Label>Cellphone</Label><p>{selectedEmployee.cellphoneNumber || 'N/A'}</p></div>
                                <div className="grid grid-cols-2"><Label>Nationality</Label><p>{selectedEmployee.nationality || 'N/A'}</p></div>
                                <div className="grid grid-cols-2"><Label>Birth Date</Label><p>{selectedEmployee.birthDate ? format(selectedEmployee.birthDate.toDate(), "PPP") : 'N/A'}</p></div>
                                <div className="grid grid-cols-2"><Label>Hire Date</Label><p>{selectedEmployee.hireDate ? format(selectedEmployee.hireDate.toDate(), "PPP") : 'N/A'}</p></div>
                                <div className="grid grid-cols-2"><Label>Seniority</Label><p>{calculateSeniority(selectedEmployee.hireDate)}</p></div>
                                <div className="grid grid-cols-2"><Label>Location</Label><p>{selectedEmployee.locationName || 'N/A'}</p></div>
                                <div className="grid grid-cols-2"><Label>Manager</Label><p>{selectedEmployee.managerName || 'N/A'}</p></div>
                                <div className="grid grid-cols-2"><Label>Employment Type</Label><p>{selectedEmployee.employmentType}</p></div>
                                <div className="grid grid-cols-2"><Label>Salary Type</Label><p>{selectedEmployee.salaryType}</p></div>
                                <div className="grid grid-cols-2"><Label>Salary</Label><p>{new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(selectedEmployee.salary || 0)}</p></div>
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
                                                    <p><strong>Expiration:</strong> {license.expirationDate ? format(license.expirationDate.toDate(), "PPP") : 'N/A'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                     <DialogFooter className="pt-4 border-t">
                        {isEditingDetail ? (
                            <>
                                <Button variant="outline" onClick={() => setIsEditingDetail(false)}>Cancel</Button>
                                <Button onClick={handleSaveChanges}>Save Changes</Button>
                            </>
                        ) : (
                             <Button onClick={() => setIsEditingDetail(true)}><Pencil className="mr-2 h-4 w-4"/>Edit Details</Button>
                        )}
                    </DialogFooter>
                </TabsContent>
                <TabsContent value="changes">
                    <div className="space-y-4 py-4">
                        <div className="flex justify-end">
                            <Button onClick={() => setIsSchedulingChange(true)}><CalendarClock className="mr-2 h-4 w-4"/>Schedule a Change</Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Effective Date</TableHead>
                                    <TableHead>Field</TableHead>
                                    <TableHead>New Value</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {scheduledChanges.map(change => (
                                    <TableRow key={change.id}>
                                        <TableCell>{format(change.effectiveDate.toDate(), "PPP")}</TableCell>
                                        <TableCell>{change.fieldName}</TableCell>
                                        <TableCell>{getChangeValueLabel(change)}</TableCell>
                                        <TableCell>
                                             <span className={`px-2 py-1 text-xs font-semibold rounded-full ${change.status === 'applied' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {change.status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         {scheduledChanges.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No scheduled changes for this employee.</p>}
                    </div>
                </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
      
       <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{editingLocation ? "Edit Location" : "Add New Location"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div>
                    <Label htmlFor="location-name">Location Name</Label>
                    <Input id="location-name" value={newLocationName} onChange={e => setNewLocationName(e.target.value)} placeholder="e.g., Downtown Store"/>
                </div>
                <div>
                    <Label htmlFor="location-manager">Assign Manager</Label>
                    <Select value={locationManager} onValueChange={setLocationManager}>
                        <SelectTrigger><SelectValue placeholder="Select a manager" /></SelectTrigger>
                        <SelectContent>
                             <SelectItem value="none">None</SelectItem>
                            {managementEmployees.map(emp => (
                                <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsLocationDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveLocation}>Save Location</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBenefitDialogOpen} onOpenChange={setIsBenefitDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingBenefit ? 'Edit Benefit' : 'Create New Benefit'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div>
                    <Label htmlFor="benefit-name">Benefit Name</Label>
                    <Input id="benefit-name" value={newBenefitData.name} onChange={e => setNewBenefitData({...newBenefitData, name: e.target.value})} />
                </div>
                 <div>
                    <Label htmlFor="benefit-desc">Description</Label>
                    <Textarea id="benefit-desc" value={newBenefitData.description} onChange={e => setNewBenefitData({...newBenefitData, description: e.target.value})} />
                </div>
                <div>
                    <Label htmlFor="benefit-location">Location</Label>
                    <Select value={newBenefitData.locationId} onValueChange={val => setNewBenefitData({...newBenefitData, locationId: val})}>
                        <SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger>
                        <SelectContent>
                            {locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                    <Label htmlFor="benefit-applies">Applies To</Label>
                    <Select value={newBenefitData.appliesTo} onValueChange={(val: BenefitApplicability) => setNewBenefitData({...newBenefitData, appliesTo: val})}>
                        <SelectTrigger><SelectValue placeholder="Select who it applies to" /></SelectTrigger>
                        <SelectContent>
                            {benefitApplicabilityOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsBenefitDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveBenefit}>Save Benefit</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSchedulingChange} onOpenChange={setIsSchedulingChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule a Change for {selectedEmployee?.fullName}</DialogTitle>
            <DialogDescription>The change will be applied automatically on the effective date.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="change-field">Field to Change</Label>
              <Select value={newScheduledChange.fieldName} onValueChange={(val: keyof Employee) => setNewScheduledChange(p => ({ ...p, fieldName: val, newValue: '' }))}>
                <SelectTrigger><SelectValue placeholder="Select a field" /></SelectTrigger>
                <SelectContent>
                  {employeeFields.map(field => <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="change-value">New Value</Label>
              {renderValueInputForScheduling()}
            </div>
            <div>
              <Label htmlFor="change-date">Effective Date</Label>
               <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !newScheduledChange.effectiveDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newScheduledChange.effectiveDate ? format(newScheduledChange.effectiveDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={newScheduledChange.effectiveDate} onSelect={d => setNewScheduledChange(p => ({ ...p, effectiveDate: d }))} initialFocus />
                    </PopoverContent>
                </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSchedulingChange(false)}>Cancel</Button>
            <Button onClick={handleScheduleChange}>Schedule Change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
