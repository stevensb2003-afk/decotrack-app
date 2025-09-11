
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from "./user-management";
import AutomationSettings from "./automation-settings";
import GeofencingSettings from "./geofencing-settings";
import AuthSettings from "./auth-settings";
import { Users, Lock, Bot, MapPin } from "lucide-react";

export default function SettingsDashboard() {
  return (
    <Tabs defaultValue="users" className="space-y-4">
      <TabsList>
        <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            System Users
        </TabsTrigger>
        <TabsTrigger value="auth">
            <Lock className="mr-2 h-4 w-4" />
            Authentication
        </TabsTrigger>
        <TabsTrigger value="automation">
            <Bot className="mr-2 h-4 w-4" />
            Automation
        </TabsTrigger>
        <TabsTrigger value="geofencing">
            <MapPin className="mr-2 h-4 w-4" />
            Geofencing
        </TabsTrigger>
      </TabsList>
      <TabsContent value="users" className="mt-4">
        <UserManagement />
      </TabsContent>
      <TabsContent value="auth" className="mt-4">
        <AuthSettings />
      </TabsContent>
      <TabsContent value="automation" className="mt-4">
        <AutomationSettings />
      </TabsContent>
      <TabsContent value="geofencing" className="mt-4">
        <GeofencingSettings />
      </TabsContent>
    </Tabs>
  );
}
