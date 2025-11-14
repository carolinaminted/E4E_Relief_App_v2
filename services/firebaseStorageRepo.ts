import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import type { IStorageRepo } from './dataRepo';

class FirebaseStorageRepo implements IStorageRepo {
    uploadExpenseReceipt(file: File, userId: string, expenseId: string): Promise<{ downloadURL: string, fileName: string }> {
        const UPLOAD_TIMEOUT_MS = 30000; // 30 seconds

        const uploadPromise = new Promise<{ downloadURL: string; fileName: string }>((resolve, reject) => {
            console.log(`[storageRepo] Starting upload for userId: ${userId}, file: ${file.name}`);

            if (!userId || !expenseId) {
                const errorMsg = "User or expense ID is missing.";
                console.error(`[storageRepo] Critical Error: ${errorMsg}`);
                return reject(new Error(errorMsg));
            }

            // Create a storage reference with a structured path
            const storageRef = ref(storage, `receipts/${userId}/${expenseId}/${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            // Listen for state changes, errors, and completion of the upload.
            uploadTask.on('state_changed',
                (snapshot) => {
                    // Progress monitoring can be re-enabled here if needed.
                },
                (error) => {
                    console.error("[storageRepo] Upload failed in SDK error callback.", error);
                    reject(error);
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        console.log("[storageRepo] Upload complete, URL obtained.");
                        resolve({ downloadURL, fileName: file.name });
                    }).catch((error) => {
                        console.error("[storageRepo] Failed to get download URL after upload.", error);
                        reject(error);
                    });
                }
            );
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error("Upload timed out after 30 seconds. This is likely a CORS configuration issue on the storage bucket."));
            }, UPLOAD_TIMEOUT_MS);
        });

        return Promise.race([uploadPromise, timeoutPromise]);
    }
}

export const storageRepo = new FirebaseStorageRepo();