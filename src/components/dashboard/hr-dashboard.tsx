
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserPlus, Check, X, Pencil, Trash2, CalendarIcon, Camera, Building, Filter, FileText, Gift, Upload, CalendarClock, Play, PlusCircle } from 'lucide-react';
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
import { Employee, License, getAllEmployees, createEmployee, updateEmployee, getEmployeeSnapshot } from '@/services/employeeService';
import { ScheduledChange, createScheduledChanges, getScheduledChangesForEmployee, applyScheduledChanges, createScheduledChange, cancelScheduledChange, getAllScheduledChanges } from '@/services/scheduledChangeService';
import { ChangeRequest, getPendingChangeRequests, updateChangeRequestStatus } from '@/services/changeRequestService';
import { Switch } from '../ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format, differenceInYears, differenceInMonths, parseISO, isSameDay, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import { updateUserPassword } from '@/services/userService';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Location, createLocation, getAllLocations, updateLocation } from '@/services/locationService';
import { Benefit, createBenefit, getAllBenefits, updateBenefit, deleteBenefit, BenefitApplicability } from '@/services/benefitService';
import { Textarea } from '../ui/textarea';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '../ui/dropdown-menu';
import LocationMap from './location-map';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { APIProvider } from '@vis.gl/react-google-maps';

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
    profileComplete: false,
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
    { value_name: "SL", label: "Sierra Leone" },
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

const employeeFields: { value: keyof Employee; label: string; inputType: 'text' | 'number' | 'select' | 'date' }[] = [
    { value: 'firstName', label: 'First Name', inputType: 'text' },
    { value: 'lastName', label: 'Last Name', inputType: 'text' },
    { value: 'email', label: 'Email', inputType: 'text' },
    { value: 'role', label: 'Role', inputType: 'select' },
    { value: 'salary', label: 'Salary', inputType: 'number' },
    { value: 'employmentType', label: 'Employment Type', inputType: 'select' },
    { value: 'salaryType', label: 'Salary Type', inputType: 'select' },
    { value: 'status', label: 'Status', inputType: 'select' },
    { value: 'locationId', label: 'Location', inputType: 'select' },
    { value: 'nationality', label: 'Nationality', inputType: 'select' },
    { value: 'idNumber', label: 'ID Number', inputType: 'text' },
    { value: 'cellphoneNumber', label: 'Cellphone Number', inputType: 'text' },
    { value: 'birthDate', label: 'Birth Date', inputType: 'date' },
];

const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-base">{value || 'N/A'}</p>
    </div>
);


