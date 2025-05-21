import React, { useCallback, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { useSlateStatic } from "slate-react";
import { cn } from "@/lib/utils";
import useChatInput from "@/hooks/useChatInput";
import useChatFiles from "@/hooks/useChatFiles";
import useCommandMenu from "@/hooks/useCommandMenu";
import CommandMenu from "@/components/chat/chat-input/command-menu/CommandMenu";
import UploadAttachments from "@/components/chat/chat-input/UploadAttachments";
import { useMaxInputHeight } from "@/hooks/useMaxInputHeight";

export default function ChatInputWrapper() {
  const editor = useSlateStatic();

  const [textareaValue, setTextareaValue] = useState("");
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  const maxInputHeight = useMaxInputHeight();

  const {
    handleChange,
    handleKeyDown,
    handlePaste,
    handleDrop,
    insertImage,
    insertFile
  } = useChatInput({
    editor,
    textareaRef,
    textareaValue,
    setTextareaValue,
    setIsCommandMenuOpen
  });

  const {
    handleAttachmentUpload,
    onClickRemoveAttachment,
    isUploading,
    uploadedFiles
  } = useChatFiles({ insertImage, insertFile });

  const handleCommandMenuClose = useCallback(() => {
    setIsCommandMenuOpen(false);
    setTextareaValue("");
  }, []);

  return (
    <div ref={inputWrapperRef} className="w-full">
      <div className="flex w-full items-end gap-2 rounded-md border border-input bg-background px-3 py-2">
        <TextareaAutosize
          ref={textareaRef}
          value={textareaValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onDrop={handleDrop}
          placeholder="Message..."
          className={cn(
            "flex min-h-[20px] w-full resize-none bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none",
            textareaValue.length ? "pt-2" : "pt-0"
          )}
          maxRows={8}
          style={{ maxHeight: maxInputHeight }}
        />
      </div>

      <UploadAttachments
        isUploading={isUploading}
        uploadedFiles={uploadedFiles}
        onAttachmentUpload={handleAttachmentUpload}
        onClickRemoveAttachment={onClickRemoveAttachment}
      />

      {isCommandMenuOpen && (
        <CommandMenu
          value={textareaValue}
          containerRef={inputWrapperRef}
          onClose={handleCommandMenuClose}
        />
      )}
    </div>
  );
}

//CommandMenu.tsx
import React, { useEffect, useRef } from "react";

interface CommandMenuProps {
  value: string;
  containerRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
}

const CommandMenu: React.FC<CommandMenuProps> = ({ value, containerRef, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef, onClose]);

  return (
    <div ref={menuRef} className="absolute z-50 mt-2 w-full bg-white shadow-md rounded-md p-2">
      <p className="text-sm text-gray-700">Command menu triggered with value: "{value}"</p>
      {/* Render command options here */}
    </div>
  );
};

export default CommandMenu;
//useChatInput
import { useCallback } from "react";
import type { RefObject, Dispatch, SetStateAction } from "react";
import type { BaseEditor } from "slate";
import type { ReactEditor } from "slate-react";

interface UseChatInputProps {
  editor: BaseEditor & ReactEditor;
  textareaRef: RefObject<HTMLTextAreaElement>;
  textareaValue: string;
  setTextareaValue: Dispatch<SetStateAction<string>>;
  setIsCommandMenuOpen: Dispatch<SetStateAction<boolean>>;
}

export default function useChatInput({
  editor,
  textareaRef,
  textareaValue,
  setTextareaValue,
  setIsCommandMenuOpen
}: UseChatInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setTextareaValue(e.target.value);

      // Show command menu if user types "/"
      if (e.target.value.trim().startsWith("/")) {
        setIsCommandMenuOpen(true);
      } else {
        setIsCommandMenuOpen(false);
      }
    },
    [setTextareaValue, setIsCommandMenuOpen]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();

        // Submit message logic here (e.g. call sendMessage)
        console.log("Message submitted:", textareaValue);

        // Reset input and close command menu
        setTextareaValue("");
        setIsCommandMenuOpen(false);
      }
    },
    [textareaValue, setTextareaValue, setIsCommandMenuOpen]
  );

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Custom paste logic here (optional)
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLTextAreaElement>) => {
    // Custom file drop logic here (optional)
  }, []);

  const insertImage = useCallback((url: string) => {
    // Custom image insert logic here (for Slate editor)
  }, [editor]);

  const insertFile = useCallback((file: File) => {
    // Custom file insert logic here (for Slate editor)
  }, [editor]);

  return {
    handleChange,
    handleKeyDown,
    handlePaste,
    handleDrop,
    insertImage,
    insertFile
  };
}

