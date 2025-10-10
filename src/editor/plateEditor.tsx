import React, { useMemo } from "react";
import { createPlateEditor, Plate } from "platejs/react";
import { plateUI, platePlugins } from "@/editor/platePlugins";
import { Editor } from "@/components/ui/editor";

export const NotionLikeEditor = ({
  initialValue,
  onChange,
  placeholder = "Type / for commands or start writing...",
}) => {
  const editor = useMemo(
    () => createPlateEditor({ plugins: platePlugins, value: initialValue }),
    [initialValue]
  );

  const handleOnChange = (value: any) => {
    if (!onChange) return;
    const json = JSON.stringify(value);
    onChange(value, json, editor);
  };

  return (
    <Plate
      editor={editor}
      onChange={handleOnChange}
    >
      <Editor placeholder={placeholder} />
    </Plate>
  );
};