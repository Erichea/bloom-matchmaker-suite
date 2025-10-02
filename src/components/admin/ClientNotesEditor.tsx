import type { ComponentType } from "react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Suggestion from "@tiptap/suggestion";
import { Extension, Range } from "@tiptap/core";
import tippy, { Instance as TippyInstance } from "tippy.js";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import "tippy.js/dist/tippy.css";
import "tippy.js/animations/shift-away-subtle.css";
import {
  Heading1,
  Heading2,
  Heading3,
  Text,
  List as ListIcon,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Code,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClientNotesEditorProps {
  profileId: string;
  initialContent: string | null;
  initialUpdatedAt?: string | null;
  onSaved?: (payload: { content: string; savedAt: string }) => void;
}

interface CommandItem {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  command: (props: { editor: any; range: Range }) => void;
  keywords: string[];
}

const COMMAND_ITEMS: CommandItem[] = [
  {
    title: "Heading 1",
    description: "Large section title",
    icon: Heading1,
    keywords: ["h1", "heading", "title"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    keywords: ["h2", "heading", "subtitle"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: Heading3,
    keywords: ["h3", "heading"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    title: "Text",
    description: "Start writing with plain text",
    icon: Text,
    keywords: ["paragraph", "text"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: "Bullet list",
    description: "Create a simple bulleted list",
    icon: ListIcon,
    keywords: ["bullet", "list", "unordered"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered list",
    description: "Organize items with numbers",
    keywords: ["ordered", "list", "number"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Todo list",
    description: "Track action items with checkboxes",
    icon: CheckSquare,
    keywords: ["todo", "task", "checkbox"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Quote",
    description: "Highlight a key insight",
    icon: Quote,
    keywords: ["quote", "callout"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Divider",
    description: "Visually separate content",
    icon: Minus,
    keywords: ["divider", "separator", "hr"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "Code block",
    description: "Capture technical snippets",
    icon: Code,
    keywords: ["code", "snippet"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCodeBlock().run();
    },
  },
];

type SlashCommandListProps = {
  items: CommandItem[];
  command: (item: CommandItem) => void;
  editor: any;
};

type SlashCommandListHandle = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

const SlashCommandList = forwardRef<SlashCommandListHandle, SlashCommandListProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) {
        command(item);
      }
    },
    [items, command],
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [items.length]);

  useEffect(() => {
    if (items.length === 0) {
      setSelectedIndex(-1);
    }
  }, [items]);

  const onKeyDown = useCallback(
    ({ event }: { event: KeyboardEvent }) => {
      if (items.length === 0) {
        return false;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        const newIndex = (selectedIndex + items.length - 1) % items.length;
        setSelectedIndex(newIndex);
        return true;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        const newIndex = (selectedIndex + 1) % items.length;
        setSelectedIndex(newIndex);
        return true;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        selectItem(selectedIndex === -1 ? 0 : selectedIndex);
        return true;
      }
      return false;
    },
    [items, selectItem, selectedIndex],
  );

  useImperativeHandle(ref, () => ({
    onKeyDown,
  }));

  if (!items.length) {
    return (
      <div className="rounded-lg border border-border bg-popover p-3 text-sm text-muted-foreground shadow-lg">
        No commands found
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="w-64 overflow-hidden rounded-lg border border-border bg-popover shadow-xl"
      >
        <div className="py-1">
          {items.map((item, index) => {
            const Icon = item.icon;
            const isActive = index === selectedIndex;
            return (
              <button
                key={item.title}
                type="button"
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${isActive ? "bg-muted/80 text-foreground" : "text-muted-foreground hover:bg-muted/60"}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectItem(index);
                }}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="font-medium text-foreground">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

const SlashCommand = Extension.create({
  name: "slash-command",
  addProseMirrorPlugins() {
    return [
      Suggestion<CommandItem>({
        editor: this.editor,
        char: "/",
        allowSpaces: true,
        startOfLine: false,
        render: () => {
          let component: ReactRenderer | null = null;
          let popup: TippyInstance | null = null;

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashCommandList, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "left-start",
                animation: "shift-away-subtle",
              });
            },
            onUpdate(props) {
              component?.updateProps(props);

              if (!props.clientRect) {
                return;
              }

              popup?.setProps({
                getReferenceClientRect: props.clientRect,
              });
            },
            onKeyDown(props) {
              if (props.event.key === "Escape") {
                popup?.hide();
                return true;
              }

              if (component?.ref?.onKeyDown?.(props)) {
                return true;
              }

              return false;
            },
            onExit() {
              popup?.destroy();
              popup = null;
              component?.destroy();
              component = null;
            },
          };
        },
        items: ({ query }) => {
          if (!query) {
            return COMMAND_ITEMS;
          }

          return COMMAND_ITEMS.filter((item) => {
            const normalizedQuery = query.toLowerCase();
            return (
              item.title.toLowerCase().includes(normalizedQuery) ||
              item.keywords.some((keyword) => keyword.includes(normalizedQuery))
            );
          });
        },
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      }),
    ];
  },
});

const parseInitialContent = (content: string | null) => {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      return parsed;
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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        history: true,
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands or start writing...",
        emptyEditorClass: "is-editor-empty",
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "notion-task-list",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "notion-task-item",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline-offset-4 hover:underline",
        },
      }),
      SlashCommand,
    ],
    editorProps: {
      attributes: {
        class: "tiptap focus:outline-none",
      },
    },
    autofocus: false,
  });

  useEffect(() => {
    if (!editor) return;
    const parsedContent = parseInitialContent(initialContent);
    if (!parsedContent) {
      editor.commands.clearContent(true);
    } else if (typeof parsedContent === "string") {
      editor.commands.setContent(parsedContent, false);
    } else {
      editor.commands.setContent(parsedContent, false);
    }

    const synced = JSON.stringify(editor.getJSON());
    lastSyncedContent.current = synced;
    setCurrentContent(synced);
    setStatus("idle");
    setLastSavedAt(initialUpdatedAt ? new Date(initialUpdatedAt) : null);
  }, [editor, initialContent, initialUpdatedAt]);

  useEffect(() => {
    if (!editor) return;

    const updateHandler = () => {
      const json = JSON.stringify(editor.getJSON());
      setCurrentContent(json);
    };

    editor.on("update", updateHandler);
    return () => {
      editor.off("update", updateHandler);
    };
  }, [editor]);

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

  if (!editor) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Initializing editor...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border pb-3 text-xs text-muted-foreground">
        <span>{statusLabel}</span>
        {status === "saving" && <span className="text-foreground">●</span>}
      </div>
      <div className="flex-1 overflow-y-auto pt-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default ClientNotesEditor;
