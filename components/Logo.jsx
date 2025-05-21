// components/chat-input/chat-input-wrapper.tsx
"use client"
import { useState, useRef } from "react"
import { Attachment, IntegratedChatInputProps } from "@/constants/interfaces"
import { cn } from "@/lib/utils"
import { ChatTextArea } from "./chat-textarea"
import { ChatAttachmentBar } from "./chat-attachment-bar"
import { ChatCommandMenu } from "./chat-command-menu"

export function ChatInputWrapper({ onSend, className, placeholder = "Type message" }: IntegratedChatInputProps) {
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [commandMenuState, setCommandMenuState] = useState({
    visible: false,
    options: [],
    position: { top: 0, left: 0 },
    selectedIndex: 0,
    prefix: ""
  })
  const [menuType, setMenuType] = useState<"none" | "documents" | "tags">("none")
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (!message.trim() && attachments.length === 0) return
    onSend(message, attachments)
    setMessage("")
    setAttachments([])
    if (textareaRef.current) textareaRef.current.style.height = "40px"
  }

  return (
    <div className={cn("flex flex-col border shadow-sm bg-background max-w-[60%] mx-auto", className)}>
      <ChatAttachmentBar
        attachments={attachments}
        setAttachments={setAttachments}
        maxAttachments={5}
      />
      <div className="px-3 pt-3 relative">
        <ChatTextArea
          textareaRef={textareaRef}
          message={message}
          setMessage={setMessage}
          onSend={handleSend}
          commandMenuState={commandMenuState}
          setCommandMenuState={setCommandMenuState}
        />
        <ChatCommandMenu
          commandMenuState={commandMenuState}
          setCommandMenuState={setCommandMenuState}
          setMenuType={setMenuType}
          message={message}
          setMessage={setMessage}
        />
      </div>
    </div>
  )
}
