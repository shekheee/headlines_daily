interface CategoryHeaderProps {
  name: string;
  description?: string | null;
  color: string;
}

export function CategoryHeader({ name, description, color }: CategoryHeaderProps) {
  return (
    <div className="bg-white border-b-4" style={{ borderColor: color }}>
      <div className="container px-4 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <span
            className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-white px-2 py-0.5"
            style={{ backgroundColor: color }}
          >
            Section
          </span>
        </div>
        <h1
          className="text-3xl md:text-4xl font-bold text-gray-900"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          {name}
        </h1>
        {description && (
          <p className="mt-2 text-gray-500 text-sm max-w-2xl">{description}</p>
        )}
      </div>
    </div>
  );
}

