// src/Chat.tsx
import React, { useEffect, useRef, useState } from "react";
import api from "./api";
import "./App.css";

type Source = {
  id?: string;
  score?: number;
  source?: string;
  doc_title?: string;
  page_start?: number;
  page_end?: number;
  chapter?: string | null;
  topic?: string | null;
};

type Msg = {
  role: "user" | "assistant";
  content: string;
  ts?: string;
  sources?: Source[];
};

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const [rec, setRec] = useState<any>(null);
  const [mode, setMode] = useState<"qa" | "discussion">("qa");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Setup speech recognition
  useEffect(() => {
    const SR: any =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SR) {
      const recognition = new SR();
      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event: any) => {
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
        mode, // send mode to backend
      });

      const answer = res.data.answer as string;
      const sources: Source[] = Array.isArray(res.data.sources)
        ? res.data.sources
        : [];

      const assistantMsg: Msg = {
        role: "assistant",
        content: answer,
        ts: new Date().toISOString(),
        sources,
      };

      const updated = [...newMessages, assistantMsg];
      setMessages(updated);

      // "Video" effect: speak answer as audio
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
            Answers are grounded in CA Final PDFs uploaded by your admins.
          </p>
        </div>
        <div className="chat-header-actions">
          {/* Mode toggle */}
          <div className="chat-mode-toggle">
            <button
              type="button"
              className={
                mode === "qa"
                  ? "chat-mode-btn chat-mode-btn-active"
                  : "chat-mode-btn"
              }
              onClick={() => setMode("qa")}
            >
              Simple Q&amp;A
            </button>
            <button
              type="button"
              className={
                mode === "discussion"
                  ? "chat-mode-btn chat-mode-btn-active"
                  : "chat-mode-btn"
              }
              onClick={() => setMode("discussion")}
            >
              Discussion
            </button>
          </div>
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
              <li>“Explain treatment of depreciation in CA Final accounts.”</li>
              <li>
                “What are conditions for claiming input tax credit under GST?”
              </li>
              <li>“Summarise section 80C deductions with limits.”</li>
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
            {m.role === "assistant" && (
              <div className="chat-avatar-video" aria-hidden="true">
                <div className="chat-avatar-wave" />
              </div>
            )}
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

              {/* Enhanced Sources under assistant messages (updated style) */}
              {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 border rounded text-sm text-gray-700">
                  <strong>Sources Used:</strong>
                  <ul className="list-disc ml-5 mt-2">
                    {m.sources.map((src: any, idx: number) => (
                      <li key={idx}>
                        <span className="font-semibold">
                          {src.doc_title || src.source || "Unknown source"}
                        </span>
                        {src.chapter && <> | Chapter: {src.chapter}</>}
                        {src.topic && <> | Topic: {src.topic}</>}
                        {src.page_start && (
                          <>
                            {" "}
                            | Page: {src.page_start}
                            {src.page_end && src.page_end !== src.page_start
                              ? `-${src.page_end}`
                              : ""}
                          </>
                        )}
                        {typeof src.score === "number" && (
                          <> | score: {src.score.toFixed(3)}</>
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
            <div className="chat-avatar-video chat-avatar-video-active">
              <div className="chat-avatar-wave" />
            </div>
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
