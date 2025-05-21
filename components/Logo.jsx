"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, Plus, FileText, TagIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { FilterButton } from "@/components/filter-button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SendIcon } from "@/components/ui/icons"
import { DocumentSelector } from "./document-selector"
import { TagSelector } from "./tag-selector"
//interfaces
import { IntegratedChatInputProps, Attachment, CommandOption } from "@/constants/interfaces"



export function IntegratedChatInput({
  onSend,
  className,
  placeholder = "Type message",
}: IntegratedChatInputProps) {
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [menuType, setMenuType] = useState<"none" | "documents" | "tags">("none")
  const MAX_ATTACHMENTS = 5
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false)

  // Command menu state
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const [commandMenuPosition, setCommandMenuPosition] = useState({ top: 0, left: 0 })
  const [commandOptions, setCommandOptions] = useState<CommandOption[]>([])
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)
  const [commandPrefix, setCommandPrefix] = useState("")
  const commandMenuRef = useRef<HTMLDivElement>(null)

  // Available command options
  const availableCommands: CommandOption[] = [
    { id: "documents", label: "Documents", value: "documents" },
    { id: "tags", label: "Tags", value: "tags" },
  ]

  // Auto-resize textarea with a minimum height of 40px and maximum height of 200px.
  useEffect(() => {
    const adjustHeight = () => {
      const textarea = textareaRef.current
      if (!textarea) return

      // Reset height to recalc scrollHeight accurately.
      textarea.style.height = "auto"
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 200)
      textarea.style.height = `${newHeight}px`
    }

    const textarea = textareaRef.current
    if (textarea) {
      textarea.addEventListener("input", adjustHeight)
      adjustHeight() // Initial adjustment
    }

    return () => {
      if (textarea) {
        textarea.removeEventListener("input", adjustHeight)
      }
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if ((menuType !== "none" || isPlusMenuOpen) && !target.closest(".menu-container")) {
        setMenuType("none")
        setIsPlusMenuOpen(false)
      }

      // Close command menu when clicking outside
      if (showCommandMenu && commandMenuRef.current && !commandMenuRef.current.contains(target)) {
        setShowCommandMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [menuType, isPlusMenuOpen, showCommandMenu])

  const handleSend = () => {
    if (message.trim() || (attachments && attachments.length > 0)) {
      onSend(message, attachments || [])
      setMessage("")
      setAttachments([])
      if (textareaRef.current) {
        textareaRef.current.style.height = "40px" // Reset to initial height after sending
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle command menu navigation
    if (showCommandMenu) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedCommandIndex((prev) => (prev + 1) % commandOptions.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedCommandIndex((prev) => (prev - 1 + commandOptions.length) % commandOptions.length)
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        selectCommand(commandOptions[selectedCommandIndex])
      } else if (e.key === "Escape") {
        e.preventDefault()
        setShowCommandMenu(false)
      }
      return
    }
    // Normal send behavior when command menu is not shown
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setMessage(newValue)

    // Check for @ commands
    const lastAtSymbolIndex = newValue.lastIndexOf("@")
    if (lastAtSymbolIndex !== -1) {
      const textAfterAt = newValue.slice(lastAtSymbolIndex + 1)
      const hasSpaceAfterCommand = /\s/.test(textAfterAt)

      if (!hasSpaceAfterCommand) {
        // Filter commands based on what's typed after @
        const filtered = availableCommands.filter((cmd) => cmd.label.toLowerCase().includes(textAfterAt.toLowerCase()))

        if (filtered.length > 0) {
          setCommandOptions(filtered)
          setSelectedCommandIndex(0)
          setCommandPrefix(textAfterAt)

          // Position the command menu
          if (textareaRef.current) {
            const textarea = textareaRef.current
            const caretPosition = getCaretCoordinates(textarea, lastAtSymbolIndex)

            setCommandMenuPosition({
              top: caretPosition.top,
              left: caretPosition.left,
            })

            setShowCommandMenu(true)
          }
        } else {
          setShowCommandMenu(false)
        }
      } else {
        setShowCommandMenu(false)
      }
    } else {
      setShowCommandMenu(false)
    }
  }

  // Helper function to get caret coordinates in the textarea
  const getCaretCoordinates = (textarea: HTMLTextAreaElement, position: number) => {
    const { offsetLeft, offsetTop } = textarea
    const div = document.createElement("div")
    const styles = getComputedStyle(textarea)

    div.style.position = "absolute"
    div.style.top = "0"
    div.style.left = "0"
    div.style.width = styles.width
    div.style.height = "auto"
    div.style.padding = styles.padding
    div.style.font = styles.font
    div.style.lineHeight = styles.lineHeight
    div.style.whiteSpace = "pre-wrap"
    div.style.wordWrap = "break-word"
    div.style.visibility = "hidden"

    const text = textarea.value.substring(0, position)
    div.textContent = text

    const span = document.createElement("span")
    span.textContent = textarea.value.charAt(position) || "."
    div.appendChild(span)

    document.body.appendChild(div)
    const rect = span.getBoundingClientRect()
    document.body.removeChild(div)

    return {
      top: rect.top - textarea.scrollTop + offsetTop,
      left: rect.left - textarea.scrollLeft + offsetLeft,
      height: rect.height,
    }
  }

  const selectCommand = (command: CommandOption) => {
    setShowCommandMenu(false)

    // Replace the @command with the selected command
    const lastAtSymbolIndex = message.lastIndexOf("@")
    if (lastAtSymbolIndex !== -1) {
      const newMessage = message.substring(0, lastAtSymbolIndex)
      setMessage(newMessage)

      // Open the corresponding menu
      if (command.value === "documents") {
        setMenuType("documents")
      } else if (command.value === "tags") {
        setMenuType("tags")
      }
    }
  }

  const handleAddDocument = (document: any) => {
    if (attachments.length >= MAX_ATTACHMENTS) {
      // Show error or notification that max attachments reached
      console.log("Maximum attachments reached")
      return
    }

    const newAttachment: Attachment = {
      id: `doc-${Date.now()}`,
      type: "document",
      name: document.name,
      fileType: document.type,
      icon: <FileText size={16} />,
    }
    setAttachments([...attachments, newAttachment])
  }

  const handleAddTag = (tag: any) => {
    if (attachments.length >= MAX_ATTACHMENTS) {
      // Show error or notification that max attachments reached
      console.log("Maximum attachments reached")
      return
    }

    const newAttachment: Attachment = {
      id: `tag-${Date.now()}`,
      type: "tag",
      name: tag.name,
      icon: <TagIcon size={16} />,
    }
    setAttachments([...attachments, newAttachment])
  }

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter((attachment) => attachment.id !== id))
  }

  const toggleMenu = (type: "documents" | "tags") => {
    if (menuType === type) {
      setMenuType("none")
      setIsPlusMenuOpen(false)
    } else {
      setMenuType(type)
      setIsPlusMenuOpen(false)
    }
  }

  const togglePlusMenu = () => {
    setIsPlusMenuOpen(!isPlusMenuOpen)
    setMenuType("none")
  }

  return (
    <div className={cn("flex flex-col border shadow-sm bg-background max-w-[60%] mx-auto", className)}>
      {/* Attachments area */}
      {attachments && attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center bg-muted rounded-full px-3 py-1 text-sm">
              {attachment.type === "document" ? (
                <FileText size={16} className="mr-1" />
              ) : (
                <TagIcon size={16} className="mr-1" />
              )}
              <span>{attachment.name}</span>
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {attachments.length >= MAX_ATTACHMENTS && (
            <div className="flex items-center text-red-500 text-xs ml-2">
              {MAX_ATTACHMENTS} files max. Remove a file to add more.
            </div>
          )}
        </div>
      )}

      {/* Text area container with only top and horizontal padding */}
      <div className="px-3 pt-3 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none resize-none min-h-[40px] max-h-[200px] overflow-y-auto text-foreground"
          style={{ height: "40px" }}
        />

        {/* Command menu - positioned ABOVE the caret */}
        {showCommandMenu && commandOptions.length > 0 && (
          <div
            ref={commandMenuRef}
            className="absolute bg-popover border shadow-md z-50"
            style={{
              bottom: `calc(100% - ${commandMenuPosition.top}px)`, // Position above the caret
              left: `${commandMenuPosition.left}px`,
              width: "250px",
              marginBottom: "5px", // Add some space between the menu and the caret
            }}
          >
            {commandOptions.map((option, index) => (
              <button
                key={option.id}
                className={cn(
                  "flex items-center justify-between w-full px-4 py-3 text-sm text-left cursor-pointer hover:bg-muted",
                  index < commandOptions.length - 1 ? "border-b border-gray-100" : "",
                  selectedCommandIndex === index ? "bg-gray-50" : "",
                )}
                onClick={() => selectCommand(option)}
              >
                <div className="flex items-center">
                  {option.value === "documents" ? (
                    <FileText className="mr-2 h-4 w-4" />
                  ) : (
                    <TagIcon className="mr-2 h-4 w-4" />
                  )}
                  {option.label}
                </div>
                <ChevronDown className="h-4 w-4 transform -rotate-90" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Button container with only bottom and horizontal padding */}
      <div className="flex items-center justify-between px-3 pb-3">
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center rounded-full px-4 py-2 bg-muted">
              <span className="text-sm mr-2">General</span>
              <ChevronDown size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[200px] p-0 border border-gray-200 shadow-md rounded-none overflow-hidden"
              sideOffset={4}
            >
              <DropdownMenuItem className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-muted border-b border-gray-100">
                General
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M13.3334 4L6.00008 11.3333L2.66675 8"
                    stroke="black"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </DropdownMenuItem>
              <DropdownMenuItem className="py-3 px-4 cursor-pointer hover:bg-muted border-b border-gray-100">
                Personal
              </DropdownMenuItem>
              <DropdownMenuItem className="py-3 px-4 cursor-pointer hover:bg-muted border-b border-gray-100">
                GMT Playbook
              </DropdownMenuItem>
              <DropdownMenuItem className="py-3 px-4 cursor-pointer hover:bg-muted">Products</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <FilterButton />

          {/* Plus button menu */}
          <div className="relative menu-container">
            <button
              onClick={togglePlusMenu}
              className="flex items-center justify-center rounded-full h-9 w-9 bg-muted hover:bg-muted/80 cursor-pointer"
            >
              <Plus size={16} />
              <span className="sr-only">Add content</span>
            </button>

            {menuType === "documents" && (
              <DocumentSelector onSelect={handleAddDocument} onClose={() => setMenuType("none")} />
            )}

            {menuType === "tags" && <TagSelector onSelect={handleAddTag} onClose={() => setMenuType("none")} />}

            {isPlusMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-[250px] bg-background border border-gray-200 shadow-md z-50">
                <button
                  className="flex items-center justify-between w-full px-4 py-3 text-sm text-left cursor-pointer hover:bg-muted border-b border-gray-100"
                  onClick={() => toggleMenu("documents")}
                >
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Documents
                  </div>
                  <ChevronDown className="h-4 w-4 transform -rotate-90" />
                </button>
                <button
                  className="flex items-center justify-between w-full px-4 py-3 text-sm text-left cursor-pointer hover:bg-muted"
                  onClick={() => toggleMenu("tags")}
                >
                  <div className="flex items-center">
                    <TagIcon className="mr-2 h-4 w-4" />
                    Tags
                  </div>
                  <ChevronDown className="h-4 w-4 transform -rotate-90" />
                </button>
              </div>
            )}
          </div>
        </div>
        <Button
          size="icon"
          variant="accentTeal"
          onClick={handleSend}
          className="rounded-full h-10 w-10"
        >
          <SendIcon className="h-5 w-5 text-white" />
        </Button>
      </div>
    </div>
  )
}
