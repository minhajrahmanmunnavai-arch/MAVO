import { useState } from "react";
import { Copy, Trash2, X } from "lucide-react";

const MAX_CHARACTERS = 500;

const getCharacterCount = (tags, inputValue = "") =>
  [...tags, ...(inputValue ? [inputValue] : [])].join(", ").length;

const appendTag = (tags, value) => {
  const tag = value.trim();
  if (!tag || tags.some((existingTag) => existingTag.toLowerCase() === tag.toLowerCase())) {
    return tags;
  }

  const nextTags = [...tags, tag];
  return getCharacterCount(nextTags) <= MAX_CHARACTERS ? nextTags : tags;
};

export default function TagInput({ value = [], onChange }) {
  const [inputValue, setInputValue] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const tags = Array.isArray(value) ? value : [];

  const addInputTag = () => {
    const nextTags = appendTag(tags, inputValue);
    if (nextTags !== tags || !inputValue.trim()) {
      onChange(nextTags);
      setInputValue("");
    }
  };

  const handleInputChange = (event) => {
    const enteredValue = event.target.value;
    if (!enteredValue.includes(",")) {
      if (getCharacterCount(tags, enteredValue) <= MAX_CHARACTERS) {
        setInputValue(enteredValue);
      }
      return;
    }

    const segments = enteredValue.split(",");
    let nextTags = tags;
    segments.slice(0, -1).forEach((segment) => {
      nextTags = appendTag(nextTags, segment);
    });

    const remainingInput = segments[segments.length - 1];
    if (getCharacterCount(nextTags, remainingInput) <= MAX_CHARACTERS) {
      onChange(nextTags);
      setInputValue(remainingInput);
    } else {
      onChange(nextTags);
      setInputValue("");
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addInputTag();
    } else if (event.key === "Backspace" && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const copyTags = async () => {
    try {
      await navigator.clipboard.writeText(tags.join(", "));
      setCopyMessage("Copied");
    } catch {
      setCopyMessage("Unable to copy tags.");
    }
  };

  const characterCount = getCharacterCount(tags, inputValue);

  return (
    <div className="space-y-2">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={copyTags}
          disabled={tags.length === 0}
          aria-label="Copy all tags"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Copy size={14} aria-hidden="true" />
          Copy
        </button>
        <button
          type="button"
          onClick={() => {
            onChange([]);
            setInputValue("");
            setCopyMessage("");
          }}
          disabled={tags.length === 0 && !inputValue}
          aria-label="Clear all tags"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={14} aria-hidden="true" />
          Clear all
        </button>
      </div>

      <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100">
        {tags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex max-w-full items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
          >
            <span className="truncate">{tag}</span>
            <button
              type="button"
              onClick={() => onChange(tags.filter((_, tagIndex) => tagIndex !== index))}
              aria-label={`Remove ${tag}`}
              className="shrink-0 rounded-full p-0.5 text-gray-500 transition hover:bg-gray-200 hover:text-gray-800"
            >
              <X size={12} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? "Enter a comma after each tag" : ""}
          aria-label="Enter a comma after each tag"
          className="min-w-32 flex-1 border-0 bg-transparent p-1 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:ring-0"
        />
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
        <div>
          <p>Enter a comma after each tag</p>
          {copyMessage && (
            <p aria-live="polite" className="mt-1 text-gray-600">
              {copyMessage}
            </p>
          )}
        </div>
        <span className="shrink-0 tabular-nums" aria-live="polite">
          {characterCount}/{MAX_CHARACTERS}
        </span>
      </div>
    </div>
  );
}
