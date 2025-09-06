
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { MoreHorizontal, UserPlus, Eye, Trash2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SystemUser, Role, getAllUsers, createUser, updateUserRole, deleteUser } from '@/services/userService';
import { Employee, getAllEmployees } from '@/services/employeeService';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

const SECURITY_CODE = process.env.NEXT_PUBLIC_ADMIN_SECURITY_CODE;

export default function UserManagement() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isEditing, setIsEditing] = useState<SystemUser | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCodePromptOpen, setIsCodePromptOpen] = useState(false);
  const [isPasswordViewOpen, setIsPasswordViewOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<SystemUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);
  const [securityCodeInput, setSecurityCodeInput] = useState("");
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', role: '' as Role | ''});
  
  const { toast } = useToast();

  const fetchData = async () => {
    const allUsers = await getAllUsers();
    const allEmployees = await getAllEmployees();
    setUsers(allUsers);
    setEmployees(allEmployees);
  };
  
  useEffect(() => {
    fetchData();
  }, []);

  const employeeNameMap = new Map(employees.map(emp => [emp.email, emp.fullName]));
  
  const handleRoleChange = async (userId: string, newRole: Role) => {
    await updateUserRole(userId, newRole);
    toast({ title: "Role Updated", description: "User's role has been successfully changed." });
    setIsEditing(null);
    fetchData();
  };
  
  const handleCreateUser = async () => {
    if(!newUser.email || !newUser.firstName || !newUser.password || !newUser.role) {
        toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
        return;
    }

    const newUserEntry = {
        ...newUser,
    } as Omit<SystemUser, 'id'>;
    
    await createUser(newUserEntry);

    toast({ title: "User Created", description: "New user has been created successfully." });

    setIsCreating(false);
    setNewUser({ firstName: '', lastName: '', email: '', password: '', role: ''});
    fetchData();
  };

  const handleViewPasswordClick = (user: SystemUser) => {
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

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    await deleteUser(userToDelete.id);
    toast({ title: "User Deleted", description: `User ${userToDelete.email} has been deleted.` });
    setUserToDelete(null);
    fetchData();
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
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Non-admin users will automatically have an employee profile created.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                      <div className='grid grid-cols-2 gap-4'>
                          <div>
                            <Label htmlFor="firstName-create">First Name</Label>
                            <Input id="firstName-create" value={newUser.firstName} onChange={(e) => setNewUser({...newUser, firstName: e.target.value})} placeholder="John" />
                          </div>
                          <div>
                            <Label htmlFor="lastName-create">Last Name</Label>
                            <Input id="lastName-create" value={newUser.lastName} onChange={(e) => setNewUser({...newUser, lastName: e.target.value})} placeholder="Doe" />
                          </div>
                      </div>
                      <Label htmlFor="email-create">Email</Label>
                      <Input id="email-create" type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} placeholder="name@example.com" />
                      <Label htmlFor="password-create">Password</Label>
                      <Input id="password-create" type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
                      <Label htmlFor="role-create">Role</Label>
                      <Select onValueChange={(value: Role) => setNewUser({...newUser, role: value})}>
                          <SelectTrigger id="role-create"><SelectValue placeholder="Select a role" /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="hr">HR</SelectItem>
                              <SelectItem value="Manager">Manager</SelectItem>
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
                <TableHead>Password</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{employeeNameMap.get(user.email) || `${user.firstName} ${user.lastName}`}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="font-mono">****</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={authUser?.email === user.email}>
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
                            <DropdownMenuItem onClick={() => setUserToDelete(user)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
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
          <DialogHeader>
            <DialogTitle>Edit Role for {isEditing?.email}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="role-edit">Role</Label>
            <Select defaultValue={isEditing?.role} onValueChange={(newRole) => handleRoleChange(isEditing!.id, newRole as Role)}>
              <SelectTrigger id="role-edit"><SelectValue placeholder="Select a role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
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
              These are the credentials for {employeeNameMap.get(selectedUserForPassword?.email || '')}.
            </DialogDescription>
          </DialogHeader>
            <Alert>
              <AlertTitle>{employeeNameMap.get(selectedUserForPassword?.email || '')}</AlertTitle>
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

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user account for <span className="font-semibold">{userToDelete?.email}</span> and remove their data from our servers.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
