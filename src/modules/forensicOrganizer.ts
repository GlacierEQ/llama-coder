import fs from "fs";
import path from "path";

export interface OrganizeOptions {
  casePrefix: string;
  targetDir: string;
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function organizeDirectory({
  casePrefix,
  targetDir,
}: OrganizeOptions): void {
  const files = fs.readdirSync(targetDir);
  let counter = 1;

  for (const file of files) {
    const fullPath = path.join(targetDir, file);
    if (!fs.statSync(fullPath).isFile()) {
      continue;
    }
    const ext = path.extname(file).replace(/^\./, "").toLowerCase() || "other";
    const destDir = path.join(targetDir, ext);
    ensureDir(destDir);
    const newName = `${casePrefix}-${String(counter).padStart(4, "0")}${path.extname(file)}`;
    fs.renameSync(fullPath, path.join(destDir, newName));
    counter += 1;
  }
}
