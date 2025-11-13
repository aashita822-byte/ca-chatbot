import { DocumentMetadata } from "../types";

const DOCUMENTS_KEY = 'ca_chatbot_documents';

// Initialize with some dummy data if the store is empty
const initializeDocuments = () => {
    const existing = localStorage.getItem(DOCUMENTS_KEY);
    if (!existing) {
        const defaultDocs: DocumentMetadata[] = [
            {
                id: `doc-${Date.now() - 10000}`,
                name: 'Financial_Reporting_Standards.pdf',
                size: 2097152, // 2MB
                type: 'application/pdf',
                uploadedAt: new Date(Date.now() - 10000).toISOString(),
            },
            {
                id: `doc-${Date.now() - 20000}`,
                name: 'Advanced_Auditing_Notes.docx',
                size: 838860, // 0.8MB
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                uploadedAt: new Date(Date.now() - 20000).toISOString(),
            }
        ];
        localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(defaultDocs));
    }
};

initializeDocuments();

/**
 * SIMULATION: Fetches the list of document metadata.
 * REAL WORLD: This would be an API call to your backend, which would query a database
 * like MongoDB for the metadata of documents stored.
 * @returns A promise that resolves with an array of document metadata.
 */
export const getDocuments = (): Promise<DocumentMetadata[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const docsJson = localStorage.getItem(DOCUMENTS_KEY);
            const documents: DocumentMetadata[] = docsJson ? JSON.parse(docsJson) : [];
            // Sort by most recent first
            documents.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
            resolve(documents);
        }, 500); // Simulate network delay
    });
};

/**
 * SIMULATION: Deletes a document's metadata and its vectors.
 * REAL WORLD: This would be an API call to your backend which would:
 * 1. Delete the corresponding vectors from the Pinecone database using the document ID.
 * 2. Delete the document's metadata from your MongoDB collection.
 * 3. Potentially delete the original file from a cloud storage bucket (e.g., S3, GCS).
 * @param documentId The ID of the document to delete.
 * @returns A promise that resolves on completion.
 */
export const deleteDocument = (documentId: string): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                const docs = JSON.parse(localStorage.getItem(DOCUMENTS_KEY) || '[]') as DocumentMetadata[];
                const updatedDocs = docs.filter(doc => doc.id !== documentId);
                localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(updatedDocs));
                console.log(`Simulating deletion of document ID: ${documentId}`);
                resolve({ success: true, message: 'Document deleted successfully.' });
            } catch (error) {
                reject({ success: false, message: 'Failed to delete document.' });
            }
        }, 800);
    });
};


/**
 * Simulates uploading a document to a vector database like Pinecone.
 * In a real-world application, this function would send the file to a secure backend server.
 * The backend would then perform the following steps:
 * 1. Text Extraction: Parse the PDF/DOC file to extract raw text.
 * 2. Chunking: Split the extracted text into smaller, meaningful chunks.
 * 3. Embedding: Use a generative AI model (e.g., a Gemini embedding model) to convert each text chunk into a numerical vector (embedding).
 * 4. Upserting to Pinecone: Store these vectors in the Pinecone vector database.
 * 5. Storing Metadata in MongoDB: Save the file's metadata (name, size, type, ID) in a MongoDB collection for retrieval and management.
 * 
 * @param file The file to be "uploaded".
 * @returns A promise that resolves with a success or failure status.
 */
export const uploadDocument = (file: File): Promise<{ success: boolean; message: string }> => {
  return new Promise((resolve) => {
    // Simulate network delay and processing time (e.g., 2.5 seconds)
    setTimeout(() => {
      const allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        console.error('Invalid file type attempted to upload:', file.type);
        resolve({ 
            success: false, 
            message: `Invalid file type. Please upload a PDF, DOC, or DOCX file.` 
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        resolve({ 
            success: false, 
            message: 'File is too large. Maximum size is 10MB.' 
        });
        return;
      }
      
      const newDocument: DocumentMetadata = {
        id: `doc-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      };

      const docs = JSON.parse(localStorage.getItem(DOCUMENTS_KEY) || '[]') as DocumentMetadata[];
      docs.push(newDocument);
      localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
      
      console.log(`Simulating successful upload and vectorization for: ${file.name}`);
      resolve({ 
          success: true, 
          message: `Successfully uploaded and processed "${file.name}". It is now part of the knowledge base.` 
      });

    }, 2500);
  });
};