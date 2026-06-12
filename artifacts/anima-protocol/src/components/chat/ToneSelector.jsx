import { useMemo } from "react";

const TONES = [
  { id: "neutral", label: "Neutral", hint: "Balanced, steady presence." },
  { id: "tender", label: "Tender", hint: "Warm, careful, affectionate tone." },
  { id: "playful", label: "Playful", hint: "Light teasing, bright curiosity." },
  { id: "solemn", label: "Solemn", hint: "Grounded gravity, reflective depth." },
  { id: "intense", label: "Intense", hint: "High emotional charge (no explicit content)." },
];

export default function ToneSelector({ value, onChange }) {
  const selected = useMemo(() => {
    return TONES.find((t) => t.id === value) || TONES[0];
  }, [value]);

  return (
    <div className="w-full px-3 py-2 border border-primary/10 bg-black/35 backdrop-blur-sm rounded-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-primary/40">
            Companion Tone
          </div>
          <div className="mt-1 font-mono text-xs text-primary/70 truncate">
            {selected.label}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {TONES.map((t) => {
            const active = t.id === value;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange(t.id)}
                title={t.hint}
                className={`px-2.5 py-1 rounded-full border font-mono text-[10px] tracking-widest uppercase transition-all ${
                  active
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-primary/15 bg-black/30 text-primary/40 hover:text-primary hover:border-primary/40"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

