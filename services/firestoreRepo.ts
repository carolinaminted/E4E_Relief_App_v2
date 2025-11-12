import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  documentId,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile, FundIdentity, Application } from '../types';
import type { IUsersRepo, IIdentitiesRepo, IApplicationsRepo, IFundsRepo } from './dataRepo';
import type { Fund } from '../data/fundData';


class UsersRepo implements IUsersRepo {
    private usersCol = collection(db, 'users');

    async get(uid: string): Promise<UserProfile | null> {
        const docRef = doc(this.usersCol, uid);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
    }

    listen(uid: string, callback: (profile: UserProfile | null) => void): () => void {
        const docRef = doc(this.usersCol, uid);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            const profile = docSnap.exists() ? (docSnap.data() as UserProfile) : null;
            callback(profile);
        });
        return unsubscribe;
    }
    
    async getByEmail(email: string): Promise<UserProfile | null> {
        const q = query(this.usersCol, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data() as UserProfile;
        }
        return null;
    }

    async getAll(): Promise<UserProfile[]> {
        const q = query(this.usersCol);
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as UserProfile);
    }

    async add(user: Omit<UserProfile, 'role'>, uid: string): Promise<void> {
        const userWithRole = { ...user, role: 'User' };
        await setDoc(doc(this.usersCol, uid), userWithRole);
    }

    async update(uid: string, data: Partial<UserProfile>): Promise<void> {
        const docRef = doc(this.usersCol, uid);
        await updateDoc(docRef, data);
    }
}

class IdentitiesRepo implements IIdentitiesRepo {
    private identitiesCol = collection(db, 'identities');

    async getForUser(uid: string): Promise<FundIdentity[]> {
        const q = query(this.identitiesCol, where('uid', '==', uid));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as FundIdentity);
    }

    async add(identity: FundIdentity): Promise<void> {
        await setDoc(doc(this.identitiesCol, identity.id), identity);
    }

    async update(id: string, data: Partial<FundIdentity>): Promise<void> {
        const docRef = doc(this.identitiesCol, id);
        await updateDoc(docRef, data);
    }

    async remove(id: string): Promise<void> {
        await deleteDoc(doc(this.identitiesCol, id));
    }
}

class ApplicationsRepo implements IApplicationsRepo {
    private appsCol = collection(db, 'applications');

    async getForUser(uid: string): Promise<Application[]> {
        const q = query(this.appsCol, where('uid', '==', uid));
        const snapshot = await getDocs(q);
        const applications = snapshot.docs.map(doc => Object.assign({ id: doc.id }, doc.data()) as Application);
        // Sort on the client to avoid needing a composite index in Firestore
        return applications.sort((a, b) => new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime());
    }
    
    async getProxySubmissions(adminUid: string): Promise<Application[]> {
        const q = query(this.appsCol, where('submittedBy', '==', adminUid));
        const snapshot = await getDocs(q);
        const applications = snapshot.docs.map(doc => Object.assign({ id: doc.id }, doc.data()) as Application);
        // Sort on the client to avoid needing a composite index in Firestore
        return applications.sort((a, b) => new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime());
    }

    async getAll(): Promise<Application[]> {
        const snapshot = await getDocs(this.appsCol);
        return snapshot.docs.map(doc => Object.assign({ id: doc.id }, doc.data()) as Application);
    }

    async add(application: Omit<Application, 'id'>): Promise<Application> {
        const docRef = await addDoc(this.appsCol, application);
        return { id: docRef.id, ...application } as Application;
    }
}


class FundsRepo implements IFundsRepo {
    private fundsCol = collection(db, 'funds');

    async getFund(code: string): Promise<Fund | null> {
        // In Firestore, document IDs are case-sensitive. Assuming codes are stored uppercase.
        const docRef = doc(this.fundsCol, code.toUpperCase());
        const docSnap = await getDoc(docRef);
        // FIX: Replaced spread operator with Object.assign to avoid type inference issues within the ternary operator.
        return docSnap.exists() ? (Object.assign({ code: docSnap.id }, docSnap.data()) as Fund) : null;
    }

    async getAllFunds(): Promise<Fund[]> {
        const snapshot = await getDocs(this.fundsCol);
        // FIX: Replaced spread operator with Object.assign to avoid type inference issues.
        return snapshot.docs.map(doc => Object.assign({ code: doc.id }, doc.data()) as Fund);
    }
}

export const usersRepo = new UsersRepo();
export const identitiesRepo = new IdentitiesRepo();
export const applicationsRepo = new ApplicationsRepo();
export const fundsRepo = new FundsRepo();