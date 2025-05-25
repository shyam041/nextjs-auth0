import { NextRequest, NextResponse } from "next/server";
//import { proxyRequest } from "@/lib/proxyRequest";
import { auth0 } from "@/lib/auth0"
// Type definition for async params
type AsyncContext = {
  params: Promise<{ path: string[] }>
};

// GET
export async function GET(req: NextRequest, context: any) {

  // Build a minimal "req" object with only headers.cookie for Auth0 SDK
  // const authReq = {
  //   headers: {
  //     cookie: req.headers.get('cookie') ?? '',
  //   },
  // } as any // cast if necessary

  const session = await auth0.getSession()
  console.log("reached", session)
  if (!session) {
    console.log("NO SESSION ISSUE")
    return new Response('Unauthorized', { status: 401 })
  }

  const token = await auth0.getAccessToken()

  console.log('THIS IS TOKEN ', token)

  const { path } = context.params

  // proxyRequest still takes NextRequest
  //return proxyRequest(req, 'GET', path)
}



// POST
// export async function POST(req: NextRequest, context: AsyncContext) {
//   const { path } = await context.params;
//   return proxyRequest(req, "POST", path);
// }

// // PUT
// export async function PUT(req: NextRequest, context: AsyncContext) {
//   const { path } = await context.params;
//   return proxyRequest(req, "PUT", path);
// }

// // PATCH
// export async function PATCH(req: NextRequest, context: AsyncContext) {
//   const { path } = await context.params;
//   return proxyRequest(req, "PATCH", path);
// }

// // DELETE
// export async function DELETE(req: NextRequest, context: AsyncContext) {
//   const { path } = await context.params;
//   return proxyRequest(req, "DELETE", path);
// }
