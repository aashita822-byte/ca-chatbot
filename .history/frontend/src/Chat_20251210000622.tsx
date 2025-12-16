// src/Chat.tsx
import React, { useEffect, useRef, useState } from "react";
import api from "./api";
import "./App.css";

type Source = { id?: string; score?: number; source?: string };
type Msg = {
  role: "user" | "assistant";
  content: string;
  ts?: string;
  sources?: Source[]; // only assistant messages will have this
};

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const [rec, setRec] = useState<any | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Setup speech recognition
  useEffect(() => {
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const recognition: SpeechRe = new SR();
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
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    const now = new Date().toISOString();

    const userMsg: Msg = {
      role: "user",
      content,
      ts: now,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const historyForBackend = newMessages
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.post("/chat", {
        message: content,
        history: historyForBackend,
      });

      const answer = res.data.answer as string;
      const sources = Array.isArray(res.data.sources) ? res.data.sources : [];

      const assistantMsg: Msg = {
        role: "assistant",
        content: answer,
        ts: new Date().toISOString(),
        sources,
      };

      const updated = [...newMessages, assistantMsg];
      setMessages(updated);
      speak(answer);
    } catch (e) {
      console.error(e);
      setMessages((msgs) => [
        ...msgs,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't process that question. Please try again in a moment.",
          ts: new Date().toISOString(),
        },
      ]);
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
    if (!rec) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    (window as any).speechSynthesis.cancel();
    try {
      rec.start();
    } catch (err) {
      console.error(err);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="chat-card" role="region" aria-label="Chat with CA tutor">
      <div className="chat-card-header">
        <div>
          <h2 className="chat-title">Ask your CA doubts</h2>
          <p className="chat-subtitle">
            Answers are grounded in PDFs uploaded by your admins.
          </p>
        </div>
        <div className="chat-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={clearChat}>
            Clear chat
          </button>
        </div>
      </div>

      <div className="chat-messages" aria-live="polite">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>Try asking:</p>
            <ul>
              <li>“Explain treatment of depreciation in CA Inter accounts.”</li>
              <li>“What are conditions for claiming input tax credit under GST?”</li>
              <li>“Summarise section 80C deductions.”</li>
            </ul>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "chat-bubble-row chat-bubble-row-user"
                : "chat-bubble-row chat-bubble-row-assistant"
            }
          >
            <div
              className={
                m.role === "user"
                  ? "chat-bubble chat-bubble-user"
                  : "chat-bubble chat-bubble-assistant"
              }
            >
              <div className="chat-bubble-role">
                {m.role === "user" ? "You" : "Tutor"}
              </div>
              <div className="chat-bubble-content">{m.content}</div>
              {m.ts && (
                <div className="chat-bubble-time">
                  {new Date(m.ts).toLocaleTimeString()}
                </div>
              )}

              {/* Sources section for assistant messages */}
              {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                <div className="chat-sources" aria-label="Sources">
                  <div className="chat-sources-title">Sources</div>
                  <ul className="chat-sources-list">
                    {m.sources.map((s, idx) => (
                      <li key={idx} className="chat-source-item">
                        {/* show filename if present, otherwise id */}
                        <strong>{s.source ?? s.id ?? "Unknown source"}</strong>
                        {typeof s.score === "number" && (
                          <span className="chat-source-score">
                            {" "}
                            • {s.score.toFixed(3)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble-row chat-bubble-row-assistant">
            <div className="chat-bubble chat-bubble-assistant">
              <div className="typing-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your question here…"
          aria-label="Question input"
        />
        {sttSupported && (
          <button
            type="button"
            className="btn-icon"
            onClick={startVoiceInput}
            title="Voice input"
            aria-label="Voice input"
          >
            🎙
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={sendMessage}
          disabled={loading}
        >
          {loading ? "Thinking…" : "Send"}
        </button>
      </div>
    </div>
  );
};

export default Chat;
