
export let mockEmployees = [
  { id: 'USR001', name: 'Esther Howard', email: 'esther.howard@example.com', role: 'Developer', status: 'Present' },
  { id: 'USR002', name: 'Jane Cooper', email: 'jane.cooper@example.com', role: 'Designer', status: 'Present' },
  { id: 'USR003', name: 'Cody Fisher', email: 'cody.fisher@example.com', role: 'Manager', status: 'Absent' },
  { id: 'USR004', name: 'Cameron Williamson', email: 'cameron.williamson@example.com', role: 'QA Engineer', status: 'Present' },
  { id: 'USR005', name: 'Brooklyn Simmons', email: 'brooklyn.simmons@example.com', role: 'Developer', status: 'Present' },
  { id: 'USR006', name: 'Wade Warren', email: 'wade.warren@example.com', role: 'Designer', status: 'Absent' },
  { id: 'USR007', name: 'Robert Fox', email: 'robert.fox@example.com', role: 'QA Engineer', status: 'Present' },
];

export const setMockEmployees = (newEmployees: typeof mockEmployees) => {
  mockEmployees = newEmployees;
};


export const recentActivity = [
    { name: "Esther Howard", type: "Entry", time: "09:01 AM" },
    { name: "Jane Cooper", type: "Entry", time: "09:03 AM" },
    { name: "Cody Fisher", type: "Exit", time: "08:55 AM" },
    { name: "Cameron Williamson", type: "Entry", time: "09:05 AM" },
    { name: "Brooklyn Simmons", type: "Entry", time: "09:08 AM" },
];

export type ChangeRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  status: 'pending' | 'approved' | 'rejected';
};


export let mockChangeRequests: ChangeRequest[] = [];

export const setMockChangeRequests = (newRequests: typeof mockChangeRequests) => {
    mockChangeRequests = newRequests;
}
