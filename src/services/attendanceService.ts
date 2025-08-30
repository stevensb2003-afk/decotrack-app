import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, limit, getDoc, doc } from 'firebase/firestore';
import { getEmployeeByEmail } from './employeeService';

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
    where("employeeId", "==", employeeId),
    orderBy("timestamp", "desc"),
    limit(recordLimit)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
};

export const getRecentActivities = async (recordLimit: number = 5): Promise<RecentActivity[]> => {
    const q = query(
        attendanceCollection,
        orderBy("timestamp", "desc"),
        limit(recordLimit)
    );
    const snapshot = await getDocs(q);

    const activities = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data() as AttendanceRecord;
        const employeeDoc = doc(db, 'employees', data.employeeId);
        const employeeSnap = await getDoc(employeeDoc);
        const employeeName = employeeSnap.exists() ? employeeSnap.data().name : `Employee ${data.employeeId.substring(0, 5)}`;
        
        return {
            name: employeeName,
            type: data.type,
            time: data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    }));

    return activities;
};