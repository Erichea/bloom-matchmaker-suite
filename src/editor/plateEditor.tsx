import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
  type ReactNode,
} from "react";
import {
  Plate,
  PlateContent,
  usePlateEditor,
  ParagraphPlugin,
} from "@platejs/core/react";
import { Editor, Element as SlateElement, Point, Range, Transforms } from "slate";
import { ReactEditor } from "slate-react";
import { slashCommands, type SlashCommand } from "@/slash/commands";

interface SlashState {
  open: boolean;
  start: Point | null;
  query: string;
  highlight: number;
}

interface NotionLikeEditorProps {
  initialValue: any[];
  onChange?: (value: any[], json: string, editor: Editor) => void;
  placeholder?: string;
  className?: string;
}

type SlashMenuPosition = { top: number; left: number } | null;

type CustomElement = SlateElement & { type?: string };

type RenderElementProps = {
  element: CustomElement;
  attributes: Record<string, unknown>;
  children: ReactNode;
};

const filterCommands = (query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return slashCommands;
  return slashCommands.filter((command) => {
    const haystack = [command.label, command.description, ...(command.keywords ?? [])]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
};

const renderElement = ({ element, attributes, children }: RenderElementProps) => {
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
        <blockquote
          {...attributes}
          className="border-l-4 border-muted pl-4 italic text-muted-foreground"
        >
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
    case "ul":
      return (
        <ul {...attributes} className="list-disc pl-6">
          {children}
        </ul>
      );
    case "ol":
      return (
        <ol {...attributes} className="list-decimal pl-6">
          {children}
        </ol>
      );
    case "li":
      return (
        <li {...attributes} className="leading-7">
          {children}
        </li>
      );
    default:
      return (
        <p {...attributes} className="leading-7">
          {children}
        </p>
      );
  }
};

export const NotionLikeEditor = ({
  initialValue,
  onChange,
  className,
  placeholder = "Type / for commands or start writing...",
}: NotionLikeEditorProps) => {
  const editor = usePlateEditor({
    plugins: [ParagraphPlugin],
    value: initialValue,
  }) as Editor | null;

  const [slashState, setSlashState] = useState<SlashState>({
    open: false,
    start: null,
    query: "",
    highlight: 0,
  });
  const [slashPosition, setSlashPosition] = useState<SlashMenuPosition>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const filteredCommands = useMemo(() => filterCommands(slashState.query), [slashState.query]);
  const listboxId = useId();
  const activeOptionId = slashState.open && filteredCommands[slashState.highlight]
    ? `${listboxId}-${filteredCommands[slashState.highlight].id}`
    : undefined;

  const closeSlashMenu = useCallback(
    (options: { removeCommand?: boolean } = {}) => {
      const { removeCommand = true } = options;
      if (removeCommand) {
        const { start } = slashState;
        if (start && editor && editor.selection) {
          const range = { anchor: start, focus: editor.selection.anchor };
          Transforms.delete(editor, { at: range });
        }
      }
      setSlashState({ open: false, start: null, query: "", highlight: 0 });
      setSlashPosition(null);
    },
    [editor, slashState],
  );

  const applySlashCommand = useCallback(
    (command: SlashCommand) => {
      if (!editor || !slashState.start || !editor.selection) return;
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

  const updateSlashPosition = useCallback(() => {
    if (!editor || !slashState.open || !slashState.start || !editor.selection || !Range.isCollapsed(editor.selection)) {
      return;
    }

    const range = { anchor: slashState.start, focus: editor.selection.anchor };

    try {
      const domRange = ReactEditor.toDOMRange(editor as any, range);
      const rect = domRange.getBoundingClientRect();
      const menuRect = menuRef.current?.getBoundingClientRect();
      const offset = 6;

      let top = rect.bottom + window.scrollY + offset;
      let left = rect.left + window.scrollX;

      if (menuRect) {
        const viewportWidth = window.innerWidth + window.scrollX;
        const viewportHeight = window.innerHeight + window.scrollY;

        if (left + menuRect.width > viewportWidth) {
          left = Math.max(window.scrollX + 8, viewportWidth - menuRect.width - 8);
        }

        if (top + menuRect.height > viewportHeight) {
          const flippedTop = rect.top + window.scrollY - menuRect.height - offset;
          top = flippedTop >= window.scrollY + 8 ? flippedTop : Math.max(window.scrollY + 8, top);
        }
      }

      setSlashPosition({ top, left });
    } catch (error) {
      setSlashPosition(null);
    }
  }, [editor, slashState]);

  useEffect(() => {
    if (!editor || !slashState.open) return;
    if (!slashState.start || !editor.selection || !Range.isCollapsed(editor.selection)) {
      closeSlashMenu({ removeCommand: false });
      return;
    }

    const range = { anchor: slashState.start, focus: editor.selection.anchor };
    const text = Editor.string(editor, range);

    if (!text.startsWith("/")) {
      closeSlashMenu({ removeCommand: false });
      return;
    }

    const query = text.slice(1);
    if (query !== slashState.query) {
      setSlashState((prev) => ({ ...prev, query }));
    }

    updateSlashPosition();
  }, [editor, slashState.open, slashState.start, slashState.query, editor.selection, closeSlashMenu, updateSlashPosition]);

  useEffect(() => {
    if (!slashState.open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && menuRef.current.contains(event.target as Node)) return;
      closeSlashMenu();
    };

    const handleScrollOrResize = () => {
      updateSlashPosition();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [slashState.open, closeSlashMenu, updateSlashPosition]);

  const handleChange = useCallback(
    ({ value }: { value: any[] }) => {
      const json = JSON.stringify(value);
      onChange?.(value, json, editor);
    },
    [editor, onChange],
  );

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
        if (!editor || !editor.selection || !Range.isCollapsed(editor.selection)) return;
        event.preventDefault();
        Transforms.insertText(editor, "/");
        const anchorAfterInsert = editor.selection?.anchor;
        const slashStart = anchorAfterInsert ? Editor.before(editor, anchorAfterInsert, { unit: "character" }) : null;
        if (slashStart) {
          setSlashState({ open: true, start: slashStart, query: "", highlight: 0 });
        }
      }
    },
    [editor, slashState.open, slashState.highlight, filteredCommands, applySlashCommand, closeSlashMenu, moveHighlight],
  );

  return (
    <Plate editor={editor as any} onChange={handleChange as any}>
      <PlateContent
        className="slate-editor h-full focus:outline-none"
        placeholder={placeholder}
        onKeyDown={handleEditorKeyDown}
        renderElement={renderElement}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={slashState.open}
        aria-controls={slashState.open ? listboxId : undefined}
        aria-activedescendant={activeOptionId}
      />
      {slashState.open && slashPosition && (
        <div
          ref={menuRef}
          className="fixed z-50 w-72 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
          role="listbox"
          id={listboxId}
          aria-label="Insert block"
          aria-activedescendant={activeOptionId}
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
                    role="option"
                    aria-selected={isActive}
                    id={`${listboxId}-${command.id}`}
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
    </Plate>
  );
};
