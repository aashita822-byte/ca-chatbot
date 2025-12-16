// src/Auth.tsx
import React, { useState } from "react";
import api from "./api";

interface Props {
  onLoggedIn: (role: "student" | "admin") => void;
}

const Auth: React.FC<Props> = ({ onLoggedIn }) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "admin">("student");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/signup";
      const payload: any = { email, password };
      if (mode === "signup") payload.role = role;

      const res = await api.post(endpoint, payload);
      localStorage.setItem("token", res.data.access_token);

      const me = await api.get("/auth/me");
      onLoggedIn(me.data.role);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Error");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto" }}>
      <h2>{mode === "login" ? "Login" : "Sign up"}</h2>
      <button
        type="button"
        onClick={() =>
          setMode((m) => (m === "login" ? "signup" : "login"))
        }
      >
        Switch to {mode === "login" ? "Sign up" : "Login"}
      </button>

      <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
        <input
          placeholder="Email"
          value={email}
          style={{ display: "block", width: "100%", marginBottom: 8 }}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          style={{ display: "block", width: "100%", marginBottom: 8 }}
          onChange={(e) => setPassword(e.target.value)}
        />
        {mode === "signup" && (
          <select
            value={role}
            style={{ display: "block", width: "100%", marginBottom: 8 }}
            onChange={(e) =>
              setRole(e.target.value as "student" | "admin")
            }
          >
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
        )}
        <button type="submit" style={{ marginTop: 8 }}>
          {mode === "login" ? "Login" : "Create account"}
        </button>
      </form>

      {error && (
        <p style={{ color: "red", marginTop: 8 }}>{error}</p>
      )}
    </div>
  );
};

export default Auth;
