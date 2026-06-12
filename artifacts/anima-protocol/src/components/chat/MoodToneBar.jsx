import { useMemo } from "react";
import ToneSelector from "./ToneSelector";

/**
 * Combines tone selection (user intent) with a lightweight indicator.
 * This is UI-only: the actual tone gets passed into the prompt via
 * Chat -> chat.completeMessage systemPrompt.
 */
export default function MoodToneBar({ tone, onToneChange }) {
  const safeTone = useMemo(() => String(tone || "neutral"), [tone]);

  return (
    <div className="px-2 sm:px-4 pt-2">
      <ToneSelector value={safeTone} onChange={onToneChange} />
    </div>
  );
}

