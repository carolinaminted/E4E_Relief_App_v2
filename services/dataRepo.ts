import type { UserProfile, FundIdentity, Application } from '../types';
import type { Fund } from '../data/fundData';

export interface IUsersRepo {
    get(uid: string): Promise<UserProfile | null>;
    listen(uid: string, callback: (profile: UserProfile | null) => void): () => void; // Returns an unsubscribe function
    getByEmail(email: string): Promise<UserProfile | null>;
    getAll(): Promise<UserProfile[]>;
    add(user: Omit<UserProfile, 'role'>, uid: string): Promise<void>;
    update(uid: string, data: Partial<UserProfile>): Promise<void>;
    incrementTokenUsage(uid: string, tokens: number, cost: number): Promise<void>;
}

export interface IIdentitiesRepo {
    getForUser(uid: string): Promise<FundIdentity[]>;
    add(identity: FundIdentity): Promise<void>;
    update(id: string, data: Partial<FundIdentity>): Promise<void>;
    remove(id: string): Promise<void>;
}

export interface IApplicationsRepo {
    getForUser(uid: string): Promise<Application[]>;
    getProxySubmissions(adminUid: string): Promise<Application[]>;
    getAll(): Promise<Application[]>;
    add(application: Omit<Application, 'id'>): Promise<Application>;
}

export interface IFundsRepo {
    getFund(code: string): Promise<Fund | null>;
    getAllFunds(): Promise<Fund[]>;
}

export interface IStorageRepo {
    uploadExpenseReceipt(file: File, userId: string, expenseId: string): Promise<{ downloadURL: string; fileName: string }>;
}