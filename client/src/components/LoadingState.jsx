export function PageLoader({ title = "Loading content", subtitle = "Please wait while we fetch the latest details." }) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-6 py-16 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-blue-100 bg-blue-50">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
    </div>
  );
}

// Every measurement here (aspect-[16/10] image, p-3.5, h-4 category,
// h-10 title, h-8 description, h-4 footer) is copied literally into
// DestinationCard and BlogCard. Nothing here is min-h/flex-1 — every
// row is a fixed height so the skeleton -> real card swap is 0px of
// layout shift no matter how long/short the real content is.
export function CardSkeleton({ className = "" }) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] ${className}`}
    >
      <div className="aspect-[16/10] w-full animate-pulse bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200" />

      <div className="p-3.5">
        <div className="mb-1 h-4">
          <div className="h-3 w-14 animate-pulse rounded-sm bg-gray-200" />
        </div>

        <div className="mb-1.5 flex h-10 flex-col justify-between">
          <div className="h-4 w-full animate-pulse rounded-sm bg-gray-200" />
          <div className="h-4 w-2/3 animate-pulse rounded-sm bg-gray-200" />
        </div>

        <div className="mb-2.5 flex h-8 flex-col justify-between">
          <div className="h-3.5 w-full animate-pulse rounded-sm bg-gray-200" />
          <div className="h-3.5 w-5/6 animate-pulse rounded-sm bg-gray-200" />
        </div>

        <div className="flex h-4 items-center justify-between border-t border-gray-100 pt-2.5">
          <div className="h-3 w-14 animate-pulse rounded-sm bg-gray-200" />
          <div className="h-3 w-10 animate-pulse rounded-sm bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] sm:p-8">
      <div className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded-full bg-gray-200" />
        <div className="h-8 w-3/4 animate-pulse rounded-full bg-gray-200" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-gray-200" />
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200" />
      <div className="space-y-2">
        <div className="h-4 w-full animate-pulse rounded-full bg-gray-200" />
        <div className="h-4 w-full animate-pulse rounded-full bg-gray-200" />
        <div className="h-4 w-4/5 animate-pulse rounded-full bg-gray-200" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-20 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

export function CommentSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
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