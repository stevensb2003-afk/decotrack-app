"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, UserPlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const initialSystemUsers = [
  { id: '1', email: 'employee@example.com', role: 'employee' },
  { id: '2', email: 'hr@example.com', role: 'hr' },
  { id: '3', email: 'manager@example.com', role: 'management' },
  { id: '4', email: 'decoinnova24@gmail.com', role: 'admin' },
];

type User = typeof initialSystemUsers[0];
type Role = 'employee' | 'hr' | 'management' | 'admin';

export default function UserManagement() {
  const [users, setUsers] = useState(initialSystemUsers);
  const [isEditing, setIsEditing] = useState<User | null>(null);
  const { toast } = useToast();
  
  const handleRoleChange = (userId: string, newRole: Role) => {
    setUsers(users.map(u => u.id === userId ? {...u, role: newRole} : u));
    toast({ title: "Role Updated", description: "User's role has been successfully changed." });
    setIsEditing(null);
  };
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>System Users</CardTitle>
            <CardDescription>Create users and manage their roles within the system.</CardDescription>
          </div>
          <Dialog>
              <DialogTrigger asChild>
                  <Button><UserPlus className="mr-2 h-4 w-4" /> Create User</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                      <Label htmlFor="email-create">Email</Label>
                      <Input id="email-create" type="email" placeholder="name@example.com" />
                      <Label htmlFor="password-create">Password</Label>
                      <Input id="password-create" type="password" />
                      <Label htmlFor="role-create">Role</Label>
                      <Select>
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
                      <Button onClick={() => toast({ title: "User Created", description: "New user has been created successfully." })}>Create User</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={user.role === 'admin'}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsEditing(user)}>Edit Role</DropdownMenuItem>
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
    </>
  );
}
