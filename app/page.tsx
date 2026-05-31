"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { renderToolOutput } from "@/components/genui/registry";

const SUGGESTIONS = [
  "今週の通話ダッシュボードを見せて",
  "クレームの通話を探して",
  "call_1002 の詳細を教えて",
];

export default function Home() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const busy = status === "submitted" || status === "streaming";

  function submit(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  }

  return (
    <main className="app">
      <header className="app-head">
        <h1>MiiTel Generative UI サンプル</h1>
        <p className="muted">
          質問に応じて LLM がツールを選び、UIが動的に切り替わります。
        </p>
      </header>

      <div className="suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="chip" onClick={() => submit(s)} disabled={busy}>
            {s}
          </button>
        ))}
      </div>

      <section className="chat">
        {messages.length === 0 && (
          <p className="muted empty">
            上のサンプル質問を押すか、自由に入力してみてください。
          </p>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role}`}>
            {m.parts.map((part, i) => {
              // テキスト
              if (part.type === "text") {
                return (
                  <p key={i} className="bubble">
                    {part.text}
                  </p>
                );
              }
              // ツールパート: type は `tool-<toolName>`
              if (part.type.startsWith("tool-")) {
                const toolName = part.type.slice("tool-".length);
                const p = part as { state?: string; output?: unknown };
                if (p.state === "output-available") {
                  return (
                    <div key={i} className="genui">
                      {renderToolOutput(toolName, p.output, {
                        onPickCall: (id) => submit(`${id} の詳細を教えて`),
                      })}
                    </div>
                  );
                }
                return (
                  <p key={i} className="muted tool-pending">
                    🔧 {toolName} を実行中…
                  </p>
                );
              }
              return null;
            })}
          </div>
        ))}

        {busy && <p className="muted">考え中…</p>}
      </section>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="例: 先週のクレーム通話を探して"
          disabled={busy}
        />
        <button type="submit" disabled={busy || !input.trim()}>
          送信
        </button>
      </form>
    </main>
  );
}
