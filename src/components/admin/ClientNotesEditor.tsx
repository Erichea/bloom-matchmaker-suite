import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPlateEditor, Plate, PlateContent } from "@platejs/core";
import { createParagraphPlugin } from "@platejs/basic-nodes";
import { createHeadingPlugin } from "@platejs/basic-nodes";
import { createBlockquotePlugin } from "@platejs/basic-nodes";
import { createCodeBlockPlugin } from "@platejs/basic-nodes";
import { createHorizontalRulePlugin } from "@platejs/basic-nodes";
import { createBoldPlugin, createItalicPlugin, createUnderlinePlugin, createStrikethroughPlugin, createCodePlugin } from "@platejs/basic-marks";
import { createListPlugin, createTodoListPlugin } from "@platejs/list";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClientNotesEditorProps {
  profileId: string;
  initialContent: string | null;
  initialUpdatedAt?: string | null;
  onSaved?: (payload: { content: string; savedAt: string }) => void;
}

const parseInitialContent = (content: string | null) => {
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
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [
      {
        type: "p",
        children: [{ text: content }],
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
  const lastSyncedContent = useRef<string>("");
  const [currentContent, setCurrentContent] = useState<string>("");

  const plugins = useMemo(
    () => [
      createParagraphPlugin(),
      createHeadingPlugin(),
      createBlockquotePlugin(),
      createCodeBlockPlugin(),
      createHorizontalRulePlugin(),
      createBoldPlugin(),
      createItalicPlugin(),
      createUnderlinePlugin(),
      createStrikethroughPlugin(),
      createCodePlugin(),
      createListPlugin(),
      createTodoListPlugin(),
    ],
    []
  );

  const initialValue = useMemo(() => parseInitialContent(initialContent), [initialContent]);

  const editor = useMemo(
    () =>
      createPlateEditor({
        plugins,
        value: initialValue,
      }),
    [plugins, initialValue]
  );

  useEffect(() => {
    const synced = JSON.stringify(editor.children);
    lastSyncedContent.current = synced;
    setCurrentContent(synced);
    setStatus("idle");
    setLastSavedAt(initialUpdatedAt ? new Date(initialUpdatedAt) : null);
  }, [editor, initialUpdatedAt]);

  const handleChange = useCallback((value: any) => {
    const json = JSON.stringify(value);
    setCurrentContent(json);
  }, []);

  useEffect(() => {
    if (!profileId || !currentContent) return;
    if (currentContent === lastSyncedContent.current) return;

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
      <div className="flex-1 overflow-y-auto pt-4">
        <Plate editor={editor} onChange={handleChange}>
          <PlateContent
            className="slate-editor focus:outline-none"
            placeholder="Type / for commands or start writing..."
          />
        </Plate>
      </div>
    </div>
  );
};

export default ClientNotesEditor;
