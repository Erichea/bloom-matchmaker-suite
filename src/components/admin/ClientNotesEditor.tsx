import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";
import { BaseParagraphPlugin } from "platejs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Editor, Element as SlateElement, Point, Range, Transforms } from "slate";
import { ReactEditor } from "slate-react";
import { Heading1, Heading2, Heading3, Minus, Quote, Code, Text } from "lucide-react";

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

type SlashCommand = {
  id: string;
  label: string;
  description: string;
  keywords?: string[];
  icon: ReactNode;
  action: (editor: Editor) => void;
};

const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "paragraph",
    label: "Paragraph",
    description: "Basic text",
    keywords: ["text", "body"],
    icon: <Text className="h-4 w-4" />,
    action: (editor) => {
      Transforms.setNodes(
        editor,
        { type: "p" },
        { match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node) },
      );
    },
  },
  {
    id: "heading-1",
    label: "Heading 1",
    description: "Large section title",
    keywords: ["title", "h1"],
    icon: <Heading1 className="h-4 w-4" />,
    action: (editor) => {
      Transforms.setNodes(
        editor,
        { type: "h1" },
        { match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node) },
      );
    },
  },
  {
    id: "heading-2",
    label: "Heading 2",
    description: "Section heading",
    keywords: ["subtitle", "h2"],
    icon: <Heading2 className="h-4 w-4" />,
    action: (editor) => {
      Transforms.setNodes(
        editor,
        { type: "h2" },
        { match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node) },
      );
    },
  },
  {
    id: "heading-3",
    label: "Heading 3",
    description: "Small heading",
    keywords: ["subheading", "h3"],
    icon: <Heading3 className="h-4 w-4" />,
    action: (editor) => {
      Transforms.setNodes(
        editor,
        { type: "h3" },
        { match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node) },
      );
    },
  },
  {
    id: "quote",
    label: "Callout",
    description: "Stylized quote",
    keywords: ["blockquote", "quote", "callout"],
    icon: <Quote className="h-4 w-4" />,
    action: (editor) => {
      Transforms.setNodes(
        editor,
        { type: "blockquote" },
        { match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node) },
      );
    },
  },
  {
    id: "code",
    label: "Code block",
    description: "Capture code snippets",
    keywords: ["code", "snippet"],
    icon: <Code className="h-4 w-4" />,
    action: (editor) => {
      Transforms.setNodes(
        editor,
        { type: "code_block" },
        { match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node) },
      );
    },
  },
  {
    id: "divider",
    label: "Divider",
    description: "Separate sections",
    keywords: ["separator", "line", "hr"],
    icon: <Minus className="h-4 w-4" />,
    action: (editor) => {
      const divider = { type: "divider", children: [{ text: "" }] } as SlateElement;
      Transforms.insertNodes(editor, divider);
      const paragraph = { type: "p", children: [{ text: "" }] } as SlateElement;
      Transforms.insertNodes(editor, paragraph, { select: true });
    },
  },
];

interface SlashState {
  open: boolean;
  start: Point | null;
  query: string;
  highlight: number;
}

type SlashMenuPosition = { top: number; left: number } | null;

