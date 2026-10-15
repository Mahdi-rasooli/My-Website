import { isPlaceholder } from "@/content/profile";

/**
 * Renders profile copy. Values still marked `TODO(mahdi)` show as a dashed
 * "fill me in" slot so they are easy to spot and never look like real facts.
 */
export default function Fill({ text, className = "" }: { text: string; className?: string }) {
  if (!isPlaceholder(text)) return <span className={className}>{text}</span>;
  const hint = text.replace(/^.*TODO\(mahdi\):\s*/, "").trim() || "to fill in";
  const before = text.slice(0, text.indexOf("TODO")).trim();
  return (
    <span className={className}>
      {before && `${before} `}
      <span
        className="rounded-[2px] border border-dashed border-amber/50 px-1.5 text-amber/80"
        title="Placeholder: edit src/content/profile.ts"
      >
        {hint}
      </span>
    </span>
  );
}
