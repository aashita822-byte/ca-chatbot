// src/AdminPanel.tsx
import React, { useEffect, useState } from "react";
import api from "./api";
import "./App.css";

interface Doc {
  _id: string;
  filename: string;
  uploaded_by: string;
  uploaded_at: string;
  chunks: number;
}

const AdminPanel: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchDocs = async () => {
    setLoadingDocs(true);
    try {
      const res = await api.get("/admin/documents");
      setDocs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus("Please select a PDF file first.");
      return;
    }
    setStatus("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/admin/upload_pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStatus(
        `Uploaded: ${res.data.filename} (chunks: ${res.data.chunks})`
      );
      setFile(null);
      await fetchDocs();
    } catch (err: any) {
      console.error(err);
      setStatus(
        err?.response?.data?.detail ||
          "Upload failed. Check console for more details."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-section">
        <h3 className="admin-title">Admin controls</h3>
        <p className="admin-subtitle">
          Upload CA study materials (PDF). These will be indexed into Pinecone
          and used by the chatbot for answers.
        </p>

        <form onSubmit={handleUpload} className="admin-upload-form">
          <label className="file-input-label">
            <span>Select PDF</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
              }}
            />
          </label>
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "Upload & index"}
          </button>
        </form>

        {status && <div className="admin-status">{status}</div>}
      </div>

      <div className="admin-panel-section admin-docs-section">
        <h4 className="admin-docs-title">Indexed documents</h4>
        {loadingDocs && (
          <div className="admin-docs-loading">Loading documents…</div>
        )}
        {!loadingDocs && docs.length === 0 && (
          <div className="admin-docs-empty">No documents uploaded yet.</div>
        )}
        {!loadingDocs && docs.length > 0 && (
          <div className="admin-docs-list">
            {docs.map((d) => (
              <div key={d._id} className="admin-doc-item">
                <div className="admin-doc-name">{d.filename}</div>
                <div className="admin-doc-meta">
                  <span>{d.chunks} chunks</span>
                  <span>By: {d.uploaded_by}</span>
                  <span>
                    {new Date(d.uploaded_at).toLocaleDateString()}{" "}
                    {new Date(d.uploaded_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
