
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getEmployeeByEmail, updateEmployee, Employee, License } from '@/services/employeeService';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timestamp } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { Location, getAllLocations } from '@/services/locationService';

const countries = [
    { value: "CR", label: "Costa Rica" },
    { value: "US", label: "United States" },
    // Add other relevant countries
];

const idTypes: Employee['idType'][] = ['ID Nacional', 'Pasaporte', 'Cédula Extranjero', 'DIMEX'];
const licenseTypes = ["A1", "A2", "A3", "B1", "B2", "B3", "B4", "C1", "C2", "D1", "D2", "D3", "E1", "E2"];


export default function SetupProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        idType: 'ID Nacional' as Employee['idType'],
        idNumber: '',
        cellphoneNumber: '',
        nationality: '',
        birthDate: new Date(),
        locationId: '',
        licensePermission: false,
        licenses: [] as Omit<License, 'expirationDate'> & { expirationDate: Date | undefined }[],
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                const [emp, locs] = await Promise.all([
                    getEmployeeByEmail(user.email),
                    getAllLocations()
                ]);
                setLocations(locs);

                if (emp) {
                    if(emp.profileComplete) {
                        router.replace('/dashboard'); // Should not be here if profile is complete
                    }
                    setEmployee(emp);
                    setFormData({
                        firstName: emp.firstName || '',
                        lastName: emp.lastName || '',
                        idType: emp.idType || 'ID Nacional',
                        idNumber: emp.idNumber || '',
                        cellphoneNumber: emp.cellphoneNumber || '',
                        nationality: emp.nationality || '',
                        birthDate: emp.birthDate ? emp.birthDate.toDate() : new Date(),
                        locationId: emp.locationId || '',
                        licensePermission: emp.licensePermission || false,
                        licenses: (emp.licenses || []).map(l => ({...l, expirationDate: l.expirationDate.toDate()})),
                    });
                }
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };
    
    const handleLicenseInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        const newLicenses = [...formData.licenses];
        (newLicenses[index] as any)[id] = value;
        setFormData(prev => ({ ...prev, licenses: newLicenses }));
    }
    
    const handleLicenseSelectChange = (index: number, name: keyof License, value: string) => {
        const newLicenses = [...formData.licenses];
        (newLicenses[index] as any)[name] = value;
        setFormData(prev => ({...prev, licenses: newLicenses}));
    }

     const handleLicenseDateChange = (index: number, date: Date | undefined) => {
        const newLicenses = [...formData.licenses];
        newLicenses[index].expirationDate = date;
        setFormData(prev => ({ ...prev, licenses: newLicenses }));
    }


    const handleSelectChange = (name: keyof typeof formData, value: string) => {
        setFormData(prev => ({...prev, [name]: value}));
    }

    const handleDateChange = (date: Date | undefined) => {
        if(date) {
            setFormData(prev => ({ ...prev, birthDate: date }));
        }
    }

    const addLicense = () => {
        setFormData(prev => ({
            ...prev,
            licenses: [...prev.licenses, { type: '', number: '', country: '', expirationDate: undefined }]
        }));
    }

    const removeLicense = (index: number) => {
        const newLicenses = [...formData.licenses];
        newLicenses.splice(index, 1);
        setFormData(prev => ({ ...prev, licenses: newLicenses }));
    }

    const handleSubmit = async () => {
        if (!employee) {
            toast({ title: "Error", description: "Employee data not found.", variant: "destructive" });
            return;
        }

        if (!formData.idNumber || !formData.cellphoneNumber || !formData.nationality || !formData.locationId) {
            toast({ title: "Missing Information", description: "Please fill out all the required fields.", variant: "destructive" });
            return;
        }
        
        const selectedLocation = locations.find(l => l.id === formData.locationId);

        try {
            const finalLicenses = formData.licenses
                .filter(l => l.expirationDate) // Ensure date is not undefined
                .map(l => ({
                    ...l,
                    expirationDate: Timestamp.fromDate(l.expirationDate as Date),
                }));

            await updateEmployee(employee.id, {
                ...formData,
                birthDate: Timestamp.fromDate(formData.birthDate),
                locationName: selectedLocation?.name || '',
                managerName: selectedLocation?.managerName || '',
                licenses: finalLicenses,
                profileComplete: true,
            });
            toast({ title: "Profile Updated", description: "Your information has been saved successfully." });
            router.push('/dashboard');
        } catch (error) {
            console.error("Failed to update profile:", error);
            toast({ title: "Update Failed", description: "Could not save your profile. Please try again.", variant: "destructive" });
        }
    };
    
    if (isLoading) {
        return (
             <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Complete Your Profile</CardTitle>
                    <CardDescription>Welcome! Please complete your employee profile to continue.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[80vh] overflow-y-auto pr-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" value={formData.firstName} onChange={handleInputChange} />
                        </div>
                        <div>
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" value={formData.lastName} onChange={handleInputChange} />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="idType">ID Type</Label>
                            <Select value={formData.idType} onValueChange={(val: Employee['idType']) => handleSelectChange('idType', val)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    {idTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="idNumber">ID Number</Label>
                            <Input id="idNumber" value={formData.idNumber} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="cellphoneNumber">Cellphone</Label>
                            <Input id="cellphoneNumber" value={formData.cellphoneNumber} onChange={handleInputChange} />
                        </div>
                         <div>
                            <Label htmlFor="nationality">Nationality</Label>
                            <Select value={formData.nationality} onValueChange={val => handleSelectChange('nationality', val)}>
                                <SelectTrigger><SelectValue placeholder="Select your nationality"/></SelectTrigger>
                                <SelectContent>
                                    {countries.map(c => <SelectItem key={c.value} value={c.label}>{c.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="birthDate">Birth Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.birthDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.birthDate ? format(formData.birthDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={formData.birthDate} onSelect={handleDateChange} captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear()} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <Label htmlFor="locationId">Work Location</Label>
                            <Select value={formData.locationId} onValueChange={val => handleSelectChange('locationId', val)}>
                                <SelectTrigger><SelectValue placeholder="Select a location"/></SelectTrigger>
                                <SelectContent>
                                    {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center space-x-2">
                           <Switch id="license-permission" checked={formData.licensePermission} onCheckedChange={val => setFormData(prev => ({...prev, licensePermission: val}))} />
                           <Label htmlFor="license-permission">Do you have a driver's license?</Label>
                        </div>

                        {formData.licensePermission && (
                            <div className="space-y-4">
                                {formData.licenses.map((license, index) => (
                                    <div key={index} className="p-4 border rounded-lg space-y-4 relative">
                                        <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeLicense(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor={`type-${index}`}>License Type</Label>
                                                <Select value={license.type} onValueChange={val => handleLicenseSelectChange(index, 'type', val)}>
                                                    <SelectTrigger id={`type-${index}`}><SelectValue placeholder="Select type"/></SelectTrigger>
                                                    <SelectContent>
                                                        {licenseTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="number">License Number</Label>
                                                <Input id="number" value={license.number} onChange={e => handleLicenseInputChange(index, e)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="country">Country</Label>
                                                 <Select value={license.country} onValueChange={val => handleLicenseSelectChange(index, 'country', val)}>
                                                    <SelectTrigger id={`country-${index}`}><SelectValue placeholder="Select country"/></SelectTrigger>
                                                    <SelectContent>
                                                        {countries.map(c => <SelectItem key={c.value} value={c.label}>{c.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                 <Label htmlFor="expirationDate">Expiration Date</Label>
                                                 <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {license.expirationDate ? format(license.expirationDate, "PPP") : <span>Pick a date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar mode="single" selected={license.expirationDate} onSelect={date => handleLicenseDateChange(index, date)} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="outline" onClick={addLicense}><PlusCircle className="mr-2 h-4 w-4"/>Add License</Button>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSubmit}>Save and Continue</Button>
                </CardFooter>
            </Card>
        </main>
    );
}

    
    