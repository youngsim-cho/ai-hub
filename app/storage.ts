import seed from "./seed.json";
import type { HubData, Idea, Project } from "./types";

// Each repository path on github.io has its own browser storage.
export function storageKey() {
  return `iae-ai-hub:v1:${window.location.pathname.replace(/[^/]*$/, "")}`;
}

function validData(value: unknown): value is HubData {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return (["ideas", "projects", "readiness"] as const).every((group) => {
    const rows = data[group];
    if (!Array.isArray(rows)) return false;
    const keys = Object.keys(seed[group][0]).filter((key) => key !== "createdAt" && key !== "linkedIdeaId");
    const ids = new Set<string>();
    return rows.every((row) => {
      if (!row || typeof row !== "object" || typeof row.id !== "string" || !row.id || ids.has(row.id)) return false;
      ids.add(row.id);
      return keys.every((key) => typeof row[key] === (key === "sortOrder" ? "number" : "string"));
    });
  });
}

export function loadHub(): HubData {
  let raw: string | null;
  try { raw = window.localStorage.getItem(storageKey()); }
  catch { throw new Error("브라우저가 저장 공간 접근을 차단했습니다. 사이트 저장 권한을 허용해 주세요."); }
  if (raw === null) return structuredClone(seed);
  try {
    const value: unknown = JSON.parse(raw);
    if (!validData(value)) throw new Error("invalid data");
    return value;
  } catch {
    throw new Error("저장된 기록을 읽을 수 없습니다. 기존 기록은 보존했습니다. 브라우저 데이터를 지우기 전에 도움을 요청해 주세요.");
  }
}

function saveHub(data: HubData): HubData {
  try { window.localStorage.setItem(storageKey(), JSON.stringify(data)); }
  catch { throw new Error("저장하지 못했습니다. 브라우저의 저장 권한이나 남은 공간을 확인해 주세요. 변경 전 기록은 유지됩니다."); }
  return data;
}

function nextId(prefix: string, rows: { id: string }[]) {
  const number = rows.reduce((max, row) => Math.max(max, Number(row.id.split("-").at(-1)) || 0), 0) + 1;
  return `${prefix}-${new Date().getFullYear()}-${String(number).padStart(3, "0")}`;
}

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function createIdea(body: Record<string, unknown>): HubData {
  const text = (key: string) => typeof body[key] === "string" ? body[key].trim() : "";
  if (!["title", "targetTask", "proposer", "department", "proposal"].every((key) => text(key))) {
    throw new Error("아이디어명, 대상업무, 제안자, 부서, 제안내용을 입력해 주세요.");
  }
  const data = loadHub();
  const priority = text("priority") || "보통";
  if (!["높음", "보통", "낮음"].includes(priority)) throw new Error("올바른 우선순위를 선택해 주세요.");
  const idea: Idea = {
    id: nextId("AI", data.ideas), proposalDate: today(), title: text("title"),
    targetTask: text("targetTask"), proposer: text("proposer"), department: text("department"),
    proposal: text("proposal"), problem: text("problem"), expectedEffect: text("expectedEffect"),
    priority, status: "검토 중", reviewNote: "",
  };
  return saveHub({ ...data, ideas: [idea, ...data.ideas] });
}

export function convertIdeaToProject(id: string): HubData {
  const data = loadHub();
  const idea = data.ideas.find((row) => row.id === id);
  if (!idea) throw new Error("아이디어를 찾을 수 없습니다.");
  if (data.projects.some((row) => row.linkedIdeaId === id)) return data;
  const project: Project = {
    id: nextId("P", data.projects), linkedIdeaId: idea.id, registeredDate: today(),
    title: idea.title, owner: idea.proposer, department: idea.department, purpose: idea.proposal,
    stage: "개발 중", aiTools: "", developmentMethod: "", sourceLocation: "등록 필요",
    deploymentLocation: "등록 필요", testStatus: "미실시", workUse: "검토 중",
    personalData: "없음", sensitiveData: "검토 필요", securityReview: "미실시",
    operationsOwner: "미정", version: "v0.1",
  };
  return saveHub({ ...data, projects: [project, ...data.projects], ideas: data.ideas.map((row) => row.id === id ? { ...row, status: "프로젝트 전환", reviewNote: `${project.id}로 전환` } : row) });
}

export function updateStatus(type: "readiness" | "project", id: string, status: string): HubData {
  const data = loadHub();
  const allowed = type === "readiness" ? ["미착수", "검토 중", "진행 중", "완료", "해당 없음"] : ["개발 중", "자체검증", "분과 시범운영", "배포검토", "정식운영", "중단"];
  if (!allowed.includes(status)) throw new Error("올바른 상태를 선택해 주세요.");
  if (!(type === "readiness" ? data.readiness : data.projects).some((row) => row.id === id)) throw new Error("항목을 찾을 수 없습니다.");
  return saveHub(type === "readiness"
    ? { ...data, readiness: data.readiness.map((row) => row.id === id ? { ...row, status } : row) }
    : { ...data, projects: data.projects.map((row) => row.id === id ? { ...row, stage: status } : row) });
}