export default function HRDashboard() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [scheduledChanges, setScheduledChanges] = useState<ScheduledChange[]>([]);
  const [allPendingChanges, setAllPendingChanges] = useState<ScheduledChange[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);

  const [isCreateDialogOpen, setCreateIsDialogOpen] = useState(false);
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeSnapshot, setEmployeeSnapshot] = useState<Employee | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [isSchedulingChange, setIsSchedulingChange] = useState(false);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);

  const [newEmployeeData, setNewEmployeeData] = useState<Omit<Employee, 'id' | 'fullName'>>(initialNewEmployeeData);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [newLocationData, setNewLocationData] = useState<Partial<Location>>({ name: '', managerId: '', address: '', latitude: 0, longitude: 0});
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterEmployee, setFilterEmployee] = useState('all');

  const [isBenefitDialogOpen, setIsBenefitDialogOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [newBenefitData, setNewBenefitData] = useState<Omit<Benefit, 'id' | 'locationName'>>({ name: '', description: '', locationId: '', appliesTo: 'All' });

  const [newScheduledChanges, setNewScheduledChanges] = useState<{ fieldName: keyof Employee | ''; newValue: any }[]>([{ fieldName: '', newValue: '' }]);
  const [newChangeEffectiveDate, setNewChangeEffectiveDate] = useState<Date | undefined>(undefined);
  
  const [effectiveDates, setEffectiveDates] = useState<Date[]>([]);

  const [requestToApprove, setRequestToApprove] = useState<ChangeRequest | null>(null);
  const [approvalEffectiveDate, setApprovalEffectiveDate] = useState<Date | undefined>(new Date());

  const { toast } = useToast();

  const handleLocationMapChange = useCallback((loc: Partial<Location>) => {
    setNewLocationData(prev => ({...prev, ...loc}));
  }, []);

  const fetchData = async () => {
      const emps = await getAllEmployees();
      const locs = await getAllLocations();
      const bens = await getAllBenefits();
      const reqs = await getPendingChangeRequests();
      const allChanges = await getAllScheduledChanges();

      const employeeMap = new Map(emps.map(e => [e.id, e.fullName]));
      const changesWithNames = allChanges.map(c => ({
        ...c,
        employeeName: employeeMap.get(c.employeeId) || 'Unknown Employee'
      }));

      setEmployees(emps);
      setLocations(locs);
      setBenefits(bens);
      setChangeRequests(reqs);
      setAllPendingChanges(changesWithNames.filter(c => c.status === 'pending'));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewDetailsClick = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeSnapshot(employee);
    const changes = await getScheduledChangesForEmployee(employee.id);
    const uniqueDates = Array.from(new Set(changes.filter(c => c.status === 'applied').map(c => c.effectiveDate.toDate().toISOString())))
                           .map(dateStr => new Date(dateStr))
                           .sort((a,b) => b.getTime() - a.getTime());
    setEffectiveDates(uniqueDates);
    setScheduledChanges(changes);
    setIsDetailViewOpen(true);
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

  const canEdit = user?.role === 'admin' || user?.role === 'hr';

  const licenseTypes = ["A1", "A2", "A3", "B1", "B2", "B3", "B4", "C1", "C2", "D1", "D2", "D3", "E1", "E2"];
  const employeeRoles: Employee['role'][] = ["Cajero", "Chofer", "Vendedor", "Recursos Humanos", "Contabilidad", "Marketing", "Manager"];
  const employmentTypes: Employee['employmentType'][] = ["Full time", "Part time", "Practicant", "n/a"];
  const salaryTypes: Employee['salaryType'][] = ["Hourly", "Salary", "Profesional Services"];
  const statusTypes: Employee['status'][] = ["Active", "LOA", "Terminated"];

  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleLocationSelect = (locationId: string, isNew: boolean, changeIndex?: number) => {
      const location = locations.find(l => l.id === locationId);
      if (!location) return;

      if(changeIndex !== undefined) {
        const updatedChanges = [...newScheduledChanges];
        updatedChanges[changeIndex].newValue = locationId;
        setNewScheduledChanges(updatedChanges);
      } else if(isNew) {
          setNewEmployeeData(prev => ({
              ...prev,
              locationId: location.id,
              locationName: location.name,
              managerName: location.managerName || 'N/A'
          }));
      }
  }

  const handleSaveLocation = async () => {
    if (!newLocationData.name) {
        toast({title: "Location name is required", variant: "destructive"});
        return;
    }
    const manager = employees.find(e => e.id === newLocationData.managerId);

    const locationPayload: Partial<Location> = {
        name: newLocationData.name,
        managerId: manager?.id || '',
        managerName: manager?.fullName || '',
        address: newLocationData.address || '',
    };
    
    if (newLocationData.latitude && newLocationData.longitude) {
        locationPayload.latitude = newLocationData.latitude;
        locationPayload.longitude = newLocationData.longitude;
    }

    if (editingLocation) {
        await updateLocation(editingLocation.id, locationPayload);
        toast({title: "Location Updated"});
    } else {
        await createLocation(locationPayload as Omit<Location, 'id'>);
        toast({title: "Location Created"});
    }
    
    setNewLocationData({ name: '', managerId: '', address: '', latitude: 0, longitude: 0});
    setEditingLocation(null);
    setIsLocationDialogOpen(false);
    fetchData();
  };
  
  const handleOpenLocationDialog = (location: Location | null) => {
    setEditingLocation(location);
    setNewLocationData(location || { name: '', managerId: '', address: '', latitude: 0, longitude: 0 });
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
    if (!hireDate) return 'N/A';
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

  const handleScheduleChanges = async () => {
    if (!selectedEmployee || !newChangeEffectiveDate || newScheduledChanges.some(c => !c.fieldName)) {
        toast({ title: "Missing fields", description: "All change fields and an effective date are required.", variant: "destructive" });
        return;
    }

    const today = startOfDay(new Date());
    if (startOfDay(newChangeEffectiveDate) < today) {
        toast({ title: "Invalid Date", description: "Effective date cannot be in the past.", variant: "destructive" });
        return;
    }

    const validChanges = newScheduledChanges.filter(c => c.fieldName);
    if(validChanges.length === 0) {
        toast({ title: "No Changes", description: "Please add at least one field to change.", variant: "destructive" });
        return;
    }

    await createScheduledChanges(selectedEmployee.id, validChanges, newChangeEffectiveDate);

    toast({ title: "Changes Scheduled", description: "The employee data changes have been scheduled." });
    setIsSchedulingChange(false);
    setNewScheduledChanges([{ fieldName: '', newValue: '' }]);
    setNewChangeEffectiveDate(undefined);
    // Refetch changes for the employee
    const changes = await getScheduledChangesForEmployee(selectedEmployee.id);
    setScheduledChanges(changes);
    fetchData(); // Refetch all data to update global list
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

  const handleEffectiveDateChange = (dateISO: string) => {
    if (!selectedEmployee) return;
    
    // The snapshot logic has been simplified. We always show the current data.
    // The dropdown is kept for potential future re-implementation of a full audit log.
    if (dateISO === 'current') {
        setEmployeeSnapshot(selectedEmployee);
    } else {
        // In a full implementation, you would call `getEmployeeSnapshot` here.
        // For now, we just show a toast to indicate the feature is simplified.
        toast({
            title: "Viewing Current Data",
            description: "Historical view is not fully implemented. Showing current employee data.",
        });
        setEmployeeSnapshot(selectedEmployee);
    }
  }

  const addChangeField = () => {
      setNewScheduledChanges([...newScheduledChanges, { fieldName: '', newValue: '' }]);
  };

  const removeChangeField = (index: number) => {
      const updatedChanges = [...newScheduledChanges];
      updatedChanges.splice(index, 1);
      setNewScheduledChanges(updatedChanges);
  };
  
  const handleScheduledChangeValue = (index: number, value: any) => {
        const updatedChanges = [...newScheduledChanges];
        updatedChanges[index].newValue = value;
        setNewScheduledChanges(updatedChanges);
  };
  
  const handleScheduledChangeField = (index: number, fieldName: keyof Employee) => {
        const updatedChanges = [...newScheduledChanges];
        updatedChanges[index].fieldName = fieldName;
        updatedChanges[index].newValue = ''; // Reset value when field changes
        setNewScheduledChanges(updatedChanges);
  };


  const renderValueInputForScheduling = (change: {fieldName: keyof Employee | '', newValue: any}, index: number) => {
    const field = employeeFields.find(f => f.value === change.fieldName);
    if (!field) return null;

    switch (field.value) {
        case 'role':
            return (
                <Select value={change.newValue} onValueChange={val => handleScheduledChangeValue(index, val)}>
                    <SelectTrigger><SelectValue placeholder="Select new role" /></SelectTrigger>
                    <SelectContent>{employeeRoles.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
            );
        case 'employmentType':
             return (
                <Select value={change.newValue} onValueChange={val => handleScheduledChangeValue(index, val)}>
                    <SelectTrigger><SelectValue placeholder="Select new employment type" /></SelectTrigger>
                    <SelectContent>{employmentTypes.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
            );
        case 'salaryType':
             return (
                <Select value={change.newValue} onValueChange={val => handleScheduledChangeValue(index, val)}>
                    <SelectTrigger><SelectValue placeholder="Select new salary type" /></SelectTrigger>
                    <SelectContent>{salaryTypes.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
            );
        case 'status':
             return (
                <Select value={change.newValue} onValueChange={val => handleScheduledChangeValue(index, val)}>
                    <SelectTrigger><SelectValue placeholder="Select new status" /></SelectTrigger>
                    <SelectContent>{statusTypes.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
            );
        case 'locationId':
             return (
                 <Select value={change.newValue} onValueChange={val => handleLocationSelect(val, false, index)}>
                    <SelectTrigger><SelectValue placeholder="Select new location" /></SelectTrigger>
                    <SelectContent>{locations.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
                </Select>
            );
         case 'nationality':
             return (
                <Select value={change.newValue} onValueChange={val => handleScheduledChangeValue(index, val)}>
                    <SelectTrigger><SelectValue placeholder="Select new nationality" /></SelectTrigger>
                    <SelectContent>{countries.map(o => <SelectItem key={o.value} value={o.label}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
             );
        case 'salary':
            return <Input type="number" value={change.newValue} onChange={e => handleScheduledChangeValue(index, parseFloat(e.target.value) || 0)} />;
        case 'birthDate':
            return (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {change.newValue ? format(change.newValue, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={change.newValue} onSelect={d => handleScheduledChangeValue(index, d)} initialFocus />
                    </PopoverContent>
                </Popover>
            );
        default:
            return <Input value={change.newValue} onChange={e => handleScheduledChangeValue(index, e.target.value)} />;
    }
  };
  
  const getChangeValueLabel = (change: ScheduledChange): string => {
    if (change.fieldName === 'locationId') {
        return locations.find(l => l.id === change.newValue)?.name || change.newValue;
    }
    if (['birthDate', 'hireDate'].includes(change.fieldName) && change.newValue instanceof Timestamp) {
        return format(change.newValue.toDate(), "PPP");
    }
    if (typeof change.newValue === 'string') {
        return change.newValue;
    }
    if(typeof change.newValue === 'number') {
        return change.newValue.toString();
    }
    return JSON.stringify(change.newValue);
  };

  const getAvailableFieldsForScheduling = (currentIndex: number) => {
    const usedFields = new Set(newScheduledChanges.map((c, i) => i === currentIndex ? null : c.fieldName).filter(Boolean));
    return employeeFields.filter(f => !usedFields.has(f.value) || newScheduledChanges[currentIndex].fieldName === f.value);
  };


  const handleApproveRequest = async () => {
    if (!requestToApprove || !approvalEffectiveDate) return;
    
    // 1. Create a ScheduledChange
    const changeToSchedule = {
        fieldName: requestToApprove.fieldName as keyof Employee,
        newValue: requestToApprove.newValue
    };
    await createScheduledChange(requestToApprove.employeeId, changeToSchedule, approvalEffectiveDate);
    
    // 2. Update the original request status
    await updateChangeRequestStatus(requestToApprove.id, 'approved');

    toast({title: "Request Approved & Scheduled", description: "The change has been scheduled for the effective date."});
    setRequestToApprove(null);
    setApprovalEffectiveDate(new Date());
    fetchData(); // Refresh list
  };

  const handleRejectRequest = async (requestId: string) => {
    await updateChangeRequestStatus(requestId, 'rejected');
    toast({title: "Request Rejected", variant: "destructive"});
    fetchData();
  };

  const handleCancelScheduledChange = async (changeId: string) => {
    await cancelScheduledChange(changeId);
    toast({title: "Change Cancelled", description: "The scheduled change has been cancelled."});
    fetchData(); // Refetch global list
    if (selectedEmployee) {
        const changes = await getScheduledChangesForEmployee(selectedEmployee.id);
        setScheduledChanges(changes);
    }
  }


  return (
    <div className="space-y-6">
      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="requests">Change Requests</TabsTrigger>
            <TabsTrigger value="scheduledChanges">Scheduled Changes</TabsTrigger>
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
                                <TableHead>Address</TableHead>
                                <TableHead>Manager</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {locations.map(loc => (
                                <TableRow key={loc.id}>
                                    <TableCell>{loc.name}</TableCell>
                                    <TableCell>{loc.address || 'N/A'}</TableCell>
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
        <TabsContent value="requests">
            <Card>
                <CardHeader>
                    <CardTitle>Employee Change Requests</CardTitle>
                    <CardDescription>Approve or reject data change requests submitted by employees.</CardDescription>
                </CardHeader>
                <CardContent>
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
                            {changeRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>{req.employeeName}</TableCell>
                                    <TableCell>{req.fieldName}</TableCell>
                                    <TableCell>{req.oldValue}</TableCell>
                                    <TableCell>{req.newValue}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button size="icon" variant="outline" className="h-8 w-8 text-green-600" onClick={() => setRequestToApprove(req)}><Check className="h-4 w-4" /></Button>
                                        <Button size="icon" variant="outline" className="h-8 w-8 text-red-600" onClick={() => handleRejectRequest(req.id)}><X className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {changeRequests.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No pending change requests.</p>}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="scheduledChanges">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                    <CardTitle>Scheduled Changes Runner</CardTitle>
                    <CardDescription>Changes are applied automatically each night. You can also run the process manually.</CardDescription>
                    </div>
                    <Button onClick={handleRunApplyChanges} disabled={isApplyingChanges}>
                        <Play className="mr-2 h-4 w-4" />
                        {isApplyingChanges ? 'Applying...' : 'Apply Pending Changes'}
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Effective Date</TableHead>
                                <TableHead>Employee</TableHead>
                                <TableHead>Field</TableHead>
                                <TableHead>New Value</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allPendingChanges.map(change => (
                                <TableRow key={change.id}>
                                    <TableCell>{format(change.effectiveDate.toDate(), "PPP")}</TableCell>
                                    <TableCell>{(change as any).employeeName}</TableCell>
                                    <TableCell>{change.fieldName}</TableCell>
                                    <TableCell>{getChangeValueLabel(change)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleCancelScheduledChange(change.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {allPendingChanges.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No pending changes for any employee.</p>}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader className="flex-row items-center justify-between pr-10">
            <div className='flex items-center gap-4'>
                <Avatar className="h-12 w-12">
                    <AvatarImage src={employeeSnapshot?.avatarUrl || ''} alt={employeeSnapshot?.fullName} />
                    <AvatarFallback>{getInitials(employeeSnapshot?.fullName)}</AvatarFallback>
                </Avatar>
                <DialogTitle>Details for {employeeSnapshot?.fullName}</DialogTitle>
            </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">View History</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Effective Dates</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => handleEffectiveDateChange('current')}>Current</DropdownMenuItem>
                    {effectiveDates.map(date => (
                        <DropdownMenuItem key={date.toISOString()} onSelect={() => handleEffectiveDateChange(date.toISOString())}>
                            {format(date, 'PPP')}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
          </DialogHeader>
          {employeeSnapshot && (
             <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="changes">Scheduled Changes</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                    <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                            <DetailItem label="Full Name" value={employeeSnapshot.fullName} />
                            <DetailItem label="Email" value={employeeSnapshot.email} />
                            <DetailItem label="Role" value={employeeSnapshot.role} />
                            <DetailItem label="Status" value={employeeSnapshot.status} />

                            <DetailItem label="ID Type" value={employeeSnapshot.idType} />
                            <DetailItem label="ID Number" value={employeeSnapshot.idNumber} />
                            <DetailItem label="Cellphone" value={employeeSnapshot.cellphoneNumber} />
                            <DetailItem label="Nationality" value={employeeSnapshot.nationality} />

                            <DetailItem label="Birth Date" value={employeeSnapshot.birthDate ? format(employeeSnapshot.birthDate.toDate(), "PPP") : 'N/A'} />
                            <DetailItem label="Hire Date" value={employeeSnapshot.hireDate ? format(employeeSnapshot.hireDate.toDate(), "PPP") : 'N/A'} />
                            <DetailItem label="Seniority" value={calculateSeniority(employeeSnapshot.hireDate)} />
                            <DetailItem label="Manager" value={employeeSnapshot.managerName} />
                            
                            <DetailItem label="Location" value={employeeSnapshot.locationName} />
                            <DetailItem label="Employment Type" value={employeeSnapshot.employmentType} />
                            <DetailItem label="Salary Type" value={employeeSnapshot.salaryType} />
                            <DetailItem label="Salary" value={new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(employeeSnapshot.salary || 0)} />
                        </div>
                        
                        {employeeSnapshot.licensePermission && employeeSnapshot.licenses && employeeSnapshot.licenses.length > 0 && (
                            <div className="space-y-2 pt-4">
                                <h4 className="text-base font-semibold text-muted-foreground">Driver's Licenses</h4>
                                <Table className="mt-2">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Number</TableHead>
                                            <TableHead>Country</TableHead>
                                            <TableHead>Expiration</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {employeeSnapshot.licenses.map((license, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{license.type}</TableCell>
                                                <TableCell>{license.number}</TableCell>
                                                <TableCell>{license.country}</TableCell>
                                                <TableCell>{license.expirationDate ? format(license.expirationDate.toDate(), "PPP") : 'N/A'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
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
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {scheduledChanges.filter(c => c.status === 'pending').map(change => (
                                    <TableRow key={change.id}>
                                        <TableCell>{format(change.effectiveDate.toDate(), "PPP")}</TableCell>
                                        <TableCell>{change.fieldName}</TableCell>
                                        <TableCell>{getChangeValueLabel(change)}</TableCell>
                                        <TableCell>
                                             <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800`}>
                                                {change.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleCancelScheduledChange(change.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         {scheduledChanges.filter(c => c.status === 'pending').length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No scheduled changes for this employee.</p>}
                    </div>
                </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
      
       <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>{editingLocation ? "Edit Location" : "Add New Location"}</DialogTitle>
            </DialogHeader>
            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="location-name">Location Name</Label>
                            <Input id="location-name" value={newLocationData.name || ''} onChange={e => setNewLocationData({...newLocationData, name: e.target.value})} placeholder="e.g., Downtown Store"/>
                        </div>
                        <div>
                            <Label htmlFor="location-manager">Assign Manager</Label>
                            <Select value={newLocationData.managerId} onValueChange={val => setNewLocationData({...newLocationData, managerId: val})}>
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
                    <LocationMap
                        location={newLocationData}
                        onLocationChange={handleLocationMapChange}
                    />
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => setIsLocationDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveLocation}>Save Location</Button>
                </DialogFooter>
            </APIProvider>
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
            <DialogTitle>Schedule Changes for {selectedEmployee?.fullName}</DialogTitle>
            <DialogDescription>The changes will be applied automatically on the effective date.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
            <div className='sticky top-0 bg-background pt-2 pb-4'>
                <Label htmlFor="change-date">Effective Date</Label>
                <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !newChangeEffectiveDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {newChangeEffectiveDate ? format(newChangeEffectiveDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={newChangeEffectiveDate} onSelect={setNewChangeEffectiveDate} initialFocus />
                        </PopoverContent>
                </Popover>
            </div>

            {newScheduledChanges.map((change, index) => (
                 <div key={index} className="flex items-end gap-2 border-t pt-4">
                    <div className="grid gap-2 flex-grow">
                        <div>
                            <Label htmlFor={`change-field-${index}`}>Field to Change</Label>
                            <Select 
                                value={change.fieldName || undefined} 
                                onValueChange={(val: keyof Employee) => handleScheduledChangeField(index, val)}
                            >
                                <SelectTrigger><SelectValue placeholder="Select a field" /></SelectTrigger>
                                <SelectContent>
                                    {getAvailableFieldsForScheduling(index).map(field => field.value && <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor={`change-value-${index}`}>New Value</Label>
                            {renderValueInputForScheduling(change, index)}
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeChangeField(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={addChangeField}><PlusCircle className="mr-2 h-4 w-4"/>Add Field</Button>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSchedulingChange(false)}>Cancel</Button>
            <Button onClick={handleScheduleChanges}>Schedule Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       <Dialog open={!!requestToApprove} onOpenChange={() => setRequestToApprove(null)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Approve Change Request</DialogTitle>
                    <DialogDescription>
                        Select an effective date to schedule this change for {requestToApprove?.employeeName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p><strong>Field:</strong> {requestToApprove?.fieldName}</p>
                    <p><strong>New Value:</strong> {requestToApprove?.newValue}</p>
                    <div>
                         <Label htmlFor="effective-date-approval">Effective Date</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !approvalEffectiveDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {approvalEffectiveDate ? format(approvalEffectiveDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={approvalEffectiveDate} onSelect={setApprovalEffectiveDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setRequestToApprove(null)}>Cancel</Button>
                    <Button onClick={handleApproveRequest}>Approve and Schedule</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
