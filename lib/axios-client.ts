import axios, { type AxiosError, type AxiosRequestConfig } from "axios"
import { headers } from 'next/headers'

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

// Function to get server-side headers with cookies
async function getServerHeaders(): Promise<Record<string, string>> {
  if (typeof window !== "undefined") {
    // Client-side: return empty headers (browser will handle cookies automatically)
    return {}
  }
  
  try {
    // Server-side: get headers including cookies
    const headersList = await headers()
    const cookies = headersList.get('cookie') || ''
    
    return {
      ...(cookies && { Cookie: cookies }),
    }
  } catch (error) {
    console.warn('Failed to get server headers:', error)
    return {}
  }
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
  async (config) => {
    // Add server-side headers (including cookies) for authentication
    const serverHeaders = await getServerHeaders()
    
    // Merge server headers with existing headers
    config.headers = {
      ...config.headers,
      ...serverHeaders,
    }
    
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

// Typed API helper
export const apiClient = {
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

export default axiosInstance
