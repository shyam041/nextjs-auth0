import { auth0 } from "@/lib/auth0";
import { NextRequest, NextResponse } from "next/server"
const BASE_URL = process.env.NEXT_PUBLIC_API_URL
export async function proxyRequest(
    req: NextRequest,
    method: string,
    pathSegments: string[],
    session?: any
): Promise<NextResponse> {
    console.log("REACHD PROXY", session)
    const url = `${BASE_URL}/${pathSegments.join("/")}${req.nextUrl.search}`
    const headers: HeadersInit = {
        "Content-Type": req.headers.get("content-type") || "application/json",
    }
    // Check if request already includes an Authorization header
    const authHeader = req.headers.get("authorization")
    console.log("reached proxy", url, authHeader)
    if (authHeader) {
        headers["Authorization"] = authHeader
    } else {
        const sess = await auth0.getSession();
        console.log("reached proxy of else part and created token", url, sess)
        if (sess) {
            headers["Authorization"] = `Bearer ${sess}`
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
        const responseBody = await response.text()

        return new NextResponse(responseBody, {
            status: response.status,
            headers: {
                "Content-Type": response.headers.get("content-type") || "application/json",
            },
        })
    } catch (err) {
        console.error("Proxy request failed:", err); // 👈 Log this
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
