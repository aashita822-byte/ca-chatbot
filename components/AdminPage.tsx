import React, { useState, useRef, DragEvent, useEffect, useCallback } from 'react';
import { getDocuments, uploadDocument, deleteDocument } from '../services/vectorDbService';
import { UploadIcon, FileIcon, CheckCircleIcon, XCircleIcon, TrashIcon } from './icons';
import { DocumentMetadata } from '../types';

// Helper to format file size
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const AdminPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoadingDocs(true);
    try {
        const docs = await getDocuments();
        setDocuments(docs);
    } catch (error) {
        console.error("Failed to fetch documents:", error);
    } finally {
        setIsLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDrag = (e: DragEvent<HTMLDivElement | HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setUploadStatus(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus(null);
    }
  };
  
  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(null);

    const result = await uploadDocument(file);
    setUploadStatus(result);
    setIsUploading(false);
    if (result.success) {
        setFile(null);
        fetchDocuments(); // Refresh the list after successful upload
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm("Are you sure you want to delete this document from the knowledge base?")) return;
    
    try {
        await deleteDocument(docId);
        // Optimistic UI update
        setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== docId));
    } catch (error) {
        console.error("Failed to delete document:", error);
        alert("There was an error deleting the document.");
    }
  }

  return (
    <div className="flex-1 p-4 md:p-8 bg-gray-100 dark:bg-gray-900 overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Admin Dashboard</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage the chatbot's knowledge base.</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Upload New Document</h3>
            {!uploadStatus && (
                <>
                    <form id="form-file-upload" onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()}>
                        <label 
                            htmlFor="input-file-upload" 
                            className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                                dragActive ? "border-blue-600" : "border-gray-300 dark:border-gray-500"
                            }`}
                        >
                            <div className="flex flex-col items-center justify-center">
                                <UploadIcon />
                                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">PDF, DOC, or DOCX (MAX. 10MB)</p>
                            </div>
                            <input ref={inputRef} id="input-file-upload" type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleChange} />
                        </label>
                        {dragActive && <div className="absolute w-full h-full top-0 left-0" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}></div>}
                    </form>

                    {file && !isUploading && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FileIcon />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                                </div>
                                <button onClick={() => setFile(null)} className="text-gray-500 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0 ml-2">&times;</button>
                            </div>
                            <button 
                                onClick={handleUpload}
                                className="w-full mt-4 px-4 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                            >
                                Upload to Vector DB
                            </button>
                        </div>
                    )}

                    {isUploading && (
                        <div className="mt-6 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Uploading and processing "{file?.name}"...</p>
                        </div>
                    )}
                </>
            )}
            {uploadStatus && (
                <div className="text-center flex flex-col items-center py-4">
                    {uploadStatus.success ? <CheckCircleIcon /> : <XCircleIcon />}
                    <p className={`mt-4 font-semibold ${uploadStatus.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {uploadStatus.success ? 'Upload Successful' : 'Upload Failed'}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{uploadStatus.message}</p>
                    <button 
                        onClick={() => setUploadStatus(null)}
                        className="w-full sm:w-auto mt-6 px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Upload Another File
                    </button>
                </div>
            )}
        </div>

        {/* Documents List Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Knowledge Base Documents</h3>
            <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                     <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">File Name</th>
                            <th scope="col" className="px-6 py-3">Size</th>
                            <th scope="col" className="px-6 py-3">Uploaded At</th>
                            <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingDocs ? (
                            <tr><td colSpan={4} className="text-center p-6">Loading documents...</td></tr>
                        ) : documents.length > 0 ? (
                            documents.map(doc => (
                                <tr key={doc.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{doc.name}</th>
                                    <td className="px-6 py-4">{formatBytes(doc.size)}</td>
                                    <td className="px-6 py-4">{new Date(doc.uploadedAt).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleDelete(doc.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline" aria-label={`Delete ${doc.name}`}>
                                            <TrashIcon/>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={4} className="text-center p-6">No documents found in the knowledge base.</td></tr>
                        )}
                    </tbody>
                 </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;