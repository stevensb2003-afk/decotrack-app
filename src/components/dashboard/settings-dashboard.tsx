
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import UserManagement from './user-management';
import AutomationSettings from './automation-settings';

export default function SettingsDashboard() {
  return (
    <Tabs defaultValue="users">
      <TabsList>
        <TabsTrigger value="users">User Management</TabsTrigger>
        <TabsTrigger value="automation">Automation Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="users">
        <UserManagement />
      </TabsContent>
      <TabsContent value="automation">
        <AutomationSettings />
      </TabsContent>
    </Tabs>
  );
}
