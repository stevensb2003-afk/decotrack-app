
import { db, applyDbPrefix } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type AppSettings = {
    cronHour?: number;
    cronMinute?: number;
    geofenceRadius?: number;
    authorizedDomains?: string[];
};

const settingsDocRef = doc(db, applyDbPrefix('system'), 'settings');

export const getSettings = async (): Promise<AppSettings> => {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
        return docSnap.data() as AppSettings;
    } else {
        const defaultSettings: AppSettings = {
            cronHour: 2, // Default to 2 AM
            cronMinute: 0,
            geofenceRadius: 100, // Default to 100 meters
            authorizedDomains: ['localhost'],
        };
        await setDoc(settingsDocRef, defaultSettings);
        return defaultSettings;
    }
};

export const updateSettings = async (settings: Partial<AppSettings>) => {
    await setDoc(settingsDocRef, settings, { merge: true });
};