const filterCommands = (commands: SlashCommand[], query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return commands;
  return commands.filter((command) => {
    const haystack = [command.label, command.description, ...(command.keywords ?? [])]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
};

const renderElement = (props: any) => {
  const { element, attributes, children } = props;
  switch (element.type) {
    case "h1":
      return (
        <h1 {...attributes} className="text-2xl font-semibold tracking-tight">
          {children}
        </h1>
      );
    case "h2":
      return (
        <h2 {...attributes} className="text-xl font-semibold">
          {children}
        </h2>
      );
    case "h3":
      return (
        <h3 {...attributes} className="text-lg font-semibold">
          {children}
        </h3>
      );
    case "blockquote":
      return (
        <blockquote {...attributes} className="border-l-4 border-muted pl-4 italic text-muted-foreground">
          {children}
        </blockquote>
      );
    case "code_block":
      return (
        <pre {...attributes} className="rounded-md bg-muted p-3 text-sm font-mono">
          <code>{children}</code>
        </pre>
      );
    case "divider":
      return (
        <div {...attributes} contentEditable={false} className="my-6">
          <hr className="border-border" />
        </div>
      );
    default:
      return (
        <p {...attributes} className="leading-7">
          {children}
        </p>
      );
  }
};

const ClientNotesEditor = ({ profileId, initialContent, initialUpdatedAt, onSaved }: ClientNotesEditorProps) => {
  const { toast } = useToast();
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    initialUpdatedAt ? new Date(initialUpdatedAt) : null,
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const lastSyncedContent = useRef<string>("");
  const saveTimeoutRef = useRef<number | null>(null);
  const [slashState, setSlashState] = useState<SlashState>({ open: false, start: null, query: "", highlight: 0 });
  const [slashPosition, setSlashPosition] = useState<SlashMenuPosition>(null);

  const initialValue = useMemo(() => parseInitialContent(initialContent), [initialContent]);

  const editor = usePlateEditor({
    plugins: [BaseParagraphPlugin],
    value: initialValue,
  });

  const filteredCommands = useMemo(
    () => filterCommands(SLASH_COMMANDS, slashState.query),
    [slashState.query],
  );

  const closeSlashMenu = useCallback(
    (options: { removeCommand?: boolean } = {}) => {
      const { removeCommand = true } = options;
      if (removeCommand && slashState.start && editor.selection) {
        const range = { anchor: slashState.start, focus: editor.selection.anchor };
        Transforms.delete(editor, { at: range });
      }
      setSlashState({ open: false, start: null, query: "", highlight: 0 });
      setSlashPosition(null);
    },
    [editor, slashState.start, editor.selection, slashState.open],
  );

  const applySlashCommand = useCallback(
    (command: SlashCommand) => {
      if (!slashState.start || !editor.selection) return;
      const range = { anchor: slashState.start, focus: editor.selection.anchor };
      Transforms.delete(editor, { at: range });
      setSlashState({ open: false, start: null, query: "", highlight: 0 });
      setSlashPosition(null);
      command.action(editor);
    },
    [editor, slashState.start],
  );

  const moveHighlight = useCallback(
    (direction: 1 | -1) => {
      if (!filteredCommands.length) return;
      setSlashState((prev) => {
        const next = (prev.highlight + direction + filteredCommands.length) % filteredCommands.length;
        return { ...prev, highlight: next };
      });
    },
    [filteredCommands.length],
  );

  useEffect(() => {
    if (!slashState.open) return;
    if (slashState.highlight >= filteredCommands.length) {
      setSlashState((prev) => ({ ...prev, highlight: filteredCommands.length ? 0 : 0 }));
    }
  }, [filteredCommands.length, slashState.open, slashState.highlight]);

  useEffect(() => {
    const synced = JSON.stringify(editor.children);
    lastSyncedContent.current = synced;
    setStatus("idle");
    setLastSavedAt(initialUpdatedAt ? new Date(initialUpdatedAt) : null);
  }, [editor, initialUpdatedAt]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!slashState.open) return;
    if (!slashState.start || !editor.selection || !Range.isCollapsed(editor.selection)) {
      closeSlashMenu({ removeCommand: false });
      return;
    }

    const range = { anchor: slashState.start, focus: editor.selection.anchor };
    let text = Editor.string(editor, range);
    if (!text.startsWith("/")) {
      closeSlashMenu({ removeCommand: false });
      return;
    }

    const query = text.slice(1);
    if (query !== slashState.query) {
      setSlashState((prev) => ({ ...prev, query }));
    }

    try {
      const domRange = ReactEditor.toDOMRange(editor as any, range);
      const rect = domRange.getBoundingClientRect();
      setSlashPosition({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX });
    } catch (error) {
      setSlashPosition(null);
    }
  }, [editor, slashState.open, slashState.start, slashState.query, editor.selection, closeSlashMenu]);

  const handleChange = useCallback(
    ({ value }: { value: any }) => {
      const json = JSON.stringify(value);
      if (json === lastSyncedContent.current) return;

      setStatus("saving");
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

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
      }, 1000);
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

  const handleEditorKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!editor) return;

      if (slashState.open) {
        if (event.key === "ArrowDown" || (event.key === "Tab" && !event.shiftKey)) {
          event.preventDefault();
          moveHighlight(1);
          return;
        }
        if (event.key === "ArrowUp" || (event.key === "Tab" && event.shiftKey)) {
          event.preventDefault();
          moveHighlight(-1);
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          const command = filteredCommands[slashState.highlight] ?? filteredCommands[0];
          if (command) {
            applySlashCommand(command);
          }
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          closeSlashMenu();
          return;
        }
      }

      if (
        event.key === "/" &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !slashState.open
      ) {
        if (!editor.selection || !Range.isCollapsed(editor.selection)) return;
        event.preventDefault();
        Transforms.insertText(editor, "/");
        const anchorAfterInsert = editor.selection?.anchor;
        const slashStart = anchorAfterInsert ? Editor.before(editor, anchorAfterInsert, { unit: "character" }) : null;
        if (slashStart) {
          setSlashState({ open: true, start: slashStart, query: "", highlight: 0 });
        }
      }
    },
    [editor, slashState.open, slashState.highlight, moveHighlight, filteredCommands, applySlashCommand, closeSlashMenu],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border pb-3 text-xs text-muted-foreground">
        <span>{statusLabel}</span>
        {status === "saving" && <span className="text-foreground">●</span>}
      </div>
      <div className="flex-1 overflow-y-auto pt-4">
        <Plate editor={editor} onChange={handleChange}>
          <PlateContent
            className="slate-editor focus:outline-none h-full"
            placeholder="Type / for commands or start writing..."
            onKeyDown={handleEditorKeyDown}
            renderElement={renderElement}
          />
        </Plate>
      </div>
      {slashState.open && slashPosition && (
        <div
          className="fixed z-50 w-72 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
          style={{ top: slashPosition.top, left: slashPosition.left }}
        >
          <div className="max-h-64 overflow-y-auto py-2">
            {filteredCommands.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>
            ) : (
              filteredCommands.map((command, index) => {
                const isActive = index === slashState.highlight;
                return (
                  <button
                    key={command.id}
                    type="button"
                    className={`flex w-full items-start gap-3 px-3 py-2 text-left text-sm transition-colors ${
                      isActive ? "bg-muted" : "hover:bg-muted"
                    }`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      applySlashCommand(command);
                    }}
                  >
                    <span className="mt-0.5 text-muted-foreground">{command.icon}</span>
                    <span className="flex flex-col gap-1">
                      <span className="font-medium text-foreground">{command.label}</span>
                      <span className="text-xs text-muted-foreground">{command.description}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientNotesEditor;
