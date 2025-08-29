import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserCheck, UserX, ArrowRight, ArrowLeft } from "lucide-react";

const kpiData = [
    { title: "Total Employees", value: "125", icon: Users, change: "+5 this month" },
    { title: "Present Employees", value: "110", icon: UserCheck, change: "88% attendance" },
    { title: "Absent Employees", value: "15", icon: UserX, change: "12% absent" },
];

const recentActivity = [
    { name: "John Doe", type: "Entry", time: "09:01 AM" },
    { name: "Jane Smith", type: "Entry", time: "09:03 AM" },
    { name: "Peter Jones", type: "Exit", time: "08:55 AM" },
    { name: "Sam Wilson", type: "Entry", time: "09:05 AM" },
    { name: "Mary Jane", type: "Entry", time: "09:08 AM" },
];

export default function ManagementDashboard() {
  return (
    <div className="grid gap-6">
      <div className="grid md:grid-cols-3 gap-6">
        {kpiData.map((item, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">{item.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Real-time Entry/Exit Report</CardTitle>
          <CardDescription>A live feed of employee attendance activities.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Time</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {recentActivity.map((activity, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium">{activity.name}</TableCell>
                        <TableCell>
                            <span className={`flex items-center gap-2 ${activity.type === 'Entry' ? 'text-primary' : 'text-destructive'}`}>
                            {activity.type === 'Entry' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                            {activity.type}
                            </span>
                        </TableCell>
                        <TableCell>{activity.time}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
