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
