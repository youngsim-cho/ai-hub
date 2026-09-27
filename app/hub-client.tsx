"use client";

import { FormEvent, useCallback, useEffect, cloneElement, isValidElement, useId, useMemo, useState } from "react";
import {
  AppWindow, ArrowRight, BookOpen, Boxes, CheckCircle2, ChevronRight, CircleDot,
  Cloud, Code2, FileCheck2, Gauge, Lightbulb, ListChecks, Loader2, Plus, Rocket,
  Search, ShieldCheck, Users, Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import type { Idea, Project, Readiness, HubData } from "./types";
import { loadHub, updateStatus, createIdea, convertIdeaToProject } from "./storage";

type View = "dashboard" | "readiness" | "ideas" | "projects" | "release" | "resources";

const navItems = [
  { id: "dashboard" as View, label: "대시보드", icon: Gauge },
  { id: "readiness" as View, label: "도입 준비", icon: ListChecks },
  { id: "ideas" as View, label: "아이디어", icon: Lightbulb },
  { id: "projects" as View, label: "AI 과제·앱", icon: AppWindow },
  { id: "release" as View, label: "테스트·배포", icon: Rocket },
  { id: "resources" as View, label: "지침·자료", icon: BookOpen },
];

const viewTitles: Record<View, [string, string]> = {
  dashboard: ["AI 추진현황", "도입 준비부터 운영 중인 AI 앱까지 한눈에 확인합니다."],
  readiness: ["AI 도입 준비", "기술·보안·운영 기반을 영역별로 점검합니다."],
  ideas: ["아이디어 저장소", "분과 아이디어를 모으고 실제 과제로 전환합니다."],
  projects: ["AI 과제·앱 관리", "개발, 테스트, 배포, 운영 상태와 책임자를 관리합니다."],
  release: ["테스트·배포 관리", "운영 전 필수 확인사항과 과제별 위험을 점검합니다."],
  resources: ["지침·자료", "분과원이 동일한 기준으로 개발하고 검토할 수 있도록 자료를 모읍니다."],
};

const readinessStatuses = ["미착수", "검토 중", "진행 중", "완료", "해당 없음"];
const projectStages = ["개발 중", "자체검증", "분과 시범운영", "배포검토", "정식운영", "중단"];

function statusClass(status: string) {
  if (["완료", "정식운영", "프로젝트 전환"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["진행 중", "분과 시범운영", "자체검증"].includes(status)) return "border-blue-200 bg-blue-50 text-blue-700";
  if (["검토 중", "배포검토", "대기"].includes(status)) return "border-amber-200 bg-amber-50 text-amber-700";
  if (["중단", "미실시"].includes(status)) return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function StatusBadge({ status }: { status: string }) {
  return <Badge variant="outline" className={statusClass(status)}>{status}</Badge>;
}

function BrandMark() {
  return <div className="brand-mark" aria-hidden="true"><span>AI</span></div>;
}

function LoadingState() {
  return <div className="flex min-h-[420px] items-center justify-center gap-3 text-slate-500"><Loader2 className="size-5 animate-spin" /> 현황을 불러오는 중입니다</div>;
}

export default function HubClient() {
  const [view, setView] = useState<View>("dashboard");
  const [data, setData] = useState<HubData | null>(null);
  const [error, setError] = useState("");
  const [ideaDialog, setIdeaDialog] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      setData(loadHub());
    } catch (e) {
      setError(e instanceof Error ? e.message : "현황을 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const refresh = () => { void load(); };
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [load]);

  async function patchStatus(type: "readiness" | "project", id: string, status: string) {
    try {
      setData(updateStatus(type, id, status));
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "변경사항을 저장하지 못했습니다."); }
  }

  async function submitIdea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      setData(createIdea(body));
      setError("");
      setIdeaDialog(false);
    } catch (e) { setError(e instanceof Error ? e.message : "저장하지 못했습니다."); }
    finally { setBusy(false); }
  }

  async function convertIdea(id: string) {
    setBusy(true);
    try {
      setData(convertIdeaToProject(id));
      setError("");
      setView("projects");
    } catch (e) { setError(e instanceof Error ? e.message : "과제로 전환하지 못했습니다."); }
    finally { setBusy(false); }
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas" className="border-r border-slate-200 bg-[#0c2236] text-white">
        <SidebarHeader className="p-5">
          <div className="flex items-center gap-3"><BrandMark /><div><div className="text-[17px] font-bold tracking-tight">IAE AI Hub</div><div className="text-xs text-sky-200/80">AI 혁신분과</div></div></div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-sky-200/60">통합 관리</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={view === item.id} className="text-slate-200 hover:bg-white/10 hover:text-white data-[active=true]:bg-sky-400/15 data-[active=true]:text-sky-200">
                      <button onClick={() => setView(item.id)}><item.icon /><span>{item.label}</span></button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300"><ShieldCheck className="mb-2 size-4 text-sky-300" />입력 내용은 이 브라우저에만 저장됩니다. 브라우저 데이터를 삭제하면 기록도 지워집니다.</div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0 bg-[#f4f7fa]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3"><SidebarTrigger className="md:hidden" /><div><h1 className="text-lg font-bold text-slate-900">{viewTitles[view][0]}</h1><p className="hidden text-xs text-slate-500 sm:block">{viewTitles[view][1]}</p></div></div>
          <div className="flex items-center gap-2"><Badge variant="outline" className="hidden border-sky-200 bg-sky-50 text-sky-700 sm:flex"><CircleDot /> 2026 추진현황</Badge><Button onClick={() => { setView("ideas"); setIdeaDialog(true); }}><Plus /> 아이디어 등록</Button></div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-7">
          {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
          {!data ? (error ? <p className="p-6 text-slate-600">브라우저의 사이트 저장 권한을 확인한 뒤 새로고침해 주세요. 기존 저장 내용은 자동으로 지우지 않습니다.</p> : <LoadingState />) : <ViewContent view={view} data={data} setView={setView} patchStatus={patchStatus} convertIdea={convertIdea} busy={busy} />}
        </main>
      </SidebarInset>
      <IdeaDialog open={ideaDialog} onOpenChange={setIdeaDialog} onSubmit={submitIdea} busy={busy} />
    </SidebarProvider>
  );
}

function ViewContent({ view, data, setView, patchStatus, convertIdea, busy }: { view: View; data: HubData; setView: (view: View) => void; patchStatus: (type: "readiness" | "project", id: string, status: string) => void; convertIdea: (id: string) => void; busy: boolean }) {
  if (view === "readiness") return <ReadinessView items={data.readiness} onStatus={(id, status) => patchStatus("readiness", id, status)} />;
  if (view === "ideas") return <IdeasView ideas={data.ideas} onConvert={convertIdea} busy={busy} />;
  if (view === "projects") return <ProjectsView projects={data.projects} onStage={(id, status) => patchStatus("project", id, status)} />;
  if (view === "release") return <ReleaseView projects={data.projects} />;
  if (view === "resources") return <ResourcesView />;
  return <Dashboard data={data} setView={setView} />;
}

function Dashboard({ data, setView }: { data: HubData; setView: (view: View) => void }) {
  const readinessScore = Math.round(data.readiness.reduce((sum, item) => sum + ({ "완료": 100, "진행 중": 65, "검토 중": 35, "미착수": 0, "해당 없음": 100 }[item.status] ?? 0), 0) / Math.max(data.readiness.length, 1));
  const active = data.projects.filter((item) => item.stage !== "중단").length;
  const reviewRisks = data.projects.filter((item) => item.securityReview !== "완료").length;
  return (
    <div className="space-y-6">
      <section className="overview-band">
        <div><span className="eyebrow">AI TRANSFORMATION CONTROL CENTER</span><h2>아이디어가 실제 업무성과로 이어지도록<br className="hidden sm:block" /> 전 과정을 연결합니다.</h2><p>분과 활동, 개발환경 준비, 앱의 테스트·배포·운영을 하나의 기준으로 관리합니다.</p></div>
        <div className="readiness-gauge"><div className="gauge-value">{readinessScore}<span>%</span></div><div className="text-sm font-semibold">AI 도입 준비도</div><Progress value={readinessScore} className="mt-3 bg-white/20 [&>div]:bg-sky-300" /></div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Lightbulb} label="등록 아이디어" value={data.ideas.length} note={`${data.ideas.filter((i) => i.status === "검토 중").length}건 검토 중`} color="amber" onClick={() => setView("ideas")} />
        <Metric icon={Boxes} label="추진 과제·앱" value={active} note={`${data.projects.filter((p) => p.stage.includes("운영")).length}건 시범·정식 운영`} color="blue" onClick={() => setView("projects")} />
        <Metric icon={ShieldCheck} label="보안검토 필요" value={reviewRisks} note="운영 전 확인 필요" color="rose" onClick={() => setView("release")} />
        <Metric icon={CheckCircle2} label="완료된 준비항목" value={data.readiness.filter((r) => r.status === "완료").length} note={`전체 ${data.readiness.length}개 항목`} color="emerald" onClick={() => setView("readiness")} />
      </section>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
        <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle>AI 과제 생애주기</CardTitle><CardDescription>아이디어부터 정식운영까지, 현재 위치와 다음 검토단계를 연결합니다.</CardDescription></CardHeader><CardContent><Lifecycle projects={data.projects} /></CardContent></Card>
        <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle>우선 확인할 항목</CardTitle><CardDescription>지연되거나 기준 확정이 필요한 준비사항입니다.</CardDescription></CardHeader><CardContent className="space-y-3">{data.readiness.filter((r) => r.status !== "완료").slice(0, 4).map((item) => <button key={item.id} onClick={() => setView("readiness")} className="focus-card"><span className="icon-box"><ChevronRight /></span><span className="min-w-0 flex-1 text-left"><b>{item.title}</b><small>{item.category} · {item.owner}</small></span><StatusBadge status={item.status} /></button>)}</CardContent></Card>
      </div>
      <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle>최근 AI 과제</CardTitle><CardDescription>개발·테스트·보안 상태를 함께 확인하세요.</CardDescription></CardHeader><CardContent><ProjectsTable projects={data.projects} compact onStage={() => undefined} /></CardContent></Card>
    </div>
  );
}

function Metric({ icon: Icon, label, value, note, color, onClick }: { icon: typeof Lightbulb; label: string; value: number; note: string; color: string; onClick: () => void }) {
  return <button className="metric-card" onClick={onClick}><span className={`metric-icon ${color}`}><Icon /></span><span><small>{label}</small><strong>{value}</strong><em>{note}</em></span><ChevronRight className="ml-auto size-4 text-slate-300" /></button>;
}

function Lifecycle({ projects }: { projects: Project[] }) {
  const stages = ["아이디어", "개발 중", "자체검증", "분과 시범운영", "배포검토", "정식운영"];
  return <div className="lifecycle">{stages.map((stage, index) => { const count = stage === "아이디어" ? 0 : projects.filter((p) => p.stage === stage).length; return <div key={stage} className="life-step"><span className={count ? "active" : ""}>{index + 1}</span><b>{stage}</b><small>{stage === "아이디어" ? "발굴" : `${count}건`}</small></div>; })}</div>;
}

function ReadinessView({ items, onStatus }: { items: Readiness[]; onStatus: (id: string, status: string) => void }) {
  const groups = useMemo(() => Array.from(new Set(items.map((item) => item.category))), [items]);
  return <div className="space-y-5"><div className="grid gap-4 md:grid-cols-3">{["기술기반", "관리기준", "운영체계"].map((name, index) => { const target = index === 0 ? items.filter((x) => ["클라우드·인프라", "소스관리", "개발표준"].includes(x.category)) : index === 1 ? items.filter((x) => ["추진체계", "보안·데이터"].includes(x.category)) : items.filter((x) => ["테스트·배포", "운영", "교육·성과"].includes(x.category)); const value = Math.round(target.filter((x) => x.status === "완료").length / Math.max(target.length, 1) * 100); return <Card key={name} className="border-slate-200 py-5 shadow-none"><CardContent><div className="mb-3 flex items-center justify-between"><b>{name}</b><span className="text-sm font-bold text-sky-700">{value}%</span></div><Progress value={value} /><p className="mt-3 text-sm text-slate-500">{target.filter((x) => x.status === "완료").length}/{target.length}개 완료</p></CardContent></Card>; })}</div>
    <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle>도입 준비 체크리스트</CardTitle><CardDescription>상태를 바꾸면 즉시 전체 준비도에 반영됩니다.</CardDescription></CardHeader><CardContent className="space-y-6">{groups.map((group) => <section key={group}><div className="section-label">{group}</div><div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">{items.filter((item) => item.category === group).map((item) => <div key={item.id} className="grid gap-3 p-4 md:grid-cols-[1fr_150px_150px] md:items-center"><div><div className="font-semibold text-slate-800">{item.title}</div><p className="mt-1 text-sm text-slate-500">{item.detail}</p>{item.evidence && <div className="mt-2 text-xs font-medium text-sky-700">근거: {item.evidence}</div>}</div><div className="text-sm text-slate-500"><Users className="mr-1 inline size-4" />{item.owner}</div><Select value={item.status} onValueChange={(value) => onStatus(item.id, value)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{readinessStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div>)}</div></section>)}</CardContent></Card></div>;
}

function IdeasView({ ideas, onConvert, busy }: { ideas: Idea[]; onConvert: (id: string) => void; busy: boolean }) {
  const [query, setQuery] = useState("");
  const filtered = ideas.filter((idea) => [idea.title, idea.department, idea.proposer, idea.targetTask].join(" ").toLowerCase().includes(query.toLowerCase()));
  return <Card className="border-slate-200 shadow-none"><CardHeader><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle>분과 아이디어 관리대장</CardTitle><CardDescription className="mt-2">아이디어를 모아 검토하고, 추진 결정 시 과제로 전환합니다.</CardDescription></div><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-2.5 size-4 text-slate-400" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="아이디어·부서 검색" className="pl-9" /></div></div></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>아이디어</TableHead><TableHead>제안자·부서</TableHead><TableHead>대상업무</TableHead><TableHead>우선순위</TableHead><TableHead>상태</TableHead><TableHead className="text-right">과제 전환</TableHead></TableRow></TableHeader><TableBody>{filtered.map((idea) => <TableRow key={idea.id}><TableCell className="font-mono text-xs text-slate-500">{idea.id}</TableCell><TableCell className="max-w-[300px] whitespace-normal"><b>{idea.title}</b><p className="mt-1 line-clamp-1 text-xs text-slate-500">{idea.expectedEffect}</p></TableCell><TableCell>{idea.proposer}<div className="text-xs text-slate-400">{idea.department}</div></TableCell><TableCell>{idea.targetTask}</TableCell><TableCell><Badge variant="outline">{idea.priority}</Badge></TableCell><TableCell><StatusBadge status={idea.status} /></TableCell><TableCell className="text-right">{idea.status === "프로젝트 전환" ? <span className="text-xs text-slate-400">전환 완료</span> : <Button size="sm" variant="outline" disabled={busy} onClick={() => onConvert(idea.id)}>과제로 전환 <ArrowRight /></Button>}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>;
}

function ProjectsView({ projects, onStage }: { projects: Project[]; onStage: (id: string, status: string) => void }) {
  return <div className="space-y-5"><div className="stage-summary">{projectStages.slice(0, 5).map((stage) => <div key={stage}><span>{projects.filter((p) => p.stage === stage).length}</span><small>{stage}</small></div>)}</div><Card className="border-slate-200 shadow-none"><CardHeader><CardTitle>AI 과제·앱 관리대장</CardTitle><CardDescription>소스코드 위치와 배포 위치를 분리하고, 보안검토와 운영담당자를 함께 관리합니다.</CardDescription></CardHeader><CardContent><ProjectsTable projects={projects} onStage={onStage} /></CardContent></Card></div>;
}

function ProjectsTable({ projects, compact = false, onStage }: { projects: Project[]; compact?: boolean; onStage: (id: string, status: string) => void }) {
  return <Table><TableHeader><TableRow><TableHead>프로젝트</TableHead><TableHead>담당</TableHead><TableHead>단계</TableHead><TableHead>개발도구</TableHead>{!compact && <><TableHead>소스 / 배포</TableHead><TableHead>테스트</TableHead></>}<TableHead>보안검토</TableHead><TableHead>버전</TableHead></TableRow></TableHeader><TableBody>{projects.map((project) => <TableRow key={project.id}><TableCell className="max-w-[260px] whitespace-normal"><div className="font-mono text-xs text-slate-400">{project.id}</div><b>{project.title}</b><p className="mt-1 line-clamp-1 text-xs text-slate-500">{project.purpose}</p></TableCell><TableCell>{project.owner}<div className="text-xs text-slate-400">{project.department}</div></TableCell><TableCell>{compact ? <StatusBadge status={project.stage} /> : <Select value={project.stage} onValueChange={(value) => onStage(project.id, value)}><SelectTrigger className="w-[145px]"><SelectValue /></SelectTrigger><SelectContent>{projectStages.map((stage) => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}</SelectContent></Select>}</TableCell><TableCell>{project.aiTools || "미등록"}</TableCell>{!compact && <><TableCell className="max-w-[230px] whitespace-normal text-xs"><b>소스</b> {project.sourceLocation}<br /><b>배포</b> {project.deploymentLocation}</TableCell><TableCell><StatusBadge status={project.testStatus} /></TableCell></>}<TableCell><StatusBadge status={project.securityReview} /></TableCell><TableCell>{project.version}</TableCell></TableRow>)}</TableBody></Table>;
}

function ReleaseView({ projects }: { projects: Project[] }) {
  const checks = ["기능 요구사항 확인", "가상데이터 기반 테스트", "오류·예외상황 테스트", "개인정보·민감정보 확인", "외부 AI·API 연계 확인", "소스코드·README 등록", "운영담당자 지정", "배포 승인 및 사용자 안내"];
  return <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><Card className="border-slate-200 shadow-none"><CardHeader><CardTitle>운영 전 공통 체크리스트</CardTitle><CardDescription>앱별 검토표에서 동일하게 사용할 최소 기준입니다.</CardDescription></CardHeader><CardContent className="space-y-2">{checks.map((check, index) => <div key={check} className="release-check"><span>{String(index + 1).padStart(2, "0")}</span><b>{check}</b><FileCheck2 /></div>)}</CardContent></Card><Card className="border-slate-200 shadow-none"><CardHeader><CardTitle>과제별 배포 준비상태</CardTitle><CardDescription>누락된 항목을 먼저 확인합니다.</CardDescription></CardHeader><CardContent className="space-y-4">{projects.map((project) => { const done = [project.sourceLocation !== "등록 필요", project.testStatus === "완료", project.securityReview === "완료", !["", "미정"].includes(project.operationsOwner), project.deploymentLocation !== "개발자 PC"].filter(Boolean).length; return <div key={project.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><b>{project.title}</b><div className="mt-1 text-xs text-slate-500">{project.id} · {project.stage}</div></div><strong className="text-sky-700">{done}/5</strong></div><Progress value={done * 20} className="mt-4" /><div className="mt-3 flex flex-wrap gap-2 text-xs">{project.sourceLocation === "등록 필요" && <Badge variant="outline" className="border-rose-200 text-rose-700">소스 미등록</Badge>}{project.securityReview !== "완료" && <Badge variant="outline" className="border-amber-200 text-amber-700">보안검토 필요</Badge>}{["", "미정"].includes(project.operationsOwner) && <Badge variant="outline">운영담당 미정</Badge>}</div></div>; })}</CardContent></Card></div>;
}

function ResourcesView() {
  const docs = [
    { icon: ShieldCheck, title: "생성형 AI 활용 및 정보보안 지침", meta: "V2.1 · 전 직원 배포용", status: "작성 중" },
    { icon: Workflow, title: "AI 앱 개발·등록·배포 절차", meta: "아이디어부터 운영·중단까지", status: "초안" },
    { icon: FileCheck2, title: "AI 프로그램 테스트 체크리스트", meta: "기능·보안·사용자 테스트", status: "준비 중" },
    { icon: Code2, title: "소스코드 관리 기준", meta: "저장소·권한·버전·인수인계", status: "검토 필요" },
    { icon: Cloud, title: "기업형 AI·클라우드 검토표", meta: "학습 제외·보관기간·관리자 통제", status: "검토 필요" },
  ];
  return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{docs.map((doc) => <Card key={doc.title} className="group border-slate-200 shadow-none transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"><CardContent className="pt-1"><div className="mb-6 flex items-start justify-between"><span className="resource-icon"><doc.icon /></span><StatusBadge status={doc.status} /></div><h3 className="font-bold text-slate-900">{doc.title}</h3><p className="mt-2 text-sm text-slate-500">{doc.meta}</p><p className="mt-5 text-sm text-slate-500">자료 준비 중 · 아직 첨부된 문서가 없습니다.</p></CardContent></Card>)}</div>;
}

function IdeaDialog({ open, onOpenChange, onSubmit, busy }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; busy: boolean }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>AI 아이디어 등록</DialogTitle><DialogDescription>등록 후 검토를 거쳐 실제 AI 과제·앱으로 전환할 수 있습니다.</DialogDescription></DialogHeader><form onSubmit={onSubmit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="아이디어명"><Input name="title" required placeholder="예: 주간보고 초안 자동작성" /></Field><Field label="대상업무"><Input name="targetTask" required placeholder="개선하려는 업무" /></Field><Field label="제안자"><Input name="proposer" required placeholder="이름 또는 분과원" /></Field><Field label="부서"><Input name="department" required placeholder="소속부서" /></Field></div><Field label="현 업무·문제점"><Textarea name="problem" placeholder="현재 어떤 불편이나 반복작업이 있나요?" /></Field><Field label="제안내용"><Textarea name="proposal" required placeholder="AI를 어떻게 활용하면 좋을지 적어주세요." /></Field><div className="grid gap-4 sm:grid-cols-[1fr_180px]"><Field label="기대효과"><Input name="expectedEffect" placeholder="시간절감, 오류감소 등" /></Field><Field label="우선순위"><Select name="priority" defaultValue="보통"><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="높음">높음</SelectItem><SelectItem value="보통">보통</SelectItem><SelectItem value="낮음">낮음</SelectItem></SelectContent></Select></Field></div><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>취소</Button><Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />} 등록하기</Button></DialogFooter></form></DialogContent></Dialog>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { const id = useId(); return <div className="space-y-2"><Label id={`${id}-label`} htmlFor={id}>{label}</Label>{isValidElement<{ id?: string; "aria-labelledby"?: string }>(children) ? cloneElement(children, { id, "aria-labelledby": `${id}-label` }) : children}</div>; }
