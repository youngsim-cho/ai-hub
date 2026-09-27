import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

const { outputFiles } = await build({ entryPoints: ["app/storage.ts"], bundle: true, platform: "node", format: "esm", write: false });
const { loadHub, storageKey, createIdea, convertIdeaToProject, updateStatus } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);
let records;
beforeEach(() => {
  records = new Map();
  globalThis.window = {
    location: { pathname: "/sample-repository/" },
    localStorage: { getItem: (key) => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) },
  };
});

test("registration, conversion and status changes survive reloading", () => {
  const initial = loadHub();
  const data = createIdea({ title: "검증용 아이디어", targetTask: "반복 작업", proposer: "예시 담당자", department: "예시 부서", proposal: "초안 작성" });
  assert.equal(data.ideas.length, initial.ideas.length + 1);
  assert.deepEqual(loadHub(), data);
  const id = data.ideas[0].id;
  const converted = convertIdeaToProject(id);
  assert.equal(converted.ideas[0].status, "프로젝트 전환");
  assert.equal(converted.projects[0].linkedIdeaId, id);
  assert.equal(convertIdeaToProject(id).projects.length, initial.projects.length + 1);
  updateStatus("project", converted.projects[0].id, "정식운영");
  updateStatus("readiness", "R-001", "완료");
  assert.equal(loadHub().projects[0].stage, "정식운영");
  assert.equal(loadHub().readiness[0].status, "완료");
});

test("failed storage writes preserve the last saved record", () => {
  updateStatus("readiness", "R-001", "완료");
  const previous = records.get(storageKey());
  window.localStorage.setItem = () => { throw new Error("QuotaExceededError"); };
  assert.throws(() => updateStatus("readiness", "R-001", "미착수"), /저장하지 못했습니다/);
  assert.equal(records.get(storageKey()), previous);
});

test("corrupt or invalid stored data is reported without overwriting it", () => {
  for (const value of ["{broken", '{"ideas":[{}],"projects":[],"readiness":[]}']) {
    records.set(storageKey(), value);
    assert.throws(loadHub, /기존 기록은 보존/);
    assert.equal(records.get(storageKey()), value);
  }
});

test("blocked browser storage is reported", () => {
  window.localStorage.getItem = () => { throw new Error("SecurityError"); };
  assert.throws(loadHub, /저장 공간 접근을 차단/);
});

test("repository storage is isolated and index.html uses the same key", () => {
  const key = storageKey();
  updateStatus("readiness", "R-001", "완료");
  window.location.pathname = "/sample-repository/index.html";
  assert.equal(storageKey(), key);
  assert.equal(loadHub().readiness[0].status, "완료");
  window.location.pathname = "/another-repository/";
  assert.notEqual(storageKey(), key);
  assert.equal(loadHub().readiness[0].status, "진행 중");
});

test("invalid input does not change saved records", () => {
  assert.throws(() => createIdea({ title: " " }), /입력해 주세요/);
  assert.throws(() => updateStatus("project", "missing", "정식운영"), /찾을 수 없습니다/);
  assert.throws(() => updateStatus("readiness", "R-001", "잘못된 상태"), /올바른 상태/);
  assert.equal(records.size, 0);
});
