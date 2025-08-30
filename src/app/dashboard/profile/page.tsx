"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { mockEmployees, mockChangeRequests, setMockChangeRequests } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employeeData, setEmployeeData] = useState<(typeof mockEmployees)[0] | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: '' });
  const [pendingRequest, setPendingRequest] = useState(false);


  useEffect(() => {
    if (user) {
      const employee = mockEmployees.find(e => e.email === user.email);
      if (employee) {
        setEmployeeData(employee);
        setFormData({ name: employee.name, email: employee.email, role: employee.role });
      }
      const existingRequest = mockChangeRequests.some(req => req.employeeId === employee?.id && req.status === 'pending');
      setPendingRequest(existingRequest);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmitRequest = () => {
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
    
    const newRequests = changes.map((change, index) => ({
        id: `REQ${Date.now()}${index}`,
        employeeId: employeeData.id,
        employeeName: employeeData.name,
        fieldName: change.fieldName,
        oldValue: change.oldValue,
        newValue: change.newValue,
        status: 'pending' as const,
    }));

    setMockChangeRequests([...mockChangeRequests, ...newRequests]);

    toast({
      title: "Request Submitted",
      description: "Your information change request has been submitted for approval.",
    });
    setIsEditing(false);
    setPendingRequest(true);
  };
  
  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!employeeData) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage data-ai-hint="profile avatar" src={`https://i.pravatar.cc/150?u=${employeeData.email}`} />
                    <AvatarFallback>{getInitials(employeeData.name)}</AvatarFallback>
                </Avatar>
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
                <Button onClick={() => setIsEditing(true)} disabled={pendingRequest}>
                    {pendingRequest ? "Request Pending" : "Request Edit"}
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
    </div>
  );
}