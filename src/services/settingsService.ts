
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type AppSettings = {
    cronHour: number; // 0-23
    cronMinute: number; // 0-59
    lastSuccessfulRun?: string; // ISO string for the last run timestamp
};

const settingsDocRef = doc(db, 'system', 'settings');

export const getSettings = async (): Promise<AppSettings> => {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        // Return defaults for fields that might not exist yet
        return {
            cronHour: data.cronHour ?? 1,
            cronMinute: data.cronMinute ?? 0,
            lastSuccessfulRun: data.lastSuccessfulRun,
        };
    } else {
        // Default settings if the document doesn't exist at all
        const defaultSettings: AppSettings = {
            cronHour: 1, // 1 AM UTC
            cronMinute: 0,
        };
        await setDoc(settingsDocRef, defaultSettings);
        return defaultSettings;
    }
};

export const updateSettings = async (settings: Partial<AppSettings>) => {
    await setDoc(settingsDocRef, settings, { merge: true });
};
