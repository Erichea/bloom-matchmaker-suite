import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface ClientNotesEditorProps {
  profileId: string;
  initialContent: string | null;
  initialUpdatedAt?: string | null;
  onSaved?: (payload: { content: string; savedAt: string }) => void;
}

const extractTextFromNode = (node: any): string => {
  if (!node) return "";

  // Direct text node
  if (node.text) return node.text;

  // Node with content array (TipTap format)
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractTextFromNode).join("");
  }

  // Node with children array (Slate/Plate format)
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(extractTextFromNode).join("");
  }

  return "";
};

const parseInitialContent = (content: string | null): string => {
  if (!content) return "";

  try {
    const parsed = JSON.parse(content);

    // TipTap format: { type: "doc", content: [...] }
    if (parsed.type === "doc" && parsed.content) {
      return parsed.content.map((node: any) => {
        const text = extractTextFromNode(node);
        // Add newline between block elements
        return text;
      }).filter(Boolean).join("\n");
    }

    // Slate/Plate format: array of nodes
    if (Array.isArray(parsed)) {
      return parsed.map((node: any) => extractTextFromNode(node)).filter(Boolean).join("\n");
    }

    return content;
  } catch (error) {
    return content;
  }
};

const ClientNotesEditor = ({ profileId, initialContent, initialUpdatedAt, onSaved }: ClientNotesEditorProps) => {
  const { toast } = useToast();
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    initialUpdatedAt ? new Date(initialUpdatedAt) : null,
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const lastSyncedContent = useRef<string>("");
  const [currentContent, setCurrentContent] = useState<string>("");

  useEffect(() => {
    const parsed = parseInitialContent(initialContent);
    lastSyncedContent.current = parsed;
    setCurrentContent(parsed);
    setStatus("idle");
    setLastSavedAt(initialUpdatedAt ? new Date(initialUpdatedAt) : null);
  }, [initialContent, initialUpdatedAt]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentContent(e.target.value);
  }, []);

  useEffect(() => {
    if (!profileId || currentContent === lastSyncedContent.current) return;

    setStatus("saving");
    const handler = setTimeout(async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ admin_notes: currentContent })
        .eq("id", profileId);

      if (error) {
        console.error("Failed to save admin notes", error);
        setStatus("error");
        toast({
          title: "Unable to save",
          description: "We couldn't save your notes. We'll retry when new changes are made.",
          variant: "destructive",
        });
        return;
      }

      lastSyncedContent.current = currentContent;
      const savedAt = new Date();
      setLastSavedAt(savedAt);
      setStatus("saved");
      onSaved?.({ content: currentContent, savedAt: savedAt.toISOString() });
    }, 1000);

    return () => clearTimeout(handler);
  }, [currentContent, profileId, toast, onSaved]);

  const formattedTimestamp = useMemo(() => {
    if (!lastSavedAt) return null;
    try {
      return format(lastSavedAt, "MMM d, yyyy • h:mm a");
    } catch (error) {
      return null;
    }
  }, [lastSavedAt]);

  const statusLabel = useMemo(() => {
    if (status === "saving") return "Saving...";
    if (status === "error") return "Save failed. Waiting for new changes...";
    if (status === "saved") return formattedTimestamp ? `Last edited ${formattedTimestamp}` : "Saved";
    return formattedTimestamp ? `Last edited ${formattedTimestamp}` : "Start taking notes";
  }, [status, formattedTimestamp]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border pb-3 text-xs text-muted-foreground">
        <span>{statusLabel}</span>
        {status === "saving" && <span className="text-foreground">●</span>}
      </div>
      <div className="flex-1 pt-4">
        <Textarea
          value={currentContent}
          onChange={handleChange}
          placeholder="Start taking notes..."
          className="h-full min-h-full resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm leading-relaxed"
        />
      </div>
    </div>
  );
};

export default ClientNotesEditor;
