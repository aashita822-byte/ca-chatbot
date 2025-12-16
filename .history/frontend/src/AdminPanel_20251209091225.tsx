// src/AdminPanel.tsx
import React, { useEffect, useState } from "react";
import api from "./api";

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
      setStatus("Select a PDF file first.");
      return;
    }
    setStatus("Uploading and indexing...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/admin/upload_pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStatus(
        `Uploaded: ${res.data.filename}, chunks: ${res.data.chunks}`
      );
      setFile(null);
      await fetchDocs();
    } catch (err: any) {
      setStatus(
        err?.response?.data?.detail || "Upload failed. Check console."
      );
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "20px auto" }}>
      <h2>Admin Panel</h2>

      <form onSubmit={handleUpload} style={{ marginBottom: 16 }}>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            setFile(f);
          }}
        />
        <button type="submit" style={{ marginLeft: 8 }}>
          Upload PDF
        </button>
      </form>

      {status && <p>{status}</p>}

      <h3>Uploaded Documents</h3>
      {loadingDocs && <p>Loading...</p>}
      {!loadingDocs && docs.length === 0 && <p>No documents uploaded yet.</p>}
      {!loadingDocs &&
        docs.map((d) => (
          <div
            key={d._id}
            style={{
              border: "1px solid #eee",
              padding: 8,
              marginBottom: 8,
              borderRadius: 6,
            }}
          >
            <strong>{d.filename}</strong>
            <div>
              Chunks: {d.chunks} | Uploaded by: {d.uploaded_by}
            </div>
            <div>At: {new Date(d.uploaded_at).toLocaleString()}</div>
          </div>
        ))}
    </div>
  );
};

export default AdminPanel;
