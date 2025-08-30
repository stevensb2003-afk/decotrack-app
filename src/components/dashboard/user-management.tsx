"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, UserPlus, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { setMockEmployees, mockEmployees as currentEmployees } from '@/lib/mock-data';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const initialSystemUsers = [
  { id: '1', name: 'Esther Howard', email: 'esther.howard@example.com', role: 'employee', password: 'password123' },
  { id: '2', name: 'HR Person', email: 'hr@example.com', role: 'hr', password: 'password123' },
  { id: '3', name: 'Manager Person', email: 'manager@example.com', role: 'management', password: 'password123' },
  { id: '4', name: 'Admin Person', email: 'decoinnova24@gmail.com', role: 'admin', password: 'adminpassword' },
  { id: '5', name: 'Jane Cooper', email: 'jane.cooper@example.com', role: 'employee', password: 'password123' },
  { id: '6', name: 'Cody Fisher', email: 'cody.fisher@example.com', role: 'employee', password: 'password123' },
  { id: '7', name: 'Cameron Williamson', email: 'cameron.williamson@example.com', role: 'employee', password: 'password123' },
  { id: '8', name: 'Brooklyn Simmons', email: 'brooklyn.simmons@example.com', role: 'employee', password: 'password123' },
  { id: '9', name: 'Wade Warren', email: 'wade.warren@example.com', role: 'employee', password: 'password123' },
  { id: '10', name: 'Robert Fox', email: 'robert.fox@example.com', role: 'employee', password: 'password123' },
];

type User = typeof initialSystemUsers[0];
type Role = 'employee' | 'hr' | 'management' | 'admin';
const SECURITY_CODE = "D3co.2025";

export default function UserManagement() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState(initialSystemUsers);
  const [isEditing, setIsEditing] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCodePromptOpen, setIsCodePromptOpen] = useState(false);
  const [isPasswordViewOpen, setIsPasswordViewOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
  const [securityCodeInput, setSecurityCodeInput] = useState("");
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: ''});
  const { toast } = useToast();
  
  const handleRoleChange = (userId: string, newRole: Role) => {
    setUsers(users.map(u => u.id === userId ? {...u, role: newRole} : u));
    toast({ title: "Role Updated", description: "User's role has been successfully changed." });
    setIsEditing(null);
  };
  
  const handleCreateUser = () => {
    if(!newUser.email || !newUser.name || !newUser.password || !newUser.role) {
        toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
        return;
    }

    const newUserEntry = {
        id: (users.length + 1).toString(),
        ...newUser,
    } as User;
    
    setUsers([...users, newUserEntry]);

    if (newUser.role === 'employee') {
      const newEmployee = {
        id: `USR${(currentEmployees.length + 1).toString().padStart(3, '0')}`,
        name: newUser.name,
        email: newUser.email,
        role: 'Employee', // Default role for new employee
        status: 'Absent'
      };
      setMockEmployees([...currentEmployees, newEmployee]);
      toast({ title: "User & Employee Created", description: "New user and corresponding employee record have been created." });
    } else {
        toast({ title: "User Created", description: "New user has been created successfully." });
    }

    setIsCreating(false);
    setNewUser({ name: '', email: '', password: '', role: ''});
  };

  const handleViewPasswordClick = (user: User) => {
    setSelectedUserForPassword(user);
    setIsCodePromptOpen(true);
    setSecurityCodeInput("");
  };

  const handleSecurityCodeSubmit = () => {
    if (securityCodeInput === SECURITY_CODE) {
      setIsCodePromptOpen(false);
      setIsPasswordViewOpen(true);
    } else {
      toast({
        title: "Incorrect Security Code",
        description: "The code you entered is invalid.",
        variant: "destructive",
      });
    }
  };


  return (
    <>
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>System Users</CardTitle>
            <CardDescription>Create users and manage their roles within the system.</CardDescription>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                  <Button><UserPlus className="mr-2 h-4 w-4" /> Create User</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                      <Label htmlFor="name-create">Name</Label>
                      <Input id="name-create" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} placeholder="John Doe" />
                      <Label htmlFor="email-create">Email</Label>
                      <Input id="email-create" type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} placeholder="name@example.com" />
                      <Label htmlFor="password-create">Password</Label>
                      <Input id="password-create" type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
                      <Label htmlFor="role-create">Role</Label>
                      <Select onValueChange={(value) => setNewUser({...newUser, role: value})}>
                          <SelectTrigger id="role-create"><SelectValue placeholder="Select a role" /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="hr">HR</SelectItem>
                              <SelectItem value="management">Management</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <DialogFooter>
                      <Button onClick={handleCreateUser}>Create User</Button>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={authUser?.role !== 'admin' && user.role === 'admin'}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsEditing(user)} disabled={user.role === 'admin'}>Edit Role</DropdownMenuItem>
                         {authUser?.role === 'admin' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewPasswordClick(user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Password
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={!!isEditing} onOpenChange={(open) => !open && setIsEditing(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Edit Role for {isEditing?.email}</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label htmlFor="role-edit">Role</Label>
            <Select defaultValue={isEditing?.role} onValueChange={(newRole) => handleRoleChange(isEditing!.id, newRole as Role)}>
              <SelectTrigger id="role-edit"><SelectValue placeholder="Select a role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="management">Management</SelectItem>
                <SelectItem value="admin" disabled>Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCodePromptOpen} onOpenChange={setIsCodePromptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Security Code</DialogTitle>
            <DialogDescription>
              To view this user's password, please enter the administrator security code.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="security-code">Security Code</Label>
            <Input
              id="security-code"
              type="password"
              value={securityCodeInput}
              onChange={(e) => setSecurityCodeInput(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCodePromptOpen(false)}>Cancel</Button>
            <Button onClick={handleSecurityCodeSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isPasswordViewOpen} onOpenChange={setIsPasswordViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Credentials</DialogTitle>
            <DialogDescription>
              These are the credentials for {selectedUserForPassword?.name}.
            </DialogDescription>
          </DialogHeader>
            <Alert>
              <AlertTitle>{selectedUserForPassword?.name}</AlertTitle>
              <AlertDescription>
                <p className="mt-2"><strong>Email:</strong> {selectedUserForPassword?.email}</p>
                <p><strong>Password:</strong> {selectedUserForPassword?.password}</p>
              </AlertDescription>
            </Alert>
          <DialogFooter>
            <Button onClick={() => setIsPasswordViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
