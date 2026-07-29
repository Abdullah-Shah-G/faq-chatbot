"use client";

import { useState, useEffect } from "react";
import type { FaqEntry } from "@/lib/types";

const defaultFaqs: FaqEntry[] = [
  { id: "1", question: "What is your refund policy?", answer: "We offer refunds within 30 days for unused subscriptions.", tags: ["refund", "billing"], last_updated: "2026-01-15" },
  { id: "2", question: "How do I reset my password?", answer: "Go to Settings > Security > Reset Password.", tags: ["password", "account"], last_updated: "2026-02-10" },
  { id: "3", question: "What payment methods do you accept?", answer: "We accept Visa, Mastercard, Amex, PayPal, and ACH.", tags: ["payment", "billing"], last_updated: "2026-03-01" },
  { id: "4", question: "Can I upgrade or downgrade my plan?", answer: "Yes, from Settings > Billing > Plan. Changes apply next cycle.", tags: ["plan", "upgrade"], last_updated: "2026-01-20" },
  { id: "5", question: "Do you have a mobile app?", answer: "Yes, on iOS App Store and Google Play.", tags: ["mobile", "app"], last_updated: "2026-02-28" },
  { id: "6", question: "How do I invite team members?", answer: "Settings > Team > Invite Members.", tags: ["team", "invite"], last_updated: "2026-03-05" },
  { id: "7", question: "Is my data secure?", answer: "Yes, AES-256 at rest, TLS 1.3 in transit. SOC 2 & GDPR compliant.", tags: ["security", "gdpr"], last_updated: "2026-02-01" },
  { id: "8", question: "What is your uptime SLA?", answer: "99.9% for paid plans, 99.99% for Enterprise.", tags: ["uptime", "sla"], last_updated: "2026-01-10" },
];

export default function AdminPage() {
  const [faqs, setFaqs] = useState<FaqEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FaqEntry | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("faq-data");
    if (stored) {
      try { setFaqs(JSON.parse(stored)); } catch { setFaqs(defaultFaqs); }
    } else {
      setFaqs(defaultFaqs);
    }
  }, []);

  function handleSave() {
    localStorage.setItem("faq-data", JSON.stringify(faqs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    setFaqs(defaultFaqs);
    localStorage.setItem("faq-data", JSON.stringify(defaultFaqs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function startEdit(faq: FaqEntry) {
    setEditingId(faq.id);
    setEditForm({ ...faq });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  function updateEdit(field: keyof FaqEntry, value: string | string[]) {
    if (!editForm) return;
    setEditForm({ ...editForm, [field]: value });
  }

  function confirmEdit() {
    if (!editForm) return;
    setFaqs((prev) =>
      prev.map((f) => (f.id === editForm.id ? { ...editForm, last_updated: new Date().toISOString().split("T")[0] } : f))
    );
    setEditingId(null);
    setEditForm(null);
  }

  function addEntry() {
    const newEntry: FaqEntry = {
      id: String(Date.now()),
      question: "New question",
      answer: "New answer",
      tags: [],
      last_updated: new Date().toISOString().split("T")[0],
    };
    setFaqs((prev) => [...prev, newEntry]);
    startEdit(newEntry);
  }

  function deleteEntry(id: string) {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>FAQ Manager</h1>
        <div className="admin-actions">
          <a href="/" className="back-link">← Back to Chat</a>
          <button onClick={addEntry}>Add Entry</button>
          <button onClick={handleSave} className="save-btn">Save Changes</button>
          <button onClick={handleReset} className="reset-btn">Reset to Defaults</button>
        </div>
      </header>

      {saved && <div className="toast">Changes saved to local storage</div>}

      <div className="faq-table">
        <div className="faq-table-header">
          <span className="col-id">ID</span>
          <span className="col-q">Question</span>
          <span className="col-a">Answer</span>
          <span className="col-tags">Tags</span>
          <span className="col-actions">Actions</span>
        </div>

        {faqs.map((faq) => (
          <div key={faq.id} className="faq-row">
            {editingId === faq.id && editForm ? (
              <>
                <span className="col-id">{faq.id}</span>
                <span className="col-q">
                  <input
                    value={editForm.question}
                    onChange={(e) => updateEdit("question", e.target.value)}
                  />
                </span>
                <span className="col-a">
                  <textarea
                    value={editForm.answer}
                    onChange={(e) => updateEdit("answer", e.target.value)}
                  />
                </span>
                <span className="col-tags">
                  <input
                    value={editForm.tags.join(", ")}
                    onChange={(e) =>
                      updateEdit(
                        "tags",
                        e.target.value.split(",").map((t) => t.trim())
                      )
                    }
                    placeholder="comma separated"
                  />
                </span>
                <span className="col-actions">
                  <button onClick={confirmEdit} className="confirm-btn">Save</button>
                  <button onClick={cancelEdit} className="cancel-btn">Cancel</button>
                </span>
              </>
            ) : (
              <>
                <span className="col-id">{faq.id}</span>
                <span className="col-q">{faq.question}</span>
                <span className="col-a">{faq.answer}</span>
                <span className="col-tags">{faq.tags.join(", ")}</span>
                <span className="col-actions">
                  <button onClick={() => startEdit(faq)}>Edit</button>
                  <button onClick={() => deleteEntry(faq.id)} className="delete-btn">Delete</button>
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      <p className="admin-note">
        FAQ data is stored in browser localStorage. Restart the dev server after editing to apply changes to the backend seed data.
      </p>
    </div>
  );
}
