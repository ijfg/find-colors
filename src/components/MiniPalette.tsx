interface MiniPaletteProps {
  colors: string[];
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function MiniPalette({
  colors,
  size = "sm",
  className = "",
}: MiniPaletteProps) {
  const cell =
    size === "xs" ? "h-3 w-3" : size === "md" ? "h-6 w-6" : "h-4 w-4";

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {colors.map((color, i) => (
        <div
          key={i}
          className={`${cell} shrink-0 rounded-sm ring-1 ring-inset ring-[var(--color-border)]/80`}
          style={{ backgroundColor: color || "#e7e5e4" }}
          title={color || undefined}
        />
      ))}
    </div>
  );
}
