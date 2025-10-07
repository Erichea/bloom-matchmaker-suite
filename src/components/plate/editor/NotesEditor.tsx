import React, { useMemo, useCallback } from "react";
import { Plate, createPlateEditor } from "platejs/react";
import { plugins } from "../config/plugins";
import { plateUI } from "../ui/PlateUI";
import { Editor } from "@/components/ui/editor";
import "../styles/plate.css";

type NotesEditorProps = {
  value: any[]; // Slate JSON
  onChange: (value: any[], json: string) => void;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
};

export function NotesEditor({ 
  value, 
  onChange, 
  readOnly = false, 
  className,
  placeholder = "Type / for commands or start writing..."
}: NotesEditorProps) {
  const editor = useMemo(() => createPlateEditor({ plugins, value }), [value]);

  const handleChange = useCallback((options: { editor: any; value: any[] }) => {
    if (!onChange) return;
    const { value: newValue } = options;
    const json = JSON.stringify(newValue);
    onChange(newValue, json);
  }, [onChange]);

  return (
    <div className={`plate-editor ${className || ""}`}>
      <Plate 
        editor={editor}
        onChange={handleChange}
      >
        <Editor placeholder={placeholder} />
      </Plate>
    </div>
  );
}
