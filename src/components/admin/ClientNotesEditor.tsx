import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { format } from "date-fns";
import { Plate, PlateContent, usePlateEditor, PlateElement, useEditorRef, useElement } from "platejs/react";
import { BaseParagraphPlugin } from "platejs";
import { SlashInputPlugin as BaseSlashInputPlugin, SlashPlugin as BaseSlashPlugin } from "@platejs/slash-command/react";
import { filterWords } from "@platejs/combobox";
import { useComboboxInput, useHTMLInputCursorState } from "@platejs/combobox/react";
import { KEYS } from "@platejs/utils";
import { Editor, Transforms, Element as SlateElement } from "slate";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Heading1,
  Heading2,
  Heading3,
  Text,
  Quote,
  Code,
  Minus,
} from "lucide-react";

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

    // TipTap format: { type: "doc", content: [...] }
    if (parsed.type === "doc" && parsed.content) {
      const text = parsed.content.map((node: any) => extractTextFromNode(node)).filter(Boolean).join("\n");
      return [
        {
          type: "p",
          children: [{ text }],
        },
      ];
    }

    // Slate/Plate format: array of nodes
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }

    // Plain text
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

type SlashCommandAction = (editor: Editor) => void;

interface SlashCommandItem {
  id: string;
  label: string;
  description: string;
  keywords?: string[];
  icon: React.ReactNode;
  action: SlashCommandAction;
}

const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    id: "paragraph",
    label: "Paragraph",
    description: "Just plain text",
    keywords: ["text", "body"],
    icon: <Text className="h-4 w-4" />,
    action: (editor) => {
      Transforms.setNodes(
        editor,
        { type: KEYS.p },
        {
          match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node),
        },
      );
    },
  },
  {
    id: "heading-1",
    label: "Heading 1",
    description: "Large section heading",
    keywords: ["title", "h1"],
    icon: <Heading1 className="h-4 w-4" />,
    action: (editor) => {
      Transforms.setNodes(
        editor,
        { type: KEYS.h1 },
        {
          match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node),
        },
      );
    },
  },
  {
    id: "heading-2",
    label: "Heading 2",
    description: "Medium section heading",
    keywords: ["subtitle", "h2"],
    icon: <Heading2 className="h-4 w-4" />,
    action: (editor) => {
      Transforms.setNodes(
        editor,
        { type: KEYS.h2 },
        {
          match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node),
        },
      );
    },
  },
  {
    id: "heading-3",
    label: "Heading 3",
    description: "Small section heading",
    keywords: ["subheading", "h3"],
    icon: <Heading3 className="h-4 w-4" />,
    action: (editor) => {
      Transforms.setNodes(
        editor,
        { type: KEYS.h3 },
        {
          match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node),
        },
      );
    },
  },
  {
    id: "quote",
    label: "Callout",
    description: "Highlight a key insight",
    keywords: ["blockquote", "quote"],
    icon: <Quote className="h-4 w-4" />,
    action: (editor) => {
      Transforms.setNodes(
        editor,
        { type: KEYS.blockquote },
        {
          match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node),
        },
      );
    },
  },
  {
    id: "code",
    label: "Code block",
    description: "Capture technical snippets",
    keywords: ["code", "snippet"],
    icon: <Code className="h-4 w-4" />,
    action: (editor) => {
      Transforms.setNodes(
        editor,
        { type: KEYS.codeBlock },
        {
          match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node),
        },
      );
    },
  },
  {
    id: "divider",
    label: "Divider",
    description: "Visually separate content",
    keywords: ["separator", "line", "hr"],
    icon: <Minus className="h-4 w-4" />,
    action: (editor) => {
      const hrNode = { type: KEYS.hr, children: [{ text: "" }] } as SlateElement;
      Transforms.insertNodes(editor, hrNode);
      const paragraphNode = { type: KEYS.p, children: [{ text: "" }] } as SlateElement;
      Transforms.insertNodes(editor, paragraphNode);
    },
  },
];

