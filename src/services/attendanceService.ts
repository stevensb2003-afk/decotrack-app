

import { db, applyDbPrefix } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, doc, setDoc, getDoc, limit, updateDoc, deleteDoc } from 'firebase/firestore';
import { Employee, getAllEmployees } from './employeeService';
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
    limit(recordLimit)
  );
  const snapshot = await getDocs(q);
  const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
  
  // Sort records manually to avoid needing a composite index
  records.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
  
  return records;
};

export const getAttendanceRecordsByFilter = async (filters: { employeeId?: string, startDate?: Date, endDate?: Date }): Promise<AttendanceRecord[]> => {
    let conditions = [];
    if (filters.employeeId && filters.employeeId !== 'all') {
        conditions.push(where("employeeId", "==", filters.employeeId));
    }
    if (filters.startDate) {
        conditions.push(where("timestamp", ">=", Timestamp.fromDate(startOfDay(filters.startDate))));
    }
    if (filters.endDate) {
        conditions.push(where("timestamp", "<=", Timestamp.fromDate(endOfDay(filters.endDate))));
    }

    const q = query(attendanceCollection, ...conditions, orderBy("timestamp", "desc"));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
};


export const updateAttendanceRecord = async (recordId: string, data: Partial<Omit<AttendanceRecord, 'id'>>) => {
    const recordDoc = doc(db, applyDbPrefix('attendance'), recordId);
    return await updateDoc(recordDoc, data);
};

export const createAttendanceRecord = async (data: Omit<AttendanceRecord, 'id'>) => {
    return await addDoc(attendanceCollection, data);
};

export const deleteAttendanceRecord = async (recordId: string) => {
    const recordDoc = doc(db, applyDbPrefix('attendance'), recordId);
    return await deleteDoc(recordDoc);
};

export const updateOrCreateAttendanceRecord = async (employeeId: string, date: Date, type: 'Entry' | 'Exit', newTime: Date | null) => {
    const q = query(attendanceCollection, 
        where('employeeId', '==', employeeId),
        where('type', '==', type),
        where('timestamp', '>=', Timestamp.fromDate(startOfDay(date))),
        where('timestamp', '<=', Timestamp.fromDate(endOfDay(date)))
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        if (newTime) {
            // Create new record
            await createAttendanceRecord({ employeeId, type, timestamp: Timestamp.fromDate(newTime) });
        }
    } else {
        const recordDocRef = snapshot.docs[0].ref;
        if (newTime) {
            // Update existing record
            await updateDoc(recordDocRef, { timestamp: Timestamp.fromDate(newTime) });
        } else {
            // Delete existing record if time is cleared
            await deleteDoc(recordDocRef);
        }
    }
}


