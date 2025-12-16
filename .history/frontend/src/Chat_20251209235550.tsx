// src/Chat.tsx
import React, { useEffect, useState } from "react";
import api from "./api";

type Msg = { role: "user" | "assistant"; content: string };

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const [rec, setRec] = useState<SpeechRecognition | null>(null);

  useEffect(() => {a
    const SR: any =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SR) {
      const recognition: SpeechRecognition = new SR();
      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const text = event.results[0][0].transcript;
        setInput(text);
      };
      setRec(recognition);
      setSttSupported(true);
    }
  }, []);

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN";
    window.speechSynthesis.speak(utter);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    const toSend = input;
    setInput("");
    setLoading(true);

    try {
      const historyForBackend = newMessages
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await api.post("/chat", {
        message: toSend,
        history: historyForBackend,
      });
      const answer = res.data.answer as string;

      const withAssistant = [
        ...newMessages,
        { role: "assistant", content: answer },
      ];
      setMessages(withAssistant);
      speak(answer);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startVoiceInput = () => {
    if (!rec) return;
    (window as any).speechSynthesis.cancel();
    rec.start();
  };

  return (
    <div style={{ maxWidth: 800, margin: "20px auto" }}>
      <h2>CA RAG Chatbot</h2>
      <div
        style={{
          border: "1px solid #ddd",
          padding: 16,
          height: 400,
          overflowY: "auto",
          marginBottom: 16,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              textAlign: m.role === "user" ? "right" : "left",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: 12,
                background:
                  m.role === "user" ? "#daf4ff" : "rgba(0,0,0,0.05)",
              }}
            >
              <strong>{m.role === "user" ? "You" : "Tutor"}: </strong>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <p>Thinking…</p>}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          style={{ flex: 1 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask any CA-related doubt..."
        />
        {sttSupported && (
          <button type="button" onClick={startVoiceInput}>
            🎙️
          </button>
        )}
        <button type="button" onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
