"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Employee, getEmployeeByEmail, updateEmployee } from '@/services/employeeService';
import { createChangeRequest, getPendingRequestForEmployee } from '@/services/changeRequestService';
import { updateUserPassword } from '@/services/userService';
import { Camera } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: '' });
  const [pendingRequest, setPendingRequest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
        if (user) {
            setIsLoading(true);
            const employee = await getEmployeeByEmail(user.email);
            if (employee) {
                setEmployeeData(employee);
                setFormData({ name: employee.name, email: employee.email, role: employee.role });
                setAvatarUrl(`https://i.pravatar.cc/150?u=${employee.email}`);
                const hasPending = await getPendingRequestForEmployee(employee.id);
                setPendingRequest(hasPending);
            }
            setIsLoading(false);
        }
    };
    fetchProfileData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmitRequest = async () => {
    if (!employeeData) return;

    const changes: { fieldName: string, oldValue: string, newValue: string }[] = [];

    if (formData.name !== employeeData.name) {
      changes.push({ fieldName: 'Name', oldValue: employeeData.name, newValue: formData.name });
    }
    if (formData.email !== employeeData.email) {
      changes.push({ fieldName: 'Email', oldValue: employeeData.email, newValue: formData.email });
    }

    if (changes.length === 0) {
      toast({ title: "No Changes", description: "You haven't made any changes to your information.", variant: "destructive" });
      return;
    }
    
    for (const change of changes) {
        await createChangeRequest({
            employeeId: employeeData.id,
            employeeName: employeeData.name,
            fieldName: change.fieldName,
            oldValue: change.oldValue,
            newValue: change.newValue,
            status: 'pending',
        });
    }

    toast({
      title: "Request Submitted",
      description: "Your information change request has been submitted for approval.",
    });
    setIsEditing(false);
    setPendingRequest(true);
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (user) {
      await updateUserPassword(user.id, newPassword);
      toast({ title: "Password Changed", description: "Your password has been updated successfully." });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleAvatarClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        toast({ title: "Profile Picture Updated", description: "Your new picture has been set locally." });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  if (!employeeData) {
    return <div>Could not find employee profile.</div>;
  }

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
            <div className="flex items-center gap-4">
                 <div className="relative group">
                    <Avatar className="h-20 w-20 cursor-pointer" onClick={handleAvatarClick}>
                        <AvatarImage data-ai-hint="profile avatar" src={avatarUrl} />
                        <AvatarFallback>{getInitials(employeeData.name)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleAvatarClick}>
                        <Camera className="text-white h-8 w-8" />
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
                <div>
                    <CardTitle className="text-3xl">{employeeData.name}</CardTitle>
                    <CardDescription className="text-lg">{employeeData.role}</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4">
                <div className="grid grid-cols-2">
                    <Label htmlFor="employee-id">Employee ID</Label>
                    <p id="employee-id">{employeeData.id}</p>
                </div>
                 <div className="grid grid-cols-2">
                    <Label htmlFor="status">Current Status</Label>
                    <p id="status">{employeeData.status}</p>
                </div>
            </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>View and request changes to your personal details.</CardDescription>
            </div>
            {!isEditing && (
                <Button onClick={() => setIsEditing(true)} disabled={pendingRequest || user?.role === 'admin'}>
                    {pendingRequest ? "Request Pending" : (user?.role === 'admin' ? "Admin Info Managed by HR" : "Request Edit")}
                </Button>
            )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={formData.name} onChange={handleInputChange} disabled={!isEditing} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={handleInputChange} disabled={!isEditing} />
            </div>
             <div>
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={formData.role} disabled />
            </div>
            {isEditing && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSubmitRequest}>Submit for Approval</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handlePasswordChange}>Change Password</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
