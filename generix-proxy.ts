// app/api/proxy/[...path]/route.ts
import { NextRequest } from 'next/server';
import { getAccessToken, getSession } from '@auth0/nextjs-auth0';

type RouteParams = {
  params: {
    path: string[];
  };
};

// Handle all HTTP methods
export async function GET(request: NextRequest, { params }: RouteParams) {
  return handleApiRequest(request, params, 'GET');
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return handleApiRequest(request, params, 'POST');
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return handleApiRequest(request, params, 'PUT');
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return handleApiRequest(request, params, 'DELETE');
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return handleApiRequest(request, params, 'PATCH');
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Generic API request handler
async function handleApiRequest(
  request: NextRequest, 
  { path }: { path: string[] }, 
  method: HttpMethod
): Promise<Response> {
  try {
    // Get the auth token if user is logged in
    let accessToken: string | null = null;
    
    try {
      const auth = await getAccessToken();
      accessToken = auth?.accessToken || null;
    } catch (error) {
      // Continue without token for public API endpoints
      console.log('No authentication token available');
    }
    
    // Build request URL to Python backend
    // Join path segments and preserve query parameters
    const url = new URL(request.url);
    const apiPath = Array.isArray(path) ? path.join('/') : path;
    const apiUrl = `${process.env.PYTHON_API_URL}/${apiPath}${url.search}`;
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization header if token exists
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    // Get request body for non-GET requests
    let body: string | null = null;
    if (method !== 'GET') {
      body = await request.text();
    }
    
    // Make the request to Python backend
    const response = await fetch(apiUrl, {
      method,
      headers,
      body,
    });
    
    // Handle different response types
    let responseData: any;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    // Return the response with same status code
    return new Response(
      typeof responseData === 'string' ? responseData : JSON.stringify(responseData),
      {
        status: response.status,
        headers: {
          'Content-Type': contentType || 'application/json',
        },
      }
    );
    
  } catch (error) {
    console.error('API proxy error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
