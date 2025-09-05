
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getEmployeeByEmail, updateEmployee, Employee } from '@/services/employeeService';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timestamp } from 'firebase/firestore';

const countries = [
    { value: "CR", label: "Costa Rica" },
    { value: "US", label: "United States" },
    // Add other relevant countries
];

const idTypes: Employee['idType'][] = ['ID Nacional', 'Pasaporte', 'Cédula Extranjero', 'DIMEX'];

export default function SetupProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        idType: 'ID Nacional' as Employee['idType'],
        idNumber: '',
        cellphoneNumber: '',
        nationality: '',
        birthDate: new Date(),
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            getEmployeeByEmail(user.email).then(emp => {
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
                    });
                }
                setIsLoading(false);
            });
        }
    }, [user, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (name: keyof typeof formData, value: string) => {
        setFormData(prev => ({...prev, [name]: value}));
    }

    const handleDateChange = (date: Date | undefined) => {
        if(date) {
            setFormData(prev => ({ ...prev, birthDate: date }));
        }
    }

    const handleSubmit = async () => {
        if (!employee) {
            toast({ title: "Error", description: "Employee data not found.", variant: "destructive" });
            return;
        }

        if (!formData.idNumber || !formData.cellphoneNumber || !formData.nationality) {
            toast({ title: "Missing Information", description: "Please fill out all the required fields.", variant: "destructive" });
            return;
        }

        try {
            await updateEmployee(employee.id, {
                ...formData,
                birthDate: Timestamp.fromDate(formData.birthDate),
                profileComplete: true
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
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" value={formData.firstName} disabled />
                        </div>
                        <div>
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" value={formData.lastName} disabled />
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
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSubmit}>Save and Continue</Button>
                </CardFooter>
            </Card>
        </main>
    );
}
