import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, limit } from 'firebase/firestore';

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

    // This is a simplified version. In a real app, you'd fetch employee names.
    // For now, we'll use placeholder names or IDs.
    return snapshot.docs.map(doc => {
        const data = doc.data() as AttendanceRecord;
        return {
            name: `Employee ${data.employeeId.substring(0, 5)}`,
            type: data.type,
            time: data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    });
};