export const updateAttendanceDetail = async (detailId: string, data: Partial<Omit<AttendanceDetail, 'employeeId' | 'date'>>) => {
    const detailDoc = doc(db, applyDbPrefix('attendanceDetails'), detailId);
    await setDoc(detailDoc, data, { merge: true });
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
    
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (daysLimit -1));
    startDate.setHours(0, 0, 0, 0);

    const q = query(
        attendanceCollection,
        where("timestamp", ">=", startDate)
    );
    const snapshot = await getDocs(q);
    
    const dailyGroups: { [key: string]: AttendanceRecord[] } = {};

    snapshot.docs.forEach(doc => {
        const record = { id: doc.id, ...doc.data() } as AttendanceRecord;
        if (!record.timestamp || !record.timestamp.toDate || !employeeMap.has(record.employeeId)) {
            return;
        }
        const dateKey = format(record.timestamp.toDate(), 'yyyy-MM-dd');
        const groupKey = `${record.employeeId}-${dateKey}`;
        if (!dailyGroups[groupKey]) {
            dailyGroups[groupKey] = [];
        }
        dailyGroups[groupKey].push(record);
    });
    
    const summaryPromises = Object.entries(dailyGroups).map(async ([groupKey, group]) => {
        const [employeeId, dateKey] = groupKey.split('-');
        if (!employeeMap.has(employeeId)) return null;

        const date = parse(dateKey, 'yyyy-MM-dd', new Date());
        if (!isValid(date)) return null;
        
        const entries = group.filter(r => r.type === 'Entry').sort((a,b) => a.timestamp.toMillis() - b.timestamp.toMillis());
        const exits = group.filter(r => r.type === 'Exit').sort((a,b) => a.timestamp.toMillis() - b.timestamp.toMillis());

        const firstEntry = entries[0];
        const lastExit = exits[exits.length - 1];
        
        const clockIn = firstEntry ? firstEntry.timestamp : null;
        const clockOut = lastExit ? lastExit.timestamp : null;
        
        const scheduled = wasEmployeeScheduled(employeeId, date, assignments, patterns, shifts, holidays);

        const detailDocRef = doc(db, applyDbPrefix('attendanceDetails'), groupKey);
        const detailDoc = await getDoc(detailDocRef);
        
        const defaultMealBreak = !!(clockIn && !clockOut) ? false : true;
        const mealBreakTaken = detailDoc.exists() ? detailDoc.data().mealBreakTaken : defaultMealBreak;

        return {
            id: groupKey,
            employeeId: employeeId,
            employeeName: employeeMap.get(employeeId)!,
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
        if (b.date !== a.date) {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        return a.employeeName.localeCompare(b.employeeName);
    });

    const todayString = format(today, "MMM d, yyyy");
    return summaries.filter(s => s.date === todayString);
};

export const getDailySummariesByFilter = async (filters: { employeeId?: string, startDate?: Date, endDate?: Date }): Promise<DailyAttendanceSummary[]> => {
    
    const [employees, allRecords, assignments, patterns, shifts, holidays, detailsSnapshot] = await Promise.all([
        getAllEmployees(),
        getAttendanceRecordsByFilter(filters),
        getEmployeeScheduleAssignments(),
        getRotationPatterns(),
        getShifts(),
        getHolidays(),
        getDocs(collection(db, applyDbPrefix('attendanceDetails')))
    ]);

    const employeeMap = new Map(employees.map(e => [e.id, e]));
    const detailsMap = new Map(detailsSnapshot.docs.map(d => [d.id, d.data() as AttendanceDetail]));

    const dailyGroups: { [key: string]: AttendanceRecord[] } = {};
    allRecords.forEach(record => {
        const dateKey = format(record.timestamp.toDate(), 'yyyy-MM-dd');
        const groupKey = `${record.employeeId}-${dateKey}`;
        if (!dailyGroups[groupKey]) dailyGroups[groupKey] = [];
        dailyGroups[groupKey].push(record);
    });

    const summary: DailyAttendanceSummary[] = Object.entries(dailyGroups).map(([groupKey, group]) => {
        const [employeeId, dateKey] = groupKey.split('-');
        const date = parse(dateKey, 'yyyy-MM-dd', new Date());
        
        const employee = employeeMap.get(employeeId);
        if(!employee) return null;

        const entries = group.filter(r => r.type === 'Entry').sort((a,b) => a.timestamp.toMillis() - b.timestamp.toMillis());
        const exits = group.filter(r => r.type === 'Exit').sort((a,b) => a.timestamp.toMillis() - b.timestamp.toMillis());

        const clockIn = entries[0]?.timestamp || null;
        const clockOut = exits[exits.length - 1]?.timestamp || null;
        
        const scheduled = wasEmployeeScheduled(employeeId, date, assignments, patterns, shifts, holidays);
        const detail = detailsMap.get(groupKey);

        const defaultMealBreak = clockIn && !clockOut ? false : true;
        const mealBreakTaken = detail ? detail.mealBreakTaken : defaultMealBreak;

        return {
            id: groupKey,
            employeeId,
            employeeName: employee.fullName,
            date: format(date, "MMM d, yyyy"),
            dateKey,
            clockIn: clockIn ? format(clockIn.toDate(), 'p') : null,
            clockOut: clockOut ? format(clockOut.toDate(), 'p') : null,
            clockInTimestamp: clockIn,
            clockOutTimestamp: clockOut,
            wasScheduled: scheduled,
            mealBreakTaken
        };
    }).filter((s): s is DailyAttendanceSummary => s !== null);

     summary.sort((a, b) => {
        if (b.date !== a.date) {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        return a.employeeName.localeCompare(b.employeeName);
    });
    
    return summary;
}
