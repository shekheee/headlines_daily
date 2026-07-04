// Renders a JSON-LD structured-data <script>. Server component (no client JS).
// Structured data is what makes articles eligible for Google News / Discover
// rich results — the main passive-traffic lever for a news site.
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // Content is our own generated object, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
