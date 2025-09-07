
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type AppSettings = {
    // Cron settings are no longer used.
};

const settingsDocRef = doc(db, 'system', 'settings');

export const getSettings = async (): Promise<AppSettings> => {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
        return docSnap.data() as AppSettings;
    } else {
        const defaultSettings: AppSettings = {};
        await setDoc(settingsDocRef, defaultSettings);
        return defaultSettings;
    }
};

export const updateSettings = async (settings: Partial<AppSettings>) => {
    await setDoc(settingsDocRef, settings, { merge: true });
};
