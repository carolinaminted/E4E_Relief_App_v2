import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import type { IStorageRepo } from './dataRepo';

class FirebaseStorageRepo implements IStorageRepo {
    async uploadExpenseReceipt(file: File, userId: string, expenseId: string): Promise<{ downloadURL: string, fileName: string }> {
        // Create a storage reference with a structured path
        const storageRef = ref(storage, `receipts/${userId}/${expenseId}/${file.name}`);

        // Upload the file
        const snapshot = await uploadBytes(storageRef, file);

        // Get the public download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        return { downloadURL, fileName: file.name };
    }
}

export const storageRepo = new FirebaseStorageRepo();