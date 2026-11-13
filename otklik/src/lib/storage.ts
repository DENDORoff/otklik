import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Хранилище вложений.
 *
 * Локально (и на любом хостинге с постоянным диском) файл кладётся в
 * `storage/uploads`. На Vercel файловая система эфемерна, поэтому при заданном
 * `BLOB_READ_WRITE_TOKEN` используется Vercel Blob — файл переживает деплой.
 */

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

export function storageMode(): "blob" | "filesystem" {
  return BLOB_TOKEN ? "blob" : "filesystem";
}

/**
 * Сохраняет вложение и возвращает путь для БД.
 * В режиме Blob путь начинается с `blob:`, в файловом режиме — `storage/uploads/...`.
 */
export async function storeAttachment(
  buffer: Buffer,
  storedName: string,
): Promise<string> {
  if (storageMode() === "blob") {
    const { put } = await import("@vercel/blob");
    const result = await put(`appeals/${storedName}`, buffer, {
      access: "private",
      addRandomSuffix: false,
      token: BLOB_TOKEN,
    });
    return result.url;
  }

  const dir = path.join(process.cwd(), "storage", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, storedName), buffer);
  return `storage/uploads/${storedName}`;
}
