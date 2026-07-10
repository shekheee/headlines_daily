"use client";

import { useState } from "react";
import { Send } from "lucide-react";

const TOPICS = [
  { value: "General enquiry", email: "" },
  { value: "Editorial / news tip", email: "" },
  { value: "Correction request", email: "" },
  { value: "Advertising & partnerships", email: "" },
] as const;

export function ContactForm({ toEmail, adsEmail }: { toEmail: string; adsEmail: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<string>(TOPICS[0].value);
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const recipient = topic === "Advertising & partnerships" ? adsEmail : toEmail;
    const subject = `[${topic}] — ${name || "Website enquiry"}`;
    const body = `Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}`;
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  const field =
    "w-full border border-gray-300 bg-white px-3.5 py-2.5 text-[15px] text-gray-900 outline-none transition-colors focus:border-red-600";
  const labelCls = "mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-gray-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className={labelCls}>
            Your name
          </label>
          <input
            id="cf-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={field}
            placeholder="Full name"
          />
        </div>
        <div>
          <label htmlFor="cf-email" className={labelCls}>
            Your email
          </label>
          <input
            id="cf-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="cf-topic" className={labelCls}>
          Topic
        </label>
        <select id="cf-topic" value={topic} onChange={(e) => setTopic(e.target.value)} className={field}>
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.value}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cf-message" className={labelCls}>
          Message
        </label>
        <textarea
          id="cf-message"
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={field}
          placeholder="How can we help?"
        />
      </div>

      <button
        type="submit"
        className="inline-flex items-center gap-2 bg-red-600 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-red-700"
      >
        <Send className="h-4 w-4" aria-hidden />
        Send message
      </button>
      <p className="text-xs text-gray-400">
        This opens your email app with the message pre-filled — just hit send.
      </p>
    </form>
  );
}