//useChatFiles
    import { useState, useCallback } from "react";
import type { FileWithPreview } from "@/types/chat";

interface UseChatFilesProps {
  insertImage: (url: string) => void;
  insertFile: (file: File) => void;
}

export default function useChatFiles({
  insertImage,
  insertFile
}: UseChatFilesProps) {
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleAttachmentUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setIsUploading(true);

      const newFiles: FileWithPreview[] = Array.from(files).map((file) => ({
        file,
        preview: URL.createObjectURL(file)
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      newFiles.forEach((fileObj) => {
        const { file } = fileObj;
        if (file.type.startsWith("image/")) {
          insertImage(fileObj.preview);
        } else {
          insertFile(file);
        }
      });

      setIsUploading(false);
    },
    [insertImage, insertFile]
  );

  const onClickRemoveAttachment = useCallback((index: number) => {
    setUploadedFiles((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  }, []);

  return {
    handleAttachmentUpload,
    onClickRemoveAttachment,
    isUploading,
    uploadedFiles
  };
}
//UploadAttachments.tsx
import React from "react";
import type { FileWithPreview } from "@/types/chat";
import { X } from "lucide-react";

interface UploadAttachmentsProps {
  isUploading: boolean;
  uploadedFiles: FileWithPreview[];
  onAttachmentUpload: (files: FileList | null) => void;
  onClickRemoveAttachment: (index: number) => void;
}

export default function UploadAttachments({
  isUploading,
  uploadedFiles,
  onAttachmentUpload,
  onClickRemoveAttachment
}: UploadAttachmentsProps) {
  return (
    <div className="mt-2 space-y-2">
      <input
        type="file"
        multiple
        className="hidden"
        id="chat-file-upload"
        onChange={(e) => onAttachmentUpload(e.target.files)}
      />
      <label htmlFor="chat-file-upload" className="cursor-pointer text-sm underline">
        {isUploading ? "Uploading..." : "Attach files"}
      </label>

      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {uploadedFiles.map((fileObj, index) => (
            <div key={index} className="relative w-24 h-24 border rounded">
              {fileObj.file.type.startsWith("image/") ? (
                <img
                  src={fileObj.preview}
                  alt={fileObj.file.name}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-100 text-xs p-2">
                  {fileObj.file.name}
                </div>
              )}
              <button
                onClick={() => onClickRemoveAttachment(index)}
                className="absolute top-0 right-0 p-1 text-xs text-white bg-black bg-opacity-60 rounded-full"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
//useMaxInputHeight.ts
import { useEffect, useState } from "react";

export function useMaxInputHeight() {
  const [maxHeight, setMaxHeight] = useState(200); // default to 200px

  useEffect(() => {
    const updateMaxHeight = () => {
      const screenHeight = window.innerHeight;
      const footerHeight = 100; // estimated fixed UI element height
      const newHeight = Math.max(100, screenHeight - footerHeight);
      setMaxHeight(Math.min(newHeight, 300)); // enforce a cap
    };

    updateMaxHeight();
    window.addEventListener("resize", updateMaxHeight);
    return () => window.removeEventListener("resize", updateMaxHeight);
  }, []);

  return maxHeight;
}
//useCommandMenu.ts
import { useState, useCallback } from "react";

export function useCommandMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const openMenu = useCallback(() => setIsOpen(true), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);

  return { isOpen, openMenu, closeMenu };
}
