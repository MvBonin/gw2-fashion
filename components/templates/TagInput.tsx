"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagInput({
  value,
  onChange,
  placeholder = "Tags eingeben, Vorschläge wählen oder neue anlegen…",
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/tags?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!input.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(input);
      setOpen(true);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = (name: string) => {
    const normalized = name.trim().toLowerCase();
    if (!normalized) return;
    if (value.map((t) => t.toLowerCase()).includes(normalized)) return;
    onChange([...value, normalized]);
    setInput("");
    setSuggestions([]);
    setOpen(false);
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addTagsFromCommaSeparated = (text: string) => {
    const parts = text.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const existing = new Set(value.map((t) => t.toLowerCase()));
    const toAdd = parts.filter((p) => !existing.has(p));
    if (toAdd.length > 0) {
      toAdd.forEach((p) => existing.add(p));
      onChange([...value, ...toAdd]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ",") {
      e.preventDefault();
      const trimmed = input.trim();
      if (trimmed) {
        addTagsFromCommaSeparated(trimmed);
        setInput("");
        setSuggestions([]);
        setOpen(false);
      }
      return;
    }
    if (e.key === "Enter") {
      const trimmed = input.trim();
      if (trimmed) {
        e.preventDefault();
        const match = suggestions.find(
          (s) => s.name.toLowerCase() === trimmed.toLowerCase()
        );
        addTag(match ? match.name : trimmed);
      }
      return;
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted.includes(",")) {
      e.preventDefault();
      addTagsFromCommaSeparated(pasted);
      setInput("");
      setSuggestions([]);
      setOpen(false);
    }
  };

  const showDropdown = open && input.trim().length > 0;

  return (
    <div className="form-control" ref={containerRef}>
      <div className="flex flex-wrap gap-2 p-2 input input-bordered w-full min-h-12">
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="badge badge-ghost badge-sm gap-1 pr-1"
          >
            {tag}
            <button
              type="button"
              className="btn btn-ghost btn-xs p-0 min-h-0 h-4 w-4 rounded-full"
              aria-label={`Tag ${tag} entfernen`}
              onClick={() => removeTag(i)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          className="flex-1 min-w-[120px] outline-none bg-transparent"
          placeholder={value.length === 0 ? placeholder : ""}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => input.trim() && setOpen(true)}
        />
      </div>
      {showDropdown && (
        <ul className="menu bg-base-200 rounded-box mt-1 w-full max-h-48 overflow-auto shadow-lg z-10">
          {loading && (
            <li>
              <span className="flex items-center gap-2">
                <span className="loading loading-spinner loading-sm" />
                Suchen…
              </span>
            </li>
          )}
          {!loading &&
            suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => addTag(s.name)}
                  className="flex items-center justify-between"
                >
                  {s.name}
                  {value.map((t) => t.toLowerCase()).includes(s.name.toLowerCase()) && (
                    <span className="text-success text-xs">✓</span>
                  )}
                </button>
              </li>
            ))}
          {!loading && (
            <li>
              <button
                type="button"
                onClick={() => addTag(input.trim())}
                className="text-primary"
              >
                „{input.trim()}“ anlegen
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
