import { apiClient } from "./api-client"
import { Document, Tag, SearchResult, FocusArea, Chat, NewChat, ChatMessage } from "@/constants/interfaces"
// API Functions
export const documentsAPI = {
  getAll: async () => {
    const response = await apiClient.get<Document[]>("/documents")
    return response
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Document>(`/documents/${id}`)
    return response
  },

  create: async (data: Omit<Document, "id">) => {
    const response = await apiClient.post<Document>("/documents", data)
    return response
  },

  update: async (id: string, data: Partial<Document>) => {
    const response = await apiClient.put<Document>(`/documents/${id}`, data)
    return response
  },

  delete: async (id: string) => {
    await apiClient.delete(`/documents/${id}`)
  },
}

export const tagsAPI = {
  getAll: async () => {
    const response = await apiClient.get<Tag[]>("/tags")
    return response
  },

  create: async (data: Omit<Tag, "id">) => {
    const response = await apiClient.post<Tag>("/tags", data)
    return response
  },
}

export const searchAPI = {
  search: async (query: string, filters?: Record<string, any>) => {
    const params = new URLSearchParams({ query })
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }
    const response = await apiClient.get<SearchResult[]>(`/search?${params.toString()}`)
    return response
  },
}

export const focusAreasAPI = {
  getAll: async () => {
    const response = await apiClient.get<FocusArea[]>("/focus-areas")
    return response
  },
}

// Chat API endpoints
export const chatsAPI = {
  getAll: async () => {
    const response = await apiClient.get<Chat[]>("/chats")
    return response
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Chat>(`/chats/${id}`)
    return response;
  },

  create: async (chat: NewChat) => {
    const response = await apiClient.post<Chat>("/chats", chat)
    return response
  },

  update: async (id: string, data: Partial<Chat>) => {
    const response = await apiClient.put<Chat>(`/chats/${id}`, data)
    return response
  },

  delete: async (id: string) => {
    await apiClient.delete(`/chats/${id}`)
    return id // Return the ID for cache invalidation
  },

  sendMessage: async (chatId: string, message: Omit<ChatMessage, "id" | "timestamp">) => {
    const response = await apiClient.post<ChatMessage>(`/chats/${chatId}/messages`, message)
    return response
  },
}

// Export query keys
export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (filters: any) => [...documentKeys.lists(), { filters }] as const,
  details: () => [...documentKeys.all, "detail"] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
}

export const tagKeys = {
  all: ["tags"] as const,
}

export const searchKeys = {
  all: ["search"] as const,
  queries: () => [...searchKeys.all, "queries"] as const,
  query: (query: string, filters?: Record<string, any>) => [...searchKeys.queries(), { query, filters }] as const,
}

export const focusAreaKeys = {
  all: ["focusAreas"] as const,
}

export const chatKeys = {
  all: ["chats"] as const,
  lists: () => [...chatKeys.all, "list"] as const,
  list: (filters: any) => [...chatKeys.lists(), { filters }] as const,
  details: () => [...chatKeys.all, "detail"] as const,
  detail: (id: string) => [...chatKeys.details(), id] as const,
}
