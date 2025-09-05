
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';

export type Location = {
    id: string;
    name: string;
    managerId?: string;
    managerName?: string;
    address?: string;
};

const locationsCollection = collection(db, 'locations');

export const createLocation = async (locationData: Omit<Location, 'id'>) => {
    return await addDoc(locationsCollection, locationData);
};

export const getAllLocations = async (): Promise<Location[]> => {
    const snapshot = await getDocs(locationsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
};

export const updateLocation = async (locationId: string, data: Partial<Omit<Location, 'id'>>) => {
    const locationDoc = doc(db, 'locations', locationId);
    await updateDoc(locationDoc, data);
};
