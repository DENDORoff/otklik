import { getTranslator } from "@/lib/i18n/server";
export async function Logo({
  compact = false,
  tone = "light",
}: {
  compact?: boolean;
  tone?: "light" | "dark";
}) {
  const t = await getTranslator();
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="12" stroke="#ED1111" strokeWidth="2.2" />
        <path d="M16 4a12 12 0 0 0 0 24" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
        <circle cx="16" cy="16" r="4.2" fill="#ED1111" />
      </svg>
      {!compact && (
        <span
          className={[
            "text-[21px] font-semibold lowercase leading-none tracking-tight",
            tone === "light" ? "text-white" : "text-brand-ink",
          ].join(" ")}
        >
          {t("отклик")}
        </span>
      )}
    </span>
  );
}
