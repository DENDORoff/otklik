import { pdf } from "pdf-to-img";
import fs from "node:fs";
import path from "node:path";

const src = "D:/DW/hackathon/ПИТЧ-ПРЕЗЕНТАЦИЯ.pdf";
const outDir = "D:/DW/hackathon/питч/preview";
fs.mkdirSync(outDir, { recursive: true });

const document = await pdf(src, { scale: 1.55 });
let page = 1;
for await (const image of document) {
  const file = path.join(outDir, String(page).padStart(2, "0") + ".png");
  fs.writeFileSync(file, image);
  console.log("страница", page, "->", file, `(${(image.length / 1024).toFixed(0)} КБ)`);
  page++;
}
console.log("всего страниц:", page - 1);
