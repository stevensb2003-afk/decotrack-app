
"use client";

import UserManagement from "./user-management";
import AutomationSettings from "./automation-settings";
import GeofencingSettings from "./geofencing-settings";

export default function SettingsDashboard() {
  return (
    <div className="space-y-6">
      <UserManagement />
      <AutomationSettings />
      <GeofencingSettings />
    </div>
  );
}
