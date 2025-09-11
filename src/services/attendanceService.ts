

import { db, applyDbPrefix } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, doc, setDoc, getDoc, limit, updateDoc, deleteDoc } from 'firebase/firestore';
import { Employee } from './employeeService';
import { format, parse, differenceInMilliseconds, isSameDay, differenceInDays, startOfDay, endOfDay, isValid, parseISO } from 'date-fns';
import { EmployeeScheduleAssignment, getEmployeeScheduleAssignments, getHolidays, getRotationPatterns, getShifts, Holiday, RotationPattern, Shift } from './scheduleService';

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  type: 'Entry' | 'Exit';
  timestamp: Timestamp;
  latitude?: number;
  longitude?: number;
};

export type AttendanceDetail = {
    employeeId: string;
    date: string; // YYYY-MM-DD
    mealBreakTaken: boolean;
}

export type DailyAttendanceSummary = {
  id: string; // employeeId-date(YYYY-MM-DD)
  employeeId: string;
  employeeName: string;
  date: string; // "PPP" format, e.g. "Sep 10, 2025"
  dateKey: string; // "yyyy-MM-dd" format
  clockIn: string | null; // "p" format
  clockOut: string | null; // "p" format
  clockInTimestamp: Timestamp | null;
  clockOutTimestamp: Timestamp | null;
  wasScheduled: boolean;
  mealBreakTaken: boolean;
};

const attendanceCollection = collection(db, applyDbPrefix('attendance'));
const attendanceDetailsCollection = collection(db, applyDbPrefix('attendanceDetails'));

export const markAttendance = async (record: Omit<AttendanceRecord, 'id'>) => {
  await addDoc(attendanceCollection, record);
};

export const getEmployeeAttendance = async (employeeId: string, recordLimit: number = 5): Promise<AttendanceRecord[]> => {
  const q = query(
    attendanceCollection, 
    where("employeeId", "==", employeeId),
    orderBy('timestamp', 'desc'),
    limit(recordLimit)
  );
  const snapshot = await getDocs(q);
  const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
  return records;
};

export const wasEmployeeScheduled = (employeeId: string, date: Date, assignments: EmployeeScheduleAssignment[], patterns: RotationPattern[], shifts: Shift[], holidays: Holiday[]): boolean => {
    const holiday = holidays.find(h => isSameDay(h.date.toDate(), date));
    if (holiday) return false;

    const assignment = assignments.find(a => a.employeeId === employeeId && date >= a.startDate.toDate() && date <= a.endDate.toDate());
    if (!assignment) return false;
    
    const pattern = patterns.find(p => p.id === assignment.rotationPatternId);
    if (!pattern || !pattern.weeks || pattern.weeks.length === 0) return false;

    const startDate = assignment.startDate.toDate();
    const daysSinceStart = differenceInDays(date, startDate);
    const weekIndex = Math.floor(daysSinceStart / 7) % pattern.weeks.length;
    const dayIndex = (date.getDay() + 6) % 7; // Monday is 0

    const shiftId = pattern.weeks[weekIndex]?.days[dayIndex];
    return !!shiftId;
};

export const getDailyAttendanceSummary = async (daysLimit: number, employees: Employee[]): Promise<DailyAttendanceSummary[]> => {
    if (employees.length === 0) return [];

    const employeeMap = new Map(employees.map(e => [e.id, e.fullName]));
    
    const [assignments, patterns, shifts, holidays] = await Promise.all([
        getEmployeeScheduleAssignments(),
        getRotationPatterns(),
        getShifts(),
        getHolidays()
    ]);
    
    const allRecords: AttendanceRecord[] = [];
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - daysLimit);
    
    const q = query(
        attendanceCollection,
        where("timestamp", ">=", Timestamp.fromDate(startDate)),
        orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);

    snapshot.docs.forEach(doc => {
      const record = { id: doc.id, ...doc.data() } as AttendanceRecord;
      if (employeeMap.has(record.employeeId)) {
        allRecords.push(record);
      }
    });

    const dailyGroups: { [key: string]: AttendanceRecord[] } = {};

    allRecords.forEach(record => {
        if (!record.timestamp || !record.timestamp.toDate) return;

        const dateKey = format(record.timestamp.toDate(), 'yyyy-MM-dd');
        const groupKey = `${record.employeeId}-${dateKey}`;

        if (!dailyGroups[groupKey]) {
            dailyGroups[groupKey] = [];
        }
        dailyGroups[groupKey].push(record);
    });

    const summaryPromises = Object.keys(dailyGroups).map(async (groupKey) => {
        const group = dailyGroups[groupKey];
        if (!group || group.length === 0) return null;

        const firstRecord = group[0];
        const employeeId = firstRecord.employeeId;
        const employeeName = employeeMap.get(employeeId);
        
        if (!employeeName) return null;

        const date = firstRecord.timestamp.toDate();
        const dateKey = format(date, 'yyyy-MM-dd');
        
        const entries = group.filter(r => r.type === 'Entry').sort((a,b) => a.timestamp.toMillis() - b.timestamp.toMillis());
        const exits = group.filter(r => r.type === 'Exit').sort((a,b) => a.timestamp.toMillis() - b.timestamp.toMillis());

        const firstEntry = entries[0];
        const lastExit = exits[exits.length - 1];
        
        const clockIn = firstEntry ? firstEntry.timestamp : null;
        const clockOut = lastExit ? lastExit.timestamp : null;
        
        const scheduled = wasEmployeeScheduled(employeeId, date, assignments, patterns, shifts, holidays);

        const detailDocRef = doc(db, applyDbPrefix('attendanceDetails'), groupKey);
        const detailDoc = await getDoc(detailDocRef);
        
        const defaultMealBreak = !!(clockIn && clockOut);
        const mealBreakTaken = detailDoc.exists() ? detailDoc.data().mealBreakTaken : defaultMealBreak;

        return {
            id: groupKey,
            employeeId: employeeId,
            employeeName: employeeName,
            date: format(date, "MMM d, yyyy"),
            dateKey: dateKey,
            clockIn: clockIn ? format(clockIn.toDate(), 'p') : null,
            clockOut: clockOut ? format(clockOut.toDate(), 'p') : null,
            clockInTimestamp: clockIn,
            clockOutTimestamp: clockOut,
            wasScheduled: scheduled,
            mealBreakTaken: mealBreakTaken
        };
    });

    const summaries = (await Promise.all(summaryPromises)).filter((s): s is DailyAttendanceSummary => s !== null);

    summaries.sort((a, b) => {
        const dateB = parseISO(b.dateKey);
        const dateA = parseISO(a.dateKey);
        if (dateB.getTime() !== dateA.getTime()) {
            return dateB.getTime() - dateA.getTime();
        }
        return a.employeeName.localeCompare(b.employeeName);
    });

    return summaries;
};


export const updateAttendanceDetail = async (detailId: string, data: Partial<Omit<AttendanceDetail, 'employeeId' | 'date'>>) => {
    const detailDoc = doc(db, applyDbPrefix('attendanceDetails'), detailId);
    await setDoc(detailDoc, data, { merge: true });
};
