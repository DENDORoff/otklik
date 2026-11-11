import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { markAllRead, markRead } from "./actions";

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    include: { appeal: { select: { id: true, code: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unread = notifications.filter((item) => !item.isRead).length;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold leading-tight text-brand">Уведомления</h1>
          <p className="mt-1 text-sm text-muted">
            Внутрисистемные события · непрочитанных: {unread}
          </p>
        </div>
        {unread > 0 ? (
          <form action={markAllRead}>
            <button type="submit" className="btn btn-secondary">
              Прочитать всё
            </button>
          </form>
        ) : null}
      </div>

      <div className="card divide-y divide-line">
        {notifications.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted">Уведомлений пока нет.</p>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={[
                "flex flex-wrap items-start justify-between gap-3 px-5 py-4",
                item.isRead ? "" : "bg-info",
              ].join(" ")}
            >
              <div>
                <p className="text-sm text-ink">{item.message}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>{formatDateTime(item.createdAt)}</span>
                  {item.appeal ? (
                    <>
                      <span>·</span>
                      <Link href={`/appeals/${item.appeal.id}`} className="font-semibold">
                        {item.appeal.code}
                      </Link>
                    </>
                  ) : null}
                </div>
              </div>

              {!item.isRead ? (
                <form action={markRead}>
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className="text-xs font-medium text-link hover:underline">
                    Прочитано
                  </button>
                </form>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
