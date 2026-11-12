import { ImageResponse } from "next/og";

export const alt = "Отклик — обратная связь и предложения сотрудников";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#082742",
          color: "#ffffff",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              border: "5px solid #ED1111",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 20, height: 20, borderRadius: 999, background: "#ED1111" }} />
          </div>
          <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>отклик</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>
            Каждому обращению сотрудника — итог
          </div>
          <div style={{ fontSize: 30, color: "rgba(255,255,255,0.72)", maxWidth: 900 }}>
            Подача → маршрутизация → исполнитель → результат → оценка автора
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          <span>ГК «Модус Трейд» · демо-стенд</span>
          <span>Прозрачно. Со сроком. С оценкой.</span>
        </div>
      </div>
    ),
    size,
  );
}
