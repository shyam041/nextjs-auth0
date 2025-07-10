import axios, { type AxiosError, type AxiosRequestConfig } from "axios"

const isMockingEnabled =
  typeof window !== "undefined" &&
  (process.env.NEXT_PUBLIC_API_MOCKING === "enabled" ||
    process.env.NODE_ENV === "development" ||
    !process.env.NEXT_PUBLIC_API_URL)

// uncomment below line to enable mocking
// const API_URL = isMockingEnabled ? "" : process.env.NEXT_PUBLIC_API_URL || ""
// Determine the base URL based on environment

const isServer = typeof window === "undefined"

// Base URL: direct API for server, proxy route for client
const axiosInstance = axios.create({
  baseURL: isServer
    ? process.env.NEXT_PUBLIC_API_URL
    : "/api/protected",
  headers: {
    "Content-Type": "application/json",
  },
  //timeout: Number(process.env.NEXT_PUBLIC_AXIOS_TIMEOUT ?? 30000),
})

// Response interceptor (optional, mainly for client)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !isServer) {
      window.location.href = "/auth/login"
    }
    return Promise.reject(error)
  }
)

// Helper to get Authorization + Cookie headers on the server
const getServerHeaders = async (): Promise<Record<string, string>> => {
  try {
    const { auth0 } = await import("@/lib/auth0")
    const { headers } = await import("next/headers")

    const tokenData = await auth0.getAccessToken()
    console.log("NEW TOKEN CREATED ON SERVER SIDE :: ", tokenData)
    if (!tokenData?.token) throw new Error("Access token missing")

    const requestHeaders = await headers()
    const cookie = requestHeaders.get("cookie")

    return {
      Authorization: `Bearer ${tokenData.token}`,
      ...(cookie ? { Cookie: cookie } : {}),
    }
  } catch (err) {
    console.error("Failed to get server headers:", err)
    throw new Error("Unauthorized")
  }
}

const createHttpClient = () => {
  const request = async <T>(
    method: AxiosRequestConfig["method"],
    url: string,
    data?: any,
    config: AxiosRequestConfig = {}
  ): Promise<T> => {
    const authHeaders = isServer ? await getServerHeaders() : {}
    const response = await axiosInstance.request<T>({
      method,
      url,
      data,
      ...config,
      headers: {
        ...config.headers,
        ...authHeaders,
      },
    })
    return response.data
  }

  return {
    get: <T>(url: string, config?: AxiosRequestConfig) =>
      request<T>("get", url, undefined, config),
    post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
      request<T>("post", url, data, config),
    put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
      request<T>("put", url, data, config),
    patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
      request<T>("patch", url, data, config),
    delete: <T>(url: string, config?: AxiosRequestConfig) =>
      request<T>("delete", url, undefined, config),
  }
}

export const httpClient = createHttpClient()
export default axiosInstance
