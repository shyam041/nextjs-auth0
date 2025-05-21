// import { Suspense } from "react"
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import ChatView from "@/components/chat-view"
// import { ChatSkeleton } from "@/components/chat-skeleton"
import { chatsAPI, chatKeys } from "@/lib/api"

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = new QueryClient()
  // Only prefetch if it's not a new chat
  if (id !== "new") {
    try {
      await queryClient.prefetchQuery({
        queryKey: chatKeys.detail(id),
        queryFn: () => chatsAPI.getById(id),
      })
    } catch (error) {
      // Handle 404 or other errors
      console.error("Error prefetching chat:", error)
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* <Suspense fallback={<ChatSkeleton />}> */}
      <ChatView id={id} />
      {/* </Suspense> */}
    </HydrationBoundary>
  )
}
