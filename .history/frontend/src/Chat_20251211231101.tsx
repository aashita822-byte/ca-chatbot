// src/Chat.tsx
import React, { useEffect, useRef, useState } from "react";
import api from "./api";
import "./App.css";

type Source = {
  id?: string;
  score?: number;
  source?: string;
  doc_title?: string;
  page_start?: number | string;
  page_end?: number | string;
  chapter?: string | null;
  topic?: string | null;
  note?: string | null;
};

type Msg = {
  role: "user" | "assistant";
  content: string;
  ts?: string;
  sources?: Source[];
};

const isDialogue = (text: string) => {
  // Detect if text looks like the forced dialogue format
  // e.g. starts with "User A:" or contains "User A:" / "User B:"
  if (!text) return false;
  return /(^|\n)\s*User\s*A\s*:/i.test(text) || /(^|\n)\s*User\s*B\s*:/i.test(text);
};

const parseDialogueLines = (text: string) => {
  // Returns array of {speaker: "A"|"B"|null, text: string}
  const lines = text.split(/\r?\n/).map((ln) => ln.trim()).filter(Boolean);
  const parsed: Array<{ speaker: "A" | "B" | null; text: string }> = [];
  for (const ln of lines) {
    const mA = ln.match(/^\s*User\s*A\s*:\s*(.*)$/i);
    const mB = ln.match(/^\s*User\s*B\s*:\s*(.*)$/i);
    if (mA) {
      parsed.push({ speaker: "A", text: mA[1].trim() });
    } else if (mB) {
      parsed.push({ speaker: "B", text: mB[1].trim() });
    } else {
      // fallback: keep as neutral line
      parsed.push({ speaker: null, text: ln });
    }
  }
  return parsed;
};

const stripSourcesText = (answer: string) => {
  // Remove textual "Sources Used:" block from the answer for UI display.
  // We'll still rely on structured msg.sources for the sources UI.
  if (!answer) return { body: "", sourcesText: "" };
  const re = /(?:Sources\s*Used\s*:)/i;
  const split = answer.split(re);
  if (split.length <= 1) {
    return { body: answer.trim(), sourcesText: "" };
  }
  // split[0] is the main answer, the rest is sources text — join in case 'Sources Used:' appears multiple times
  const body = split[0].trim();
  const sourcesText = split.slice(1).join("Sources Used:").trim();
  return { body, sourcesText };
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

      const rawAnswer = (res.data.answer as string) || "";
      // strip textual Sources Used block from displayed answer
      const { body: displayAnswer } = stripSourcesText(rawAnswer);

      // backend sends structured sources (merged from Pinecone and LLM parsing)
      const sources: Source[] = Array.isArray(res.data.sources)
        ? res.data.sources
        : [];

      // If the backend returned a dialogue style (User A/User B), we keep it in content
      // so UI can render separate User A/B mini-bubbles. Otherwise show plain text.
      const assistantMsg: Msg = {
        role: "assistant",
        content: displayAnswer,
        ts: new Date().toISOString(),
        sources,
      };

      const updated = [...newMessages, assistantMsg];
      setMessages(updated);

      // Speak the displayAnswer (without the sources block)
      speak(displayAnswer);
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

        {messages.map((m, i) => {
          const isAssistant = m.role === "assistant";

          // Decide if this assistant message is a dialogue
          const dialogue = isAssistant && isDialogue(m.content) ? parseDialogueLines(m.content) : null;

          return (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "chat-bubble-row chat-bubble-row-user"
                  : "chat-bubble-row chat-bubble-row-assistant"
              }
            >
              {isAssistant && (
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

                {/* Render dialogue lines as mini-bubbles when detected */}
                {dialogue ? (
                  <div className="dialogue-block">
                    {dialogue.map((ln, idx) => (
                      <div
                        key={idx}
                        className={`dialogue-line dialogue-line-${ln.speaker === "A" ? "a" : ln.speaker === "B" ? "b" : "neutral"}`}
                        role="article"
                        aria-label={ln.speaker ? `User ${ln.speaker}` : "Dialogue"}
                      >
                        <span className="dialogue-speaker">
                          {ln.speaker ? `User ${ln.speaker}: ` : ""}
                        </span>
                        <span className="dialogue-text">{ln.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Normal assistant content
                  <div className="chat-bubble-content">{m.content}</div>
                )}

                {m.ts && (
                  <div className="chat-bubble-time">
                    {new Date(m.ts).toLocaleTimeString()}
                  </div>
                )}

                {/* Sources under assistant messages (structured) */}
                {isAssistant && m.sources && m.sources.length > 0 && (
                  <div className="chat-sources" aria-label="Sources">
                    <div className="chat-sources-title">Sources used</div>
                    <ul className="chat-sources-list">
                      {m.sources.map((s, idx) => {
                        const title = s.doc_title || s.source || "Unknown source";
                        const page =
                          s.page_start &&
                          (s.page_end && s.page_end !== s.page_start
                            ? `Pages ${s.page_start}-${s.page_end}`
                            : `Page ${s.page_start}`);
                        const chapterTopic =
                          s.chapter || s.topic
                            ? [s.chapter, s.topic]
                                .filter(Boolean)
                                .join(" • ")
                            : null;

                        return (
                          <li key={idx} className="chat-source-item">
                            <div className="chat-source-title">{title}</div>
                            <div className="chat-source-meta">
                              {chapterTopic && (
                                <span className="chat-source-meta-item">
                                  {chapterTopic}
                                </span>
                              )}
                              {page && (
                                <span className="chat-source-meta-item">
                                  {page}
                                </span>
                              )}
                              {typeof s.score === "number" && (
                                <span className="chat-source-meta-item">
                                  score {s.score.toFixed(3)}
                                </span>
                              )}
                              {s.note && (
                                <span className="chat-source-meta-item"> {s.note}</span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}

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
