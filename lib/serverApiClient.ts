// lib/server-api-client.ts
import { headers } from 'next/headers'

export const serverApiClient = {
    get: async <T>(url: string): Promise<T> => {
        const sessionHeaders = await headers();
        const cookies = sessionHeaders.get('cookie') || ''
        const res = await fetch(`${process.env.APP_BASE_URL}/api/protected${url}`, {
            method: 'GET',
            headers: {
                Cookie: cookies,
            },
            cache: 'no-store',
        })
        if (!res.ok) {
            throw new Error(`GET ${url} failed: ${res.status}`)
        }
        return res.json()
    },

    post: async <T>(url: string, data?: any): Promise<T> => {
        const sessionHeaders = await headers();
        const cookies = sessionHeaders.get('cookie') || ''

        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/protected${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Cookie: cookies,
            },
            body: JSON.stringify(data),
        })

        if (!res.ok) {
            throw new Error(`POST ${url} failed: ${res.status}`)
        }
        return res.json()
    },
    // Add other methods (put, patch, delete) as needed
}
