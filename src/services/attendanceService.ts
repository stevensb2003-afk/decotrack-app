
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, doc, setDoc, getDoc, limit } from 'firebase/firestore';
import { Employee, getAllEmployees } from './employeeService';
import { format, differenceInMilliseconds, isSameDay, differenceInDays } from 'date-fns';
import { EmployeeScheduleAssignment, getEmployeeScheduleAssignments, getHolidays, getRotationPatterns, Holiday, RotationPattern } from './scheduleService';

export type AttendanceRecord = {
  id?: string;
  employeeId: string;
  type: 'Entry' | 'Exit';
  timestamp: Timestamp;
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
  date: string; // "PPP" format
  clockIn: string | null; // "p" format
  clockOut: string | null; // "p" format
  clockInTimestamp: Timestamp | null;
  clockOutTimestamp: Timestamp | null;
  wasScheduled: boolean;
  mealBreakTaken: boolean;
};

const attendanceCollection = collection(db, 'attendance');
const attendanceDetailsCollection = collection(db, 'attendanceDetails');

export const markAttendance = async (record: Omit<AttendanceRecord, 'id'>) => {
  await addDoc(attendanceCollection, record);
};

export const getEmployeeAttendance = async (employeeId: string, recordLimit: number = 5): Promise<AttendanceRecord[]> => {
  const q = query(
    attendanceCollection, 
    where("employeeId", "==", employeeId),
    // orderBy("timestamp", "desc"), // This requires a composite index. We will sort on the client.
    limit(recordLimit)
  );
  const snapshot = await getDocs(q);
  const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
  
  // Sort records manually to avoid needing a composite index
  records.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
  
  return records;
};

export const updateAttendanceDetail = async (detailId: string, data: Partial<Omit<AttendanceDetail, 'employeeId' | 'date'>>) => {
    const detailDoc = doc(db, 'attendanceDetails', detailId);
    await setDoc(detailDoc, data, { merge: true });
};

const wasEmployeeScheduled = (employeeId: string, date: Date, assignments: EmployeeScheduleAssignment[], patterns: RotationPattern[], holidays: Holiday[]): boolean => {
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

export const getDailyAttendanceSummary = async (daysLimit: number = 10, employeesData?: Employee[]): Promise<DailyAttendanceSummary[]> => {
    const employees = employeesData || await getAllEmployees();
    const assignments = await getEmployeeScheduleAssignments();
    const patterns = await getRotationPatterns();
    const holidays = await getHolidays();
    
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
    const records = snapshot.docs.map(doc => doc.data() as AttendanceRecord & {employeeId: string});

    const dailyGroups: { [key: string]: AttendanceRecord[] } = {};

    records.forEach(record => {
        const dateKey = format(record.timestamp.toDate(), 'yyyy-MM-dd');
        const groupKey = `${record.employeeId}-${dateKey}`;
        if (!dailyGroups[groupKey]) {
            dailyGroups[groupKey] = [];
        }
        dailyGroups[groupKey].push(record);
    });

    const summaryPromises = Object.values(dailyGroups).map(async (group) => {
        const firstRecord = group[0];
        const date = firstRecord.timestamp.toDate();
        const dateKey = format(date, 'yyyy-MM-dd');
        const summaryId = `${firstRecord.employeeId}-${dateKey}`;

        const entries = group.filter(r => r.type === 'Entry');
        const exits = group.filter(r => r.type === 'Exit');

        const firstEntry = entries[0];
        const lastExit = exits[exits.length - 1];
        
        const clockIn = firstEntry ? firstEntry.timestamp : null;
        const clockOut = lastExit ? lastExit.timestamp : null;
        
        const scheduled = wasEmployeeScheduled(firstRecord.employeeId, date, assignments, patterns, holidays);

        // Fetch meal break override
        const detailDocRef = doc(db, 'attendanceDetails', summaryId);
        const detailDoc = await getDoc(detailDocRef);
        const mealBreakTaken = detailDoc.exists() ? detailDoc.data().mealBreakTaken : true;

        return {
            id: summaryId,
            employeeId: firstRecord.employeeId,
            employeeName: employeeMap.get(firstRecord.employeeId) || `Employee ${firstRecord.employeeId.substring(0,5)}`,
            date: format(date, "MMM d, yyyy"),
            clockIn: clockIn ? format(clockIn.toDate(), 'p') : null,
            clockOut: clockOut ? format(clockOut.toDate(), 'p') : null,
            clockInTimestamp: clockIn,
            clockOutTimestamp: clockOut,
            wasScheduled: scheduled,
            mealBreakTaken: mealBreakTaken
        };
    });

    let summary = await Promise.all(summaryPromises);

    // This handles multiple entries/exits in a day by taking the first and last
    const uniqueSummaryMap = new Map<string, DailyAttendanceSummary>();
     summary.forEach(item => {
        if (!uniqueSummaryMap.has(item.id)) {
            uniqueSummaryMap.set(item.id, item);
        }
    });
    summary = Array.from(uniqueSummaryMap.values());


    summary.sort((a, b) => {
        if (b.date !== a.date) {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        return a.employeeName.localeCompare(b.employeeName);
    });

    return summary;
};
