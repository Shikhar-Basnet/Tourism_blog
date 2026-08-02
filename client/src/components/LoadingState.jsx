export function PageLoader({ title = "Loading content", subtitle = "Please wait while we fetch the latest details." }) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white px-6 py-16 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-blue-100 bg-blue-50">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
    </div>
  );
}

export function CardSkeleton({ className = "" }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] ${className}`}>
      <div className="h-40 animate-pulse bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-20 animate-pulse rounded-full bg-gray-200" />
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-gray-200" />
        <div className="h-3 w-full animate-pulse rounded-full bg-gray-200" />
        <div className="h-3 w-5/6 animate-pulse rounded-full bg-gray-200" />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] sm:p-8">
      <div className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded-full bg-gray-200" />
        <div className="h-8 w-3/4 animate-pulse rounded-full bg-gray-200" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-gray-200" />
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200" />
      <div className="space-y-2">
        <div className="h-4 w-full animate-pulse rounded-full bg-gray-200" />
        <div className="h-4 w-full animate-pulse rounded-full bg-gray-200" />
        <div className="h-4 w-4/5 animate-pulse rounded-full bg-gray-200" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

export function CommentSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 animate-pulse rounded-full bg-gray-200" />
          <div className="h-3 w-32 animate-pulse rounded-full bg-gray-200" />
        </div>
      </div>
      <div className="space-y-2 pl-12">
        <div className="h-3 w-full animate-pulse rounded-full bg-gray-200" />
        <div className="h-3 w-5/6 animate-pulse rounded-full bg-gray-200" />
      </div>
    </div>
  );
}
