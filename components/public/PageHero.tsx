export function PageHero({
  kicker,
  title,
  intro,
}: {
  kicker?: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
        {kicker && (
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-red-600">
            {kicker}
          </p>
        )}
        <h1
          className="text-4xl font-bold leading-tight tracking-tight text-gray-900 md:text-5xl"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          {title}
        </h1>
        {intro && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">{intro}</p>}
      </div>
    </div>
  );
}
