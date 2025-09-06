
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type AppSettings = {
    cronHour: number; // 0-23
    cronMinute: number; // 0-59
};

const settingsDocRef = doc(db, 'system', 'settings');

export const getSettings = async (): Promise<AppSettings> => {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
        return docSnap.data() as AppSettings;
    } else {
        // Default settings if the document doesn't exist
        const defaultSettings: AppSettings = {
            cronHour: 1, // 1 AM UTC
            cronMinute: 10,
        };
        // Create the document with default settings
        await setDoc(settingsDocRef, defaultSettings);
        return defaultSettings;
    }
};

export const updateSettings = async (settings: Partial<AppSettings>) => {
    await setDoc(settingsDocRef, settings, { merge: true });
};
