/**
 * Figma-aligned VedaAI classroom workspace: soft-gray canvas, card-style sidebar,
 * orange action accents, upload/extraction/mapping states, and durable review metadata.
 */
import { useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  Bot,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  FileText,
  Grid2X2,
  Library,
  LoaderCircle,
  LogIn,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

type Stage = "upload" | "extracting" | "mapping" | "library";
type MappingStatus = "mapped" | "review" | "unanswered" | "unmatched";

function getBrowserOwnerKey() {
  const storageKey = "veda-ai-assessment-owner";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;
  const created = nanoid(24);
  window.localStorage.setItem(storageKey, created);
  return created;
}

type ExtractedQuestion = {
  id: string;
  number: string;
  question: string;
  marks: number;
  score?: number;
  status: MappingStatus;
  confidence: number;
  page: number;
  summary: string;
  region?: { top: number; left: number; width: number; height: number };
};

const extractedQuestions: ExtractedQuestion[] = [
  { id: "q11", number: "11", question: "Which statement best explains the process used by plants to make their food?", marks: 2, score: 2, status: "mapped", confidence: 98, page: 1, summary: "A correct explanation of photosynthesis is present in the opening lines.", region: { top: 11, left: 9, width: 82, height: 13 } },
  { id: "q11a", number: "11 (a)", question: "Which of the following organisms is primarily involved in photosynthesis?", marks: 2, score: 2, status: "mapped", confidence: 96, page: 1, summary: "The student identifies the green plant and explains the role of chlorophyll.", region: { top: 31, left: 9, width: 82, height: 14 } },
  { id: "q11b", number: "11 (b)", question: "Explain the role of chloroplasts in photosynthesis, naming the main pigment involved.", marks: 2, score: 2, status: "mapped", confidence: 93, page: 1, summary: "A labelled leaf diagram and chlorophyll reference were located.", region: { top: 50, left: 9, width: 82, height: 15 } },
  { id: "q12", number: "12", question: "Describe the flow of blood through the human heart in the correct sequence.", marks: 3, score: 2, status: "review", confidence: 79, page: 2, summary: "A partial response is mapped; the final circulation step needs teacher review.", region: { top: 68, left: 9, width: 82, height: 14 } },
  { id: "q13", number: "13", question: "Draw a labelled diagram of an alveolus showing diffusion of gases.", marks: 3, score: 3, status: "mapped", confidence: 92, page: 2, summary: "A labelled sketch with the relevant gas exchange terms was detected.", region: { top: 76, left: 9, width: 82, height: 13 } },
  { id: "q14", number: "14", question: "Draw a neat labelled diagram of a leaf and show the position of chloroplasts.", marks: 3, score: 3, status: "mapped", confidence: 90, page: 1, summary: "The diagram appears after the written explanation, out of question order.", region: { top: 47, left: 9, width: 82, height: 18 } },
  { id: "q15", number: "15", question: "Draw a neat labelled diagram of the human circulatory system and write its main function.", marks: 3, status: "unanswered", confidence: 0, page: 3, summary: "No answer region was found across the submitted answer pages." },
  { id: "q16", number: "16", question: "Explain the role of a nephron in removing waste products from blood.", marks: 5, score: 4, status: "mapped", confidence: 88, page: 3, summary: "A complete answer spans the lower half of page three." },
  { id: "q17", number: "17", question: "Give two functions of the human liver in maintaining internal balance.", marks: 4, score: 4, status: "mapped", confidence: 94, page: 3, summary: "Two distinct functions were identified in the answer." },
  { id: "q18", number: "18", question: "A diagram shows two pipe arms. Identify the part that carries water upwards in a plant.", marks: 2, score: 2, status: "mapped", confidence: 85, page: 2, summary: "The response maps to a diagram annotation on page two." },
  { id: "q19", number: "19", question: "An ecosystem has total volume 200 litres. Calculate the water contribution by each organism.", marks: 4, status: "unmatched", confidence: 62, page: 3, summary: "A calculation is detected but its question number is unclear; no safe mapping was made." },
];

const statusMeta: Record<MappingStatus, { label: string; className: string }> = {
  mapped: { label: "Mapped", className: "bg-[#EAF7E5] text-[#3E8A35]" },
  review: { label: "Review", className: "bg-[#FFF2D8] text-[#C07B08]" },
  unanswered: { label: "Unanswered", className: "bg-[#F5F5F5] text-[#929292]" },
  unmatched: { label: "Unmatched", className: "bg-[#FFF0EC] text-[#D66D57]" },
};

function VedaMark({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-[#252525]">
      <span className={`${small ? "h-6 w-6 text-[14px]" : "h-8 w-8 text-[18px]"} grid place-items-center rounded-[7px] bg-[#2B2B2B] font-black leading-none text-white`}>V</span>
      {!small && <span className="text-[18px] font-extrabold tracking-[-0.06em]">VedaAI</span>}
    </div>
  );
}

function FileCard({ label, file, onChange, onClear, error }: {
  label: string;
  file: File | null;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  error?: string;
}) {
  return (
    <label className={`relative flex h-[106px] w-full cursor-pointer items-center justify-center rounded-[14px] border border-dashed bg-white transition sm:h-[122px] ${file ? "border-[#DADADA]" : "border-[#D8D8D8] hover:border-[#FF8F6D]"}`}>
      {file ? (
        <div className="flex w-[82%] items-center gap-3 rounded-md bg-[#F8F8F8] px-3 py-2.5 text-left shadow-sm">
          <span className="grid h-7 w-6 shrink-0 place-items-center rounded bg-[#E85656] text-[7px] font-extrabold text-white">PDF</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-[#363636]">{file.name}</span><span className="mt-0.5 block text-[9px] text-[#8C8C8C]">{(file.size / 1024 / 1024).toFixed(1)}MB · {label === "Question Paper" ? "2 Pages" : "8 Pages"}</span></span>
          <button type="button" aria-label={`Remove ${label}`} onClick={(event) => { event.preventDefault(); onClear(); }} className="grid h-4 w-4 place-items-center rounded-full bg-[#575757] text-white transition hover:bg-[#282828]"><X size={10} /></button>
        </div>
      ) : (
        <div className="text-center">
          <span className="mx-auto grid h-9 w-9 place-items-center rounded-lg bg-[#F7F7F7] text-[#242424]"><Upload size={18} strokeWidth={2.2} /></span>
          <p className="mt-3 text-[12px] font-semibold text-[#333333]">Upload <span className="text-[#FF6E42]">{label}</span></p>
          <p className="mt-0.5 text-[9px] text-[#9A9A9A]">Max 10MB</p>
        </div>
      )}
      <input className="sr-only" aria-label={`Upload ${label}`} type="file" accept=".pdf,image/*" onChange={onChange} />
      {error && <span className="absolute -bottom-5 left-0 text-[10px] font-medium text-[#D54F42]">{error}</span>}
    </label>
  );
}

function StageHeader({ userName }: { userName: string }) {
  return (
    <header className="veda-topbar">
      <div className="flex items-center gap-3"><ArrowLeft size={17} strokeWidth={1.7} /><span className="h-3.5 w-px bg-[#D8D8D8]" /><FileText size={13} className="text-[#8D8D8D]" /><span className="text-[11px] text-[#8A8A8A]">Exams</span></div>
      <div className="flex items-center gap-4 text-[#333333]"><CircleHelp size={17} strokeWidth={1.7} /><span className="relative"><Bell size={17} strokeWidth={1.7} /><span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-[#FF6E42]" /></span><Sparkles size={16} fill="currentColor" strokeWidth={1.5} /><div className="flex items-center gap-2 border-l border-[#E6E6E6] pl-4"><span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-[#EBC09C] to-[#6D3A2B] text-[9px] font-bold text-white">MR</span><span className="hidden text-[11px] font-semibold sm:block">{userName}</span><ChevronDown size={13} /></div></div>
    </header>
  );
}

export default function Home() {
  const utils = trpc.useUtils();
  const [ownerKey] = useState(getBrowserOwnerKey);
  const [stage, setStage] = useState<Stage>("upload");
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState(extractedQuestions[0]?.id ?? "q11");
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [reviewSaved, setReviewSaved] = useState(false);
  const savedAssessments = trpc.assessments.list.useQuery({ ownerKey });
  const loadedAssessment = trpc.assessments.get.useQuery({ assessmentId: assessmentId ?? "pending", ownerKey }, { enabled: Boolean(assessmentId) });

  const createAssessment = trpc.assessments.create.useMutation({
    onSuccess: data => {
      if (data?.session.id) setAssessmentId(data.session.id);
      void utils.assessments.list.invalidate({ ownerKey });
    },
  });
  const setFocus = trpc.assessments.setFocus.useMutation();
  const saveReview = trpc.assessments.saveReview.useMutation({
    onSuccess: () => {
      setReviewSaved(true);
      void utils.assessments.list.invalidate({ ownerKey });
    },
  });

  const activeQuestion = useMemo(() => extractedQuestions.find(question => question.id === activeQuestionId) ?? extractedQuestions[0]!, [activeQuestionId]);
  const userName = "Teacher";
  const readyToMap = Boolean(questionFile && answerFile && !uploadError);

  useEffect(() => {
    if (stage === "mapping") setReviewSaved(false);
  }, [activeQuestionId, stage]);

  useEffect(() => {
    const savedQuestionId = loadedAssessment.data?.session.activeQuestionId;
    if (!assessmentId || !savedQuestionId) return;
    const matchingQuestion = extractedQuestions.find(question => savedQuestionId === `${assessmentId}q${question.id}`);
    if (matchingQuestion) setActiveQuestionId(matchingQuestion.id);
  }, [assessmentId, loadedAssessment.data?.session.activeQuestionId]);

  const chooseFile = (kind: "question" | "answer") => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Choose a file smaller than 10MB.");
      return;
    }
    setUploadError(null);
    if (kind === "question") setQuestionFile(file);
    else setAnswerFile(file);
  };

  const buildAssessmentPayload = (id: string) => ({
    id,
    title: questionFile?.name.replace(/\.[^.]+$/, "") || "Question paper mapping",
    studentName: "Rudra",
    questionPaperName: questionFile?.name,
    answerSheetName: answerFile?.name,
    questions: extractedQuestions.map((question, index) => ({
      id: `${id}q${question.id}`,
      questionNumber: question.number,
      sortOrder: index + 1,
      text: question.question,
      marks: question.marks,
      mappingStatus: question.status === "review" ? "needs_review" as const : question.status,
      extractedAnswer: question.summary,
      confidence: question.confidence,
      suggestedScore: question.score,
      answerPage: question.page,
    })),
    regions: extractedQuestions.flatMap(question => question.region ? [{
      id: `${id}r${question.id}`,
      questionId: `${id}q${question.id}`,
      pageNumber: question.page,
      topPercent: Math.round(question.region.top),
      leftPercent: Math.round(question.region.left),
      widthPercent: Math.round(question.region.width),
      heightPercent: Math.round(question.region.height),
      label: question.number,
      confidence: question.confidence,
    }] : []),
  });

  const beginMapping = () => {
    if (!readyToMap) return;
    const nextAssessmentId = nanoid(14);
    setStage("extracting");
    window.setTimeout(() => {
      setAssessmentId(nextAssessmentId);
      setActiveQuestionId(extractedQuestions[0]?.id ?? "q11");
      setStage("mapping");
      createAssessment.mutate({ ...buildAssessmentPayload(nextAssessmentId), ownerKey });
    }, 1450);
  };

  const selectQuestion = (question: ExtractedQuestion) => {
    setActiveQuestionId(question.id);
    if (assessmentId) {
      setFocus.mutate({ assessmentId, questionId: `${assessmentId}q${question.id}`, answerPage: question.page, ownerKey });
    }
  };

  const persistReview = () => {
    if (!assessmentId || createAssessment.isPending) return;
    saveReview.mutate({
      eventId: nanoid(18),
      assessmentId,
      questionId: `${assessmentId}q${activeQuestion.id}`,
      ownerKey,
      decision: activeQuestion.status === "review" ? "adjusted" : "approved",
      score: activeQuestion.score,
      note: activeQuestion.summary,
    });
  };

  return (
    <div className="veda-shell">
      <aside className="veda-sidebar">
        <div><VedaMark /><button className="teacher-toolkit"><Sparkles size={12} fill="currentColor" /> AI Teacher's Toolkit</button></div>
        <nav className="veda-nav" aria-label="VedaAI navigation">
          <button onClick={() => setStage("upload")} className={stage === "upload" ? "" : ""}><Grid2X2 size={15} /> Home</button>
          <button><BookOpen size={15} /> My Classroom</button>
          <button><ClipboardList size={15} /> Assignments</button>
          <button onClick={() => setStage("upload")} className={stage === "upload" || stage === "extracting" || stage === "mapping" ? "active" : ""}><FileText size={15} /> Exams</button>
          <button onClick={() => setStage("library")} className={stage === "library" ? "active" : ""}><Library size={15} /> My Library</button>
        </nav>
        <div className="sidebar-bottom"><button className="settings-link"><Settings size={14} /> Settings</button><div className="school-card"><span className="school-seal">DP</span><span><strong>Delhi Public School</strong><small>Bokaro Steel City</small></span></div></div>
      </aside>

      <main className="veda-main">
        <StageHeader userName={userName} />
        {stage === "upload" && <UploadStage questionFile={questionFile} answerFile={answerFile} chooseFile={chooseFile} clearQuestion={() => setQuestionFile(null)} clearAnswer={() => setAnswerFile(null)} error={uploadError ?? undefined} ready={readyToMap} starting={createAssessment.isPending} onStart={beginMapping} />}
        {stage === "extracting" && <ExtractingStage />}
        {stage === "mapping" && <MappingStage activeQuestion={activeQuestion} onSelect={selectQuestion} saveReview={persistReview} reviewSaved={reviewSaved} isSaving={saveReview.isPending || createAssessment.isPending} isPersisted={Boolean(assessmentId && !createAssessment.isPending)} />}
        {stage === "library" && <LibraryStage isLoading={savedAssessments.isLoading} assessments={savedAssessments.data ?? []} onNew={() => setStage("upload")} onOpen={id => { setAssessmentId(id); setStage("mapping"); }} />}
      </main>
    </div>
  );
}

function UploadStage({ questionFile, answerFile, chooseFile, clearQuestion, clearAnswer, error, ready, starting, onStart }: {
  questionFile: File | null; answerFile: File | null; chooseFile: (kind: "question" | "answer") => (event: React.ChangeEvent<HTMLInputElement>) => void; clearQuestion: () => void; clearAnswer: () => void; error?: string; ready: boolean; starting: boolean; onStart: () => void;
}) {
  return <section className="upload-stage"><div className="upload-copy"><h1>Upload <span>Question Paper &amp; Answer Sheets</span></h1><p>Upload both files to get started</p></div><div className="teacher-orb"><div className="teacher-avatar"><Bot size={34} strokeWidth={1.8} /></div><i /><b /><em /></div><div className="upload-grid"><FileCard label="Question Paper" file={questionFile} onChange={chooseFile("question")} onClear={clearQuestion} error={error} /><FileCard label="Answer Sheet" file={answerFile} onChange={chooseFile("answer")} onClear={clearAnswer} error={error} /></div><Button disabled={!ready || starting} onClick={onStart} className="mapping-cta">{starting ? <LoaderCircle size={14} className="animate-spin" /> : "Start Mapping"}<ArrowRight size={14} /></Button><p className="mapping-note">Once both files are uploaded, you'll be able to map answers with questions</p></section>;
}

function ExtractingStage() {
  return <section className="extracting-stage"><div className="extracting-stars"><span>✦</span><span>✦</span><span>✦</span></div><h2>Extracting...</h2><p>This may take a while</p></section>;
}

function MappingStage({ activeQuestion, onSelect, saveReview, reviewSaved, isSaving, isPersisted }: { activeQuestion: ExtractedQuestion; onSelect: (question: ExtractedQuestion) => void; saveReview: () => void; reviewSaved: boolean; isSaving: boolean; isPersisted: boolean }) {
  const meta = statusMeta[activeQuestion.status];
  return <section className="mapping-stage"><div className="mapping-layout"><section className="question-panel"><div className="question-panel-head"><div><strong>Extracted Questions <span>(From question paper)</span></strong><small>11 questions were extracted in original paper order</small></div><button>Expand all</button></div><div className="question-list">{extractedQuestions.map(question => <button key={question.id} onClick={() => onSelect(question)} className={`mapping-question ${question.id === activeQuestion.id ? "selected" : ""}`}><span className="question-number">{question.number}</span><span className="question-copy"><strong>{question.question}</strong><small>{question.status === "unanswered" ? "No matching answer found" : question.summary}</small></span><span className="question-score"><b className={statusMeta[question.status].className}>{question.score ?? "—"} / {question.marks}</b><i>{question.confidence}%</i></span></button>)}</div></section><section className="answer-panel"><div className="answer-panel-head"><strong>Answer Sheet</strong><div><button>− 100% +</button><button>Page {activeQuestion.page} of 3 <ChevronDown size={12} /></button></div></div><div className="answer-scroll"><div className="answer-paper"><AnswerSheetMock />{activeQuestion.region ? <div className="answer-highlight" style={{ top: `${activeQuestion.region.top}%`, left: `${activeQuestion.region.left}%`, width: `${activeQuestion.region.width}%`, height: `${activeQuestion.region.height}%` }}><span>Q{activeQuestion.number}</span></div> : <div className="no-answer-found">No mapped answer region<br />for Question {activeQuestion.number}</div>}</div></div><div className="mapping-detail"><span className={`status-dot ${meta.className}`}>{meta.label}</span><p>{activeQuestion.summary}</p><div>{isPersisted ? <button disabled={isSaving} onClick={saveReview}>{isSaving ? "Saving..." : reviewSaved ? "Saved" : "Save teacher review"}</button> : <span>Saved in this browser</span>}</div></div></section></div></section>;
}

function AnswerSheetMock() {
  return <div className="synthetic-answer-sheet" aria-label="Illustrated handwritten student answer sheet"><div className="sheet-margin" /><p className="handwriting title-line">Photosynthesis is the process used by green plants.</p><p className="handwriting">It converts light energy into chemical energy.</p><p className="handwriting">Carbon dioxide and water are used to make food.</p><div className="plant-sketch"><span>sunlight</span><b>☼</b><i>leaf</i><em>roots</em></div><p className="handwriting lower">The process mainly occurs in the chloroplast.</p><p className="handwriting">Chlorophyll captures light energy for the reaction.</p></div>;
}

function LibraryStage({ isLoading, assessments, onNew, onOpen }: { isLoading: boolean; assessments: Array<{ id: string; title: string; studentName: string | null; stage: string; updatedAt: Date }>; onNew: () => void; onOpen: (id: string) => void }) {
  return <section className="library-stage"><div className="library-head"><div><p>MY LIBRARY</p><h1>Saved assessment reviews</h1></div><button onClick={onNew}><Plus size={15} /> New assessment</button></div>{isLoading ? <div className="library-empty"><LoaderCircle className="animate-spin" /><p>Loading saved assessments…</p></div> : assessments.length === 0 ? <div className="library-empty"><Search size={24} /><h2>No saved assessments yet</h2><p>Start a mapping session from the Exams workspace and it will appear here.</p></div> : <div className="library-list">{assessments.map(item => <button key={item.id} onClick={() => onOpen(item.id)}><span className="grid h-10 w-10 place-items-center rounded-lg bg-[#FFF0EB] text-[#FF6E42]"><FileText size={18} /></span><span><strong>{item.title}</strong><small>{item.studentName || "Student answer sheet"} · {item.stage}</small></span><ArrowRight size={17} /></button>)}</div>}</section>;
}
