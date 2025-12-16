// src/App.tsx
import React, { useEffect, useState } from "react";
import Auth from "./Auth";
import Chat from "./Chat";
import AdminPanel from "./AdminPanel";
import api from "./api";

const App: React.FC = () => {
  const [role, setRole] = useState<"student" | "admin" | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setChecking(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        setRole(res.data.role);
      })
      .catch(() => {
        localStorage.removeItem("token");
        setRole(null);
      })
      .finally(() => setChecking(false));
  }, []);

  if (checking) return <p style={{ padding: 20 }}>Loading...</p>;

  if (!role) {
    return (
      <Auth
        onLoggedIn={(r) => {
          setRole(r);
        }}
      />
    );
  }

  return (
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 20px",
          borderBottom: "1px solid #eee",
        }}
      >
        <h3>CA RAG Chatbot</h3>
        <div>
          <span style={{ marginRight: 12 }}>Role: {role}</span>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              setRole(null);
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {role === "admin" && <AdminPanel />}
      <Chat />
    </div>
  );
};

export default App;
