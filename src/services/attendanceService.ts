
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, limit } from 'firebase/firestore';
import { Employee, getAllEmployees } from './employeeService';
import { format } from 'date-fns';

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
};

export type DailyAttendanceSummary = {
  employeeId: string;
  employeeName: string;
  date: string; // "PPP" format
  clockIn: string | null; // "p" format
  clockOut: string | null; // "p" format
};


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

export const getDailyAttendanceSummary = async (daysLimit: number = 5, allEmployees?: Employee[]): Promise<DailyAttendanceSummary[]> => {
    const employees = allEmployees || await getAllEmployees();
    const employeeMap = new Map(employees.map(e => [e.id, e.name]));

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (daysLimit -1));
    startDate.setHours(0, 0, 0, 0);

    const q = query(
        attendanceCollection,
        where("timestamp", ">=", startDate),
        orderBy("timestamp", "asc")
    );
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(doc => doc.data() as AttendanceRecord);

    const dailyGroups: { [key: string]: AttendanceRecord[] } = {};

    records.forEach(record => {
        const dateKey = format(record.timestamp.toDate(), 'yyyy-MM-dd');
        const groupKey = `${record.employeeId}-${dateKey}`;
        if (!dailyGroups[groupKey]) {
            dailyGroups[groupKey] = [];
        }
        dailyGroups[groupKey].push(record);
    });

    const summary: DailyAttendanceSummary[] = Object.values(dailyGroups).map(group => {
        const firstRecord = group[0];
        const entries = group.filter(r => r.type === 'Entry');
        const exits = group.filter(r => r.type === 'Exit');

        const clockIn = entries.length > 0 ? format(entries[0].timestamp.toDate(), 'p') : null;
        const clockOut = exits.length > 0 ? format(exits[exits.length - 1].timestamp.toDate(), 'p') : null;

        return {
            employeeId: firstRecord.employeeId,
            employeeName: employeeMap.get(firstRecord.employeeId) || `Employee ${firstRecord.employeeId.substring(0,5)}`,
            date: format(firstRecord.timestamp.toDate(), "PPP"),
            clockIn,
            clockOut
        };
    });

    // Sort by date and then by employee name
    summary.sort((a, b) => {
        if (b.date !== a.date) {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        return a.employeeName.localeCompare(b.employeeName);
    });

    return summary;
};
