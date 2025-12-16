// src/AdminPanel.tsx
import React, { useEffect, useState, useRef } from "react";
import api from "./api";
import "./App.css";

interface Doc {
  _id: string;
  filename: string;
  uploaded_by?: string;
  uploaded_at: string;
  chunks: number;
  title?: string;
  course?: string;
  subject?: string;
}

const MAX_FILE_MB = 50; // adjust as needed

const humanFileSize = (size: number) => {
  if (size === 0) return "0 B";
  const i = Math.floor(Math.log(size) / Math.log(1024));
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  return (size / Math.pow(1024, i)).toFixed(i ? 2 : 0) + " " + sizes[i];
};

const AdminPanel: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  // metadata fields
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [course, setCourse] = useState("CA_FINAL");
  const [docType, setDocType] = useState("study_notes");
  const [year, setYear] = useState("");
  const [author, setAuthor] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchDocs = async () => {
    setLoadingDocs(true);
    try {
      const res = await api.get("/admin/documents");
      setDocs(res.data || []);
    } catch (e) {
      console.error(e);
      setStatus("Failed to fetch documents.");
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocs();
    // cleanup object URL on unmount
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // revoke previous url if file changes
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  const onFileChange = (f: File | null) => {
    setStatus("");
    if (!f) {
      setFile(null);
      setFileUrl(null);
      return;
    }
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setStatus("Please select a PDF file.");
      return;
    }
    const maxBytes = MAX_FILE_MB * 1024 * 1024;
    if (f.size > maxBytes) {
      setStatus(`File too large. Maximum ${MAX_FILE_MB} MB allowed.`);
      return;
    }
    setFile(f);
    try {
      const url = URL.createObjectURL(f);
      setFileUrl(url);
    } catch (err) {
      console.warn("Could not create object URL for preview", err);
      setFileUrl(null);
    }
    // pre-fill metadata title if empty
    if (!title) setTitle(f.name);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    onFileChange(f);
  };

  const removeSelectedFile = () => {
    setFile(null);
    setFileUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus("Please select a PDF file first.");
      return;
    }
    setStatus("");
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const metadata: any = {};
      if (title) metadata.title = title;
      if (subject) metadata.subject = subject;
      if (course) metadata.course = course;
      if (docType) metadata.doc_type = docType;
      if (year) metadata.year = year;
      if (author) metadata.author = author;

      if (Object.keys(metadata).length) {
        formData.append("metadata", JSON.stringify(metadata));
      }

      // axios-like onUploadProgress is supported by your api helper; pass the config
      const res = await api.post("/admin/upload_pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent: ProgressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(pct);
          }
        },
      });

      setStatus(`Uploaded: ${res.data.filename} (chunks: ${res.data.chunks})`);
      // clear selected file and metadata
      setFile(null);
      setFileUrl(null);
      setTitle("");
      setSubject("");
      setYear("");
      setAuthor("");
      setDocType("study_notes");
      setCourse("CA_FINAL");
      if (fileInputRef.current) fileInputRef.current.value = "";

      await fetchDocs();
    } catch (err: any) {
      console.error(err);
      setStatus(
        err?.response?.data?.detail ||
          err?.message ||
          "Upload failed. Check console for more details."
      );
    } finally {
      setUploading(false);
      setProgress(null);
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
          <div className="file-row">
            <label className="file-input-label" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileInputChange}
                style={{ display: "inline-block" }}
                disabled={uploading}
              />
            </label>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={uploading}
              >
                {uploading ? `Uploading ${progress ? `${progress}%` : "..."}` : "Upload & index"}
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  removeSelectedFile();
                  setStatus("");
                }}
                disabled={uploading || !file}
              >
                Remove selected
              </button>
            </div>
          </div>

          {/* Selected file preview + metadata */}
          <div className="selected-file-preview" style={{ marginTop: 12 }}>
            {file ? (
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ minWidth: 220, maxWidth: 320 }}>
                  <div style={{ fontWeight: 600 }}>{file.name}</div>
                  <div style={{ fontSize: 13, color: "#555" }}>{humanFileSize(file.size)}</div>

                  {fileUrl && (
                    <div style={{ marginTop: 8, border: "1px solid #eee", borderRadius: 6, overflow: "hidden" }}>
                      {/* small embedded preview (may be blocked by some browsers) */}
                      <embed src={fileUrl} type="application/pdf" width="100%" height="220px" />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "grid", gap: 8 }}>
                    <label>
                      Title (optional)
                      <input
                        className="input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Document title (defaults to filename)"
                        disabled={uploading}
                      />
                    </label>

                    <label>
                      Subject
                      <input
                        className="input"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g., Advanced Accounting"
                        disabled={uploading}
                      />
                    </label>

                    <div style={{ display: "flex", gap: 8 }}>
                      <label style={{ flex: 1 }}>
                        Year
                        <input
                          className="input"
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          placeholder="e.g., 2024"
                          disabled={uploading}
                        />
                      </label>
                      <label style={{ flex: 1 }}>
                        Author
                        <input
                          className="input"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          placeholder="Author or publisher"
                          disabled={uploading}
                        />
                      </label>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <label style={{ flex: 1 }}>
                        Course
                        <select
                          className="input"
                          value={course}
                          onChange={(e) => setCourse(e.target.value)}
                          disabled={uploading}
                        >
                          <option value="CA_FINAL">CA Final</option>
                          <option value="CA_INTER">CA Inter</option>
                          <option value="CA_IPCC">CA IPCC</option>
                        </select>
                      </label>

                      <label style={{ flex: 1 }}>
                        Doc type
                        <select
                          className="input"
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                          disabled={uploading}
                        >
                          <option value="study_notes">Study notes</option>
                          <option value="past_paper">Past paper</option>
                          <option value="case_study">Case study</option>
                          <option value="reference">Reference</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: "#666" }}>No PDF selected — choose a file to preview and add metadata.</div>
            )}

            {progress !== null && (
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 8, background: "#eee", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ width: `${progress}%`, height: "100%", background: "#3b82f6" }} />
                </div>
                <div style={{ fontSize: 12, color: "#444", marginTop: 6 }}>{progress}%</div>
              </div>
            )}
          </div>
        </form>

        {status && <div className="admin-status" style={{ marginTop: 12 }}>{status}</div>}
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
                <div className="admin-doc-left">
                  <div className="admin-doc-name">{d.title || d.filename}</div>
                  <div className="admin-doc-meta">
                    <span>{d.chunks} chunks</span>
                    {d.subject && <span>Subject: {d.subject}</span>}
                    {d.course && <span>Course: {d.course}</span>}
                  </div>
                </div>
                <div className="admin-doc-right">
                  <div>By: {d.uploaded_by || "admin"}</div>
                  <div>
                    {new Date(d.uploaded_at).toLocaleDateString()}{" "}
                    {new Date(d.uploaded_at).toLocaleTimeString()}
                  </div>
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
