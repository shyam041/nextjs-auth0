import { auth0 } from "@/lib/auth0"
import { NextRequest, NextResponse } from "next/server"
const BASE_URL = process.env.NEXT_PUBLIC_API_URL
export async function proxyRequest(
    req: NextRequest,
    method: string,
    pathSegments: string[],
): Promise<NextResponse> {
    const url = `${BASE_URL}/${pathSegments.join("/")}${req.nextUrl.search}`

    const headers: HeadersInit = {}
    req.headers.forEach((value, key) => {
        console.log("THE HEADERS ", key, "==>", value)
        headers[key] = value;
    })
    
    // Check if request already includes an Authorization header
    const authHeader = req.headers.get("authorization")
    if (authHeader) {
        // console.log("authHeader are present:: ", authHeader)
        headers["Authorization"] = authHeader
    } else {
        const { token } = await auth0.getAccessToken()
        console.log("NEW TOKEN CREATED ON PROXY :: ", token)
        if (token) {
            headers["Authorization"] = `Bearer ${token}`
        }
        else {
            return new NextResponse("Unauthorized", { status: 401 })
        }
    }

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
                "Content-Type": response.headers.get("content-type") || "application/json",
            },
        })
    } catch (err) {
        console.error("Proxy request failed:", err)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
