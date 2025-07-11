// Force Node.js runtime to support streaming uploads
export const runtime = "nodejs"

import { auth0 } from "@/lib/auth0"
import { NextRequest, NextResponse } from "next/server"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!

export async function proxyRequest(
    req: NextRequest,
    method: string,
    pathSegments: string[]
): Promise<NextResponse> {
    const url = `${BASE_URL}/${pathSegments.join("/")}${req.nextUrl.search}`

    // Clone and forward headers
    const headers: HeadersInit = { ...Object.fromEntries(req.headers.entries()) }

    // Ensure Authorization header is present
    if (!headers["authorization"]) {
        const { token } = await auth0.getAccessToken()
        if (!token) return new NextResponse("Unauthorized", { status: 401 })
        headers["Authorization"] = `Bearer ${token}`
    }

    const isStreaming = ["POST", "PUT", "PATCH"].includes(method)

    const init: RequestInit = {
        method,
        headers,
        body: ["POST", "PUT", "PATCH"].includes(method) ? await req.text() : undefined,
    }

    try {
        const response = await fetch(url, init)

        if ([204, 304].includes(response.status)) {
            return new NextResponse(null, { status: response.status })
        }

        const responseBody = await response.text()

        return new NextResponse(responseBody, {
            status: response.status,
            headers: {
                "Content-Type":
                    response.headers.get("content-type") || "application/json",
            },
        })
    } catch (err) {
        console.error("Proxy request failed:", err)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
