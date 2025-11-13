import { DocumentMetadata } from "../types";
import { apiService } from './apiService';

export const getDocuments = async (): Promise<DocumentMetadata[]> => {
    const response = await apiService.getDocuments();

    if (response.error || !response.data) {
        return [];
    }

    return response.data.map((doc: any) => ({
        id: doc.id,
        name: doc.title,
        size: doc.size,
        type: doc.type,
        uploadedAt: doc.uploaded_at,
    }));
};

export const deleteDocument = async (documentId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiService.deleteDocument(documentId);

    if (response.error) {
        return { success: false, message: response.error };
    }

    return { success: true, message: 'Document deleted successfully.' };
};

export const uploadDocument = async (file: File, title?: string, category?: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiService.uploadDocument(
        file,
        title || file.name,
        category || 'general'
    );

    if (response.error) {
        return { success: false, message: response.error };
    }

    return {
        success: true,
        message: `Successfully uploaded and processed "${file.name}". It is now part of the knowledge base.`
    };
};