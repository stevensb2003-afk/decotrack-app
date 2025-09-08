import { db, applyDbPrefix } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';

export type BenefitApplicability = 'Employee' | 'Manager' | 'HR' | 'All';

export type Benefit = {
    id: string;
    name: string;
    description: string;
    locationId: string;
    locationName: string;
    appliesTo: BenefitApplicability;
};

const benefitsCollection = collection(db, applyDbPrefix('benefits'));

export const createBenefit = async (data: Omit<Benefit, 'id'>) => {
    return await addDoc(benefitsCollection, data);
};

export const getAllBenefits = async (): Promise<Benefit[]> => {
    const snapshot = await getDocs(benefitsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Benefit));
};

export const updateBenefit = async (id: string, data: Partial<Omit<Benefit, 'id'>>) => {
    const benefitDoc = doc(db, applyDbPrefix('benefits'), id);
    return await updateDoc(benefitDoc, data);
};

export const deleteBenefit = async (id: string) => {
    const benefitDoc = doc(db, applyDbPrefix('benefits'), id);
    return await deleteDoc(benefitDoc);
};
