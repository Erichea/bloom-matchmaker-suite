import React, { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { usePlateEditor } from "platejs/react";
import { slashItems } from "./items";
import { shouldOpenSlash, getSlashQuery, removeSlashText } from "./onSlashCommand";

export const SlashCombobox: React.FC = () => {
  const editor = usePlateEditor();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const portalRoot = typeof document !== "undefined" ? document.getElementById("plate-portal") : null;
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return slashItems;
    
    return slashItems.filter(item => 
      item.label.toLowerCase().includes(q) || 
      item.description?.toLowerCase().includes(q) ||
      item.keywords?.some(keyword => keyword.toLowerCase().includes(q))
    );
  }, [query]);

  // Check if slash should open
  useEffect(() => {
    if (!editor) return;

    const checkSlash = () => {
      if (!editor.selection) {
        setOpen(false);
        return;
      }

      const shouldOpen = shouldOpenSlash(editor);
      if (shouldOpen) {
        const newQuery = getSlashQuery(editor);
        setQuery(newQuery);
        setSelectedIndex(0);
        setOpen(true);
        
        // Focus input after a short delay
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      } else {
        setOpen(false);
      }
    };

    // Check on selection change
    const handleSelectionChange = () => {
      requestAnimationFrame(checkSlash);
    };

    // Set up event listeners
    document.addEventListener("selectionchange", handleSelectionChange);
    
    // Initial check
    checkSlash();

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [editor]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredItems.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
          break;
        case "Enter":
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            handleSelect(filteredItems[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          editor?.focus();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, filteredItems, selectedIndex, editor]);

  // Handle item selection
  const handleSelect = (item: typeof slashItems[0]) => {
    if (!editor) return;

    // Remove the slash text
    removeSlashText(editor);
    
    // Execute the item's action
    item.onSelect(editor);
    
    // Close the menu
    setOpen(false);
    
    // Focus back to editor
    editor.focus();
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedIndex(0);
  };

  if (!open || !portalRoot || filteredItems.length === 0) return null;

  const menu = (
    <div className="plate-slash-combobox" role="menu" aria-label="Insert block">
      <input
        ref={inputRef}
        autoFocus
        placeholder="Type to filter..."
        onChange={handleInputChange}
        value={query}
        className="plate-slash-input"
      />
      <ul className="plate-slash-list">
        {filteredItems.map((item, index) => (
          <li key={item.key}>
            <button
              type="button"
              onClick={() => handleSelect(item)}
              className={`plate-slash-item ${index === selectedIndex ? 'plate-slash-item-selected' : ''}`}
            >
              <div className="plate-slash-icon">{item.icon}</div>
              <div className="plate-slash-text">
                <div className="plate-slash-label">{item.label}</div>
                {item.description && (
                  <div className="plate-slash-desc">{item.description}</div>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return createPortal(menu, portalRoot);
};
