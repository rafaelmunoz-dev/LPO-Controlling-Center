import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GLOSSARY, type GlossaryKey } from "@/data";
import { useAppStore } from "@/hooks/use-app-context";

export function Term({ k, children }: { k: GlossaryKey; children?: React.ReactNode }) {
  const language = useAppStore((s) => s.language);
  const entry = GLOSSARY[k][language];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="cursor-help underline decoration-dotted decoration-brass/70 underline-offset-4"
          style={{ textDecorationColor: "rgba(199,161,90,0.7)" }}
          data-testid={`term-${k}`}
        >
          {children ?? entry.term}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-semibold mb-1">{entry.term}</p>
        <p className="text-xs leading-relaxed opacity-90">{entry.text}</p>
      </TooltipContent>
    </Tooltip>
  );
}
