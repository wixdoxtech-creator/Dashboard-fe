
export default function ChatListSkeleton({ rows = 8 }: { rows?: number }) {
    return (
      <div role="status" aria-live="polite" className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-3 w-1/2 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-1/3 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
        <span className="sr-only">Loading chats…</span>
      </div>
    );
  }
