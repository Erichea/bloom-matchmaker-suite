import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { NotionLikeEditor } from "@/editor/plateEditor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClientNotesEditorProps {
  profileId: string;
  initialContent: string | null;
  initialUpdatedAt?: string | null;
  onSaved?: (payload: { content: string; savedAt: string }) => void;
}

const extractTextFromNode = (node: any): string => {
  if (!node) return "";
  if (node.text) return node.text;
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractTextFromNode).join("");
  }
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(extractTextFromNode).join("");
  }
  return "";
};

const parseInitialContent = (content: string | null): any[] => {
  if (!content) {
    return [
      {
        type: "p",
        children: [{ text: "" }],
      },
    ];
  }

  try {
    const parsed = JSON.parse(content);

    if (parsed.type === "doc" && parsed.content) {
      const text = parsed.content.map((node: any) => extractTextFromNode(node)).filter(Boolean).join("\n");
      return [
        {
          type: "p",
          children: [{ text }],
        },
      ];
    }

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }

    return [
      {
        type: "p",
        children: [{ text: typeof parsed === "string" ? parsed : content }],
      },
    ];
  } catch (error) {
    return [
      {
        type: "p",
        children: [{ text: content }],
      },
    ];
  }
};

const ClientNotesEditor = ({ profileId, initialContent, initialUpdatedAt, onSaved }: ClientNotesEditorProps) => {
  const { toast } = useToast();
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    initialUpdatedAt ? new Date(initialUpdatedAt) : null,
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimeoutRef = useRef<number | null>(null);
  const lastSyncedContent = useRef<string | null>(null);

  const initialValue = useMemo(() => parseInitialContent(initialContent), [initialContent]);
  const editorKey = useMemo(
    () => `${profileId}-${initialUpdatedAt ?? "init"}-${initialContent ?? "empty"}`,
    [profileId, initialUpdatedAt, initialContent],
  );

  useEffect(() => () => saveTimeoutRef.current && clearTimeout(saveTimeoutRef.current), []);

  const handleChange = useCallback(
    async (_value: any[], json: string) => {
      if (json === lastSyncedContent.current) return;
      setStatus("saving");
      saveTimeoutRef.current && clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = window.setTimeout(async () => {
        const { error } = await supabase
          .from("profiles")
          .update({ admin_notes: json })
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

        lastSyncedContent.current = json;
        const savedAt = new Date();
        setLastSavedAt(savedAt);
        setStatus("saved");
        onSaved?.({ content: json, savedAt: savedAt.toISOString() });
      }, 500);
    },
    [profileId, toast, onSaved],
  );

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
      <div className="flex-1 overflow-y-auto pt-4">
        <NotionLikeEditor
          key={editorKey}
          initialValue={initialValue}
          onChange={handleChange}
          placeholder="Type / for commands or start writing..."
        />
      </div>
    </div>
  );
};

export default ClientNotesEditor;
