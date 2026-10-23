// GitHub 이슈 폼 본문을 제품 JSON으로 바꿉니다.
// 사용: node scripts/parse-issue.mjs <event.json>  → stdout에 JSON
import { readFileSync } from "node:fs";

const SIGNALS = [
  ["MCP 서버", "mcp"], ["공개 API", "api"], ["CLI", "cli"], ["OpenAPI 스펙", "openapi"],
  ["llms.txt", "llms"], ["키 인증", "key"], ["샌드박스", "sandbox"],
];

export function parseIssueForm(body) {
  const sections = {};
  let current = null;
  for (const line of String(body || "").replace(/\r/g, "").split("\n")) {
    const h = line.match(/^###\s+(.+?)\s*$/);
    if (h) { current = h[1]; sections[current] = []; continue; }
    if (current) sections[current].push(line);
  }
  const text = (k) => {
    const v = (sections[k] || []).join("\n").trim();
    return v === "_No response_" ? "" : v;
  };
  const sigs = (sections["에이전트 체크리스트"] || [])
    .filter((l) => /^- \[[xX]\]/.test(l))
    .map((l) => SIGNALS.find(([label]) => l.includes(label))?.[1])
    .filter(Boolean);
  return {
    name: text("제품 이름"),
    url: text("링크"),
    tagline: text("한 줄 소개"),
    category: text("카테고리"),
    sigs,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const event = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const issue = event.issue;
  const product = { ...parseIssueForm(issue.body), maker: issue.user.login, issue_number: issue.number };
  process.stdout.write(JSON.stringify(product));
}
