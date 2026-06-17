interface PhotoUploadProps {
  onSelect: (file: File) => void;
  loading?: boolean;
}

export function PhotoUpload({ onSelect, loading }: PhotoUploadProps) {
  return (
    <label
      className={`
        group flex cursor-pointer flex-col items-center justify-center
        rounded-xl border border-dashed border-[var(--color-border)]
        bg-[var(--color-surface)]/50 px-6 py-14
        transition-colors hover:border-[#c9c4bc] hover:bg-[var(--color-surface)]
        active:bg-[var(--color-surface)]
        sm:py-16
        ${loading ? "pointer-events-none opacity-50" : ""}
      `}
    >
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={loading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = "";
        }}
      />
      {loading ? (
        <svg
          className="h-5 w-5 animate-spin text-[var(--color-ink-muted)]"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        <span className="text-3xl font-light leading-none text-[var(--color-ink-muted)] transition-colors group-hover:text-[var(--color-ink-secondary)]">
          +
        </span>
      )}
      <p className="text-body mt-3 text-sm">
        {loading ? "生成中…" : "选照片"}
      </p>
    </label>
  );
}
