import { NextRequest, NextResponse } from "next/server";
import { proxyRequest } from "@/lib/proxyRequest";
// Type definition for async params
type AsyncContext = {
    params: Promise<{ path: string[] }>
};

// GET
export async function GET(req: NextRequest, context: AsyncContext) {
    console.log("IN ROUTE HANDLER ")
    const { path } = await context.params
    return proxyRequest(req, 'GET', path)
}

// POST
export async function POST(req: NextRequest, context: AsyncContext) {
    const { path } = await context.params;
    return proxyRequest(req, "POST", path);
}

// PUT
export async function PUT(req: NextRequest, context: AsyncContext) {
    const { path } = await context.params;
    return proxyRequest(req, "PUT", path);
}

// PATCH
export async function PATCH(req: NextRequest, context: AsyncContext) {
    const { path } = await context.params;
    return proxyRequest(req, "PATCH", path);
}

// DELETE
export async function DELETE(req: NextRequest, context: AsyncContext) {
    const { path } = await context.params;
    return proxyRequest(req, "DELETE", path);
}
