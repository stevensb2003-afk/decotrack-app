
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, limit, getDoc, doc } from 'firebase/firestore';
import { Employee, getAllEmployees } from './employeeService';

export type AttendanceRecord = {
  id?: string;
  employeeId: string;
  type: 'Entry' | 'Exit';
  timestamp: Timestamp;
};

export type RecentActivity = {
    name: string;
    type: 'Entry' | 'Exit';
    time: string;
}

const attendanceCollection = collection(db, 'attendance');

export const markAttendance = async (record: Omit<AttendanceRecord, 'id'>) => {
  await addDoc(attendanceCollection, record);
};

export const getEmployeeAttendance = async (employeeId: string, recordLimit: number = 5): Promise<AttendanceRecord[]> => {
  const q = query(
    attendanceCollection, 
    where("employeeId", "==", employeeId)
  );
  const snapshot = await getDocs(q);
  const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
  
  // Sort by timestamp descending in code
  records.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

  return records.slice(0, recordLimit);
};

export const getRecentActivities = async (recordLimit: number = 5, allEmployees?: Employee[]): Promise<RecentActivity[]> => {
    const employees = allEmployees || await getAllEmployees();
    const employeeMap = new Map(employees.map(e => [e.id, e.name]));

    const q = query(
        attendanceCollection,
        orderBy("timestamp", "desc"),
        limit(recordLimit)
    );
    const snapshot = await getDocs(q);

    const activities = snapshot.docs.map((d) => {
        const data = d.data() as AttendanceRecord;
        const employeeName = employeeMap.get(data.employeeId) || `Employee ${data.employeeId.substring(0, 5)}`;
        
        return {
            name: employeeName,
            type: data.type,
            time: data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    });

    return activities;
};
