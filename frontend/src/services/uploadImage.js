import { storage } from './firebaseSetup';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a local image URI to Firebase Storage
 * @param {string} uri - The local file URI (from expo-image-picker)
 * @param {string} folder - The storage folder (e.g. 'products', 'banners')
 * @returns {Promise<string>} The public download URL
 */
export const uploadImageToFirebase = async (uri, folder = 'uploads') => {
    try {
        // Fetch the file to convert it into a Blob
        const response = await fetch(uri);
        const blob = await response.blob();

        // Create a unique filename
        const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const storageRef = ref(storage, filename);

        // Upload the blob
        await uploadBytes(storageRef, blob);

        // Get the public download URL
        const downloadUrl = await getDownloadURL(storageRef);
        return downloadUrl;
    } catch (error) {
        console.error('Firebase image upload error:', error);
        throw new Error('Failed to upload image. Please try again.');
    }
};
