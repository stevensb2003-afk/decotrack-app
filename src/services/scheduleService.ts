import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc, query, where, Timestamp, writeBatch, getDoc, deleteDoc } from 'firebase/firestore';
import { Employee } from './employeeService';

// --- Data Models ---

export type Shift = {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
};

export type RotationPattern = {
  id: string;
  name:string;
  shiftSequence: string[]; // Array of shift IDs
};

export type EmployeeScheduleAssignment = {
    id: string;
    employeeId: string;
    employeeName: string;
    rotationPatternId: string;
    rotationPatternName: string;
    startDate: Timestamp;
    endDate: Timestamp;
};

export type Schedule = {
  id: string;
  employeeId: string;
  shiftId: string;
  date: Timestamp;
};

export type Holiday = {
    id: string;
    name: string;
    date: Timestamp;
}

// --- Collections ---

const shiftsCollection = collection(db, 'shifts');
const rotationPatternsCollection = collection(db, 'rotationPatterns');
const scheduleCollection = collection(db, 'schedule');
const holidaysCollection = collection(db, 'holidays');
const assignmentsCollection = collection(db, 'employeeScheduleAssignments');


// --- Shift Management ---

export const createShift = async (shiftData: Omit<Shift, 'id'>) => {
  return await addDoc(shiftsCollection, {
      ...shiftData,
      startTime: Timestamp.fromDate(shiftData.startTime),
      endTime: Timestamp.fromDate(shiftData.endTime),
  });
};

export const getShifts = async (): Promise<Shift[]> => {
  const snapshot = await getDocs(shiftsCollection);
  return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
          id: doc.id,
          name: data.name,
          startTime: (data.startTime as Timestamp).toDate(),
          endTime: (data.endTime as Timestamp).toDate(),
      }
  });
};

// --- Rotation Pattern Management ---

export const createRotationPattern = async (patternData: Omit<RotationPattern, 'id'>) => {
  return await addDoc(rotationPatternsCollection, patternData);
};

export const getRotationPatterns = async (): Promise<RotationPattern[]> => {
  const snapshot = await getDocs(rotationPatternsCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RotationPattern));
};

// --- Schedule Assignment Management ---
export const createEmployeeScheduleAssignment = async (assignmentData: Omit<EmployeeScheduleAssignment, 'id'>) => {
    return await addDoc(assignmentsCollection, assignmentData);
}

export const getEmployeeScheduleAssignments = async (): Promise<EmployeeScheduleAssignment[]> => {
    const snapshot = await getDocs(assignmentsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeeScheduleAssignment));
}

export const deleteEmployeeScheduleAssignment = async (assignmentId: string) => {
    const assignmentDoc = doc(db, 'employeeScheduleAssignments', assignmentId);
    return await deleteDoc(assignmentDoc);
}


// --- Holiday Management ---

export const createHoliday = async (holidayData: Omit<Holiday, 'id'>) => {
    return await addDoc(holidaysCollection, holidayData);
}

export const getHolidays = async (): Promise<Holiday[]> => {
    const snapshot = await getDocs(holidaysCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Holiday));
}

// --- Schedule Management ---

export const generateSchedule = async (startDate: Date, endDate: Date) => {
    // This is a placeholder for the complex generation logic
    console.log(`Generating schedule from ${startDate} to ${endDate}`);
    // In a real implementation, you would:
    // 1. Fetch all employees with their assigned shifts and rotations
    // 2. Fetch all approved time off requests for the period
    // 3. Fetch all holidays for the period
    // 4. Loop through each day and each employee, apply rotation pattern, and create a schedule entry if not on leave or holiday
    // 5. Use a batch write to save all schedule entries efficiently
    return Promise.resolve();
};

export const getScheduleForMonth = async (year: number, month: number): Promise<Schedule[]> => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    const q = query(
        scheduleCollection, 
        where("date", ">=", Timestamp.fromDate(startDate)), 
        where("date", "<=", Timestamp.fromDate(endDate))
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));
}

export const getScheduleForEmployee = async (employeeId: string, startDate: Date, endDate: Date): Promise<Schedule[]> => {
    const q = query(
        scheduleCollection, 
        where("employeeId", "==", employeeId),
        where("date", ">=", Timestamp.fromDate(startDate)), 
        where("date", "<=", Timestamp.fromDate(endDate))
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));
};
