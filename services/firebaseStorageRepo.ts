import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import type { IStorageRepo } from './dataRepo';

class FirebaseStorageRepo implements IStorageRepo {
    uploadExpenseReceipt(file: File, userId: string, expenseId: string): Promise<{ downloadURL: string, fileName: string }> {
        return new Promise((resolve, reject) => {
            // Create a storage reference with a structured path
            const storageRef = ref(storage, `receipts/${userId}/${expenseId}/${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            // Listen for state changes, errors, and completion of the upload.
            uploadTask.on('state_changed',
                (snapshot) => {
                    // Observe state change events like progress, pause, and resume
                    // This can be used to show a progress bar in the UI in the future
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => {
                    // Handle unsuccessful uploads
                    console.error("Firebase Storage upload error:", error);
                    // The promise is rejected here, which will be caught by the calling function's catch block
                    reject(error);
                },
                () => {
                    // Handle successful uploads on complete
                    // Get the public download URL
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        resolve({ downloadURL, fileName: file.name });
                    }).catch((error) => {
                        console.error("Firebase Storage getDownloadURL error:", error);
                        reject(error);
                    });
                }
            );
        });
    }
}

export const storageRepo = new FirebaseStorageRepo();