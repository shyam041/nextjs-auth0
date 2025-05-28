import axios, { type AxiosError, type AxiosRequestConfig } from "axios"

const isMockingEnabled =
  typeof window !== "undefined" &&
  (process.env.NEXT_PUBLIC_API_MOCKING === "enabled" ||
    process.env.NODE_ENV === "development" ||
    !process.env.NEXT_PUBLIC_API_URL)

// Determine the base URL based on environment
const API_URL = typeof window === "undefined"
  ? process.env.APP_BASE_URL
    ? `${process.env.APP_BASE_URL}/api/protected`
    : (() => {
      throw new Error("APP_BASE_URL is not defined in environment variables.")
    })()
  : "/api/protected"

if (typeof window === "undefined") {
  console.log("API_URL (server-side):", API_URL)
} else {
  console.log("API_URL (client-side):", API_URL)
}

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds
})

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Client-side: cookies are handled automatically by the browser
    // Server-side: we'll handle this differently (see serverApiClient below)
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      console.error("API Error Response:", error.response.status, error.response.data)
      if (error.response.status === 401) {
        console.warn("Unauthorized access, redirecting to login...")
        // Only redirect on client-side
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login"
        }
      }
    } else if (error.request) {
      console.error("API No Response:", error.request)
    } else {
      console.error("API Request Error:", error.message)
    }
    return Promise.reject(error)
  }
)

// Server-specific API client that can use next/headers
const createServerApiClient = () => {
  // Dynamic import to avoid issues with bundling
  const getServerHeaders = async () => {
    try {
      const { headers } = await import('next/headers')
      const headersList = await headers()
      const cookies = headersList.get('cookie') || ''
      return cookies ? { Cookie: cookies } : {}
    } catch (error) {
      console.warn('Failed to get server headers:', error)
      return {}
    }
  }

  return {
    get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
      const serverHeaders = await getServerHeaders()
      const response = await axiosInstance.get<T>(url, {
        ...config,
        headers: {
          ...config?.headers,
          ...serverHeaders,
        }
      })
      return response.data
    },
    post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
      const serverHeaders = await getServerHeaders()
      const response = await axiosInstance.post<T>(url, data, {
        ...config,
        headers: {
          ...config?.headers,
          ...serverHeaders,
        }
      })
      return response.data
    },
    put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
      const serverHeaders = await getServerHeaders()
      const response = await axiosInstance.put<T>(url, data, {
        ...config,
        headers: {
          ...config?.headers,
          ...serverHeaders,
        }
      })
      return response.data
    },
    delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
      const serverHeaders = await getServerHeaders()
      const response = await axiosInstance.delete<T>(url, {
        ...config,
        headers: {
          ...config?.headers,
          ...serverHeaders,
        }
      })
      return response.data
    },
    patch: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
      const serverHeaders = await getServerHeaders()
      const response = await axiosInstance.patch<T>(url, data, {
        ...config,
        headers: {
          ...config?.headers,
          ...serverHeaders,
        }
      })
      return response.data
    },
  }
}

// Regular client-side API client
const clientApiClient = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    console.log("REACHED API CLIENT GET METHOD :: ", url)
    const response = await axiosInstance.get<T>(url, config)
    return response.data
  },
  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.post<T>(url, data, config)
    return response.data
  },
  put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.put<T>(url, data, config)
    return response.data
  },
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.delete<T>(url, config)
    return response.data
  },
  patch: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.patch<T>(url, data, config)
    return response.data
  },
}

// Export the appropriate client based on environment
export const apiClient = typeof window === "undefined" 
  ? createServerApiClient() 
  : clientApiClient

export default axiosInstance