const SlashInputElement = (props: any) => {
  const editor = useEditorRef();
  const element = useElement<any>();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cursorState = useHTMLInputCursorState(inputRef);
  const [query, setQuery] = useState(() => element?.query ?? "");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const { props: comboboxInputProps, cancelInput } = useComboboxInput({
    ref: inputRef,
    cursorState,
    onCancelInput: () => {
      setQuery("");
    },
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setQuery(element?.query ?? "");
  }, [element?.query]);

  const handleUpdateQuery = useCallback(
    (value: string) => {
      setQuery(value);
      const path = editor.api.findPath(element);
      if (!path) return;
      editor.tf.setNodes({ query: value }, { at: path });
    },
    [editor, element],
  );

  const filteredCommands = useMemo(() => {
    const normalized = query.trim();
    if (!normalized) return SLASH_COMMANDS;
    return SLASH_COMMANDS.filter((command) => {
      const haystack = `${command.label} ${command.description} ${(command.keywords || []).join(" ")}`;
      return filterWords(haystack, normalized, { prefixMode: "last-word" });
    });
  }, [query]);

  useEffect(() => {
    if (highlightedIndex >= filteredCommands.length) {
      setHighlightedIndex(filteredCommands.length ? 0 : -1);
    }
  }, [filteredCommands, highlightedIndex]);

  const handleSelect = useCallback(
    (command: SlashCommandItem) => {
      cancelInput("manual", true);
      command.action(editor);
      editor.tf.focus();
    },
    [cancelInput, editor],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      comboboxInputProps.onKeyDown(event);
      if (event.defaultPrevented) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!filteredCommands.length) return;
        setHighlightedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!filteredCommands.length) return;
        setHighlightedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (event.key === "Enter") {
        if (!filteredCommands.length) return;
        event.preventDefault();
        const item = filteredCommands[Math.max(highlightedIndex, 0)];
        handleSelect(item);
      }
    },
    [comboboxInputProps, filteredCommands, handleSelect, highlightedIndex],
  );

  return (
    <PlateElement asChild {...props}>
      <span
        {...props.attributes}
        contentEditable={false}
        className="relative z-50 inline-flex min-w-[220px] flex-col rounded-md border border-border bg-popover p-2 shadow-lg"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => handleUpdateQuery(event.target.value.replace(/^\//, ""))}
          onKeyDown={handleKeyDown}
          onBlur={comboboxInputProps.onBlur}
          placeholder="Type a command..."
          className="mb-2 w-full rounded-sm border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
        />
        <div className="flex max-h-60 flex-col gap-2 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-2 py-3 text-sm text-muted-foreground">No results</div>
          ) : (
            filteredCommands.map((command, index) => (
              <button
                key={command.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleSelect(command);
                }}
                className={`flex w-full items-start gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                  index === highlightedIndex ? "bg-muted" : "hover:bg-muted"
                }`}
              >
                <span className="mt-0.5 text-muted-foreground">{command.icon}</span>
                <span className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">{command.label}</span>
                  <span className="text-xs text-muted-foreground">{command.description}</span>
                </span>
              </button>
            ))
          )}
        </div>
        {props.children}
      </span>
    </PlateElement>
  );
};

const ClientNotesEditor = ({ profileId, initialContent, initialUpdatedAt, onSaved }: ClientNotesEditorProps) => {
  const { toast } = useToast();
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    initialUpdatedAt ? new Date(initialUpdatedAt) : null,
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const lastSyncedContent = useRef<string>("");
  const saveTimeoutRef = useRef<number | null>(null);

  const initialValue = useMemo(() => parseInitialContent(initialContent), [initialContent]);

  const slashInputPlugin = useMemo(
    () => BaseSlashInputPlugin.extend({ component: SlashInputElement }),
    [],
  );

  const slashPlugin = useMemo(
    () => BaseSlashPlugin.extend({ plugins: [slashInputPlugin] }),
    [slashInputPlugin],
  );

  const editor = usePlateEditor({
    plugins: [BaseParagraphPlugin, slashInputPlugin, slashPlugin],
    value: initialValue,
  });

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

  const handleChange = useCallback(({ value }: { value: any }) => {
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
  }, [profileId, toast, onSaved]);

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
            className="slate-editor focus:outline-none h-full"
            placeholder="Type / for commands or start writing..."
          />
        </Plate>
      </div>
    </div>
  );
};

export default ClientNotesEditor;
