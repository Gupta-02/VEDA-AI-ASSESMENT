import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { answerRegions, assessmentQuestions, assessmentReviewEvents, assessmentSessions, type User } from "../drizzle/schema";

let database: ReturnType<typeof drizzle> | null = null;

/** Compatibility placeholders for unused optional identity code paths. */
export async function upsertUser(_user: unknown): Promise<void> {
  return undefined;
}

export async function getUserByOpenId(_openId: string): Promise<User | undefined> {
  return undefined;
}

export type PersistedQuestion = {
  id: string;
  questionNumber: string;
  sortOrder: number;
  text: string;
  marks?: number;
  mappingStatus: "mapped" | "needs_review" | "unanswered" | "unmatched";
  extractedAnswer?: string;
  confidence: number;
  suggestedScore?: number;
  teacherScore?: number;
  teacherFeedback?: string;
  reviewDecision?: "pending" | "approved" | "adjusted";
  answerPage?: number;
};

export type PersistedRegion = {
  id: string;
  questionId?: string;
  pageNumber: number;
  topPercent: number;
  leftPercent: number;
  widthPercent: number;
  heightPercent: number;
  label?: string;
  confidence: number;
};

export type CreateAssessmentInput = {
  id: string;
  ownerKey: string;
  title: string;
  studentName?: string;
  questionPaperName?: string;
  answerSheetName?: string;
  questions: PersistedQuestion[];
  regions: PersistedRegion[];
};

async function getDatabase() {
  if (!database && process.env.DATABASE_URL) {
    database = drizzle(process.env.DATABASE_URL);
  }

  if (!database) {
    throw new Error("DATABASE_URL is required to persist assessment records.");
  }

  return database;
}

export async function createAssessment(input: CreateAssessmentInput) {
  const db = await getDatabase();

  await db.transaction(async tx => {
    await tx.insert(assessmentSessions).values({
      id: input.id,
      ownerKey: input.ownerKey,
      userId: null,
      title: input.title,
      studentName: input.studentName ?? null,
      stage: "mapped",
      questionPaperName: input.questionPaperName ?? null,
      answerSheetName: input.answerSheetName ?? null,
      activeQuestionId: input.questions[0]?.id ?? null,
      activeAnswerPage: input.questions[0]?.answerPage ?? 1,
    });

    await tx.insert(assessmentQuestions).values(
      input.questions.map(question => ({
        ...question,
        assessmentId: input.id,
        marks: question.marks ?? null,
        extractedAnswer: question.extractedAnswer ?? null,
        suggestedScore: question.suggestedScore ?? null,
        teacherScore: question.teacherScore ?? null,
        teacherFeedback: question.teacherFeedback ?? null,
        reviewDecision: question.reviewDecision ?? "pending",
        answerPage: question.answerPage ?? null,
      })),
    );

    if (input.regions.length > 0) {
      await tx.insert(answerRegions).values(
        input.regions.map(region => ({
          ...region,
          assessmentId: input.id,
          questionId: region.questionId ?? null,
          label: region.label ?? null,
        })),
      );
    }
  });

  return getAssessmentForOwner(input.id, input.ownerKey);
}

export async function getAssessmentForOwner(assessmentId: string, ownerKey: string) {
  const db = await getDatabase();
  const session = (
    await db
      .select()
      .from(assessmentSessions)
      .where(and(eq(assessmentSessions.id, assessmentId), eq(assessmentSessions.ownerKey, ownerKey)))
      .limit(1)
  )[0];

  if (!session) return null;

  const [questions, regions, reviewEvents] = await Promise.all([
    db.select().from(assessmentQuestions).where(eq(assessmentQuestions.assessmentId, assessmentId)).orderBy(assessmentQuestions.sortOrder),
    db.select().from(answerRegions).where(eq(answerRegions.assessmentId, assessmentId)).orderBy(answerRegions.pageNumber),
    db.select().from(assessmentReviewEvents).where(eq(assessmentReviewEvents.assessmentId, assessmentId)).orderBy(desc(assessmentReviewEvents.createdAt)),
  ]);

  return { session, questions, regions, reviewEvents };
}

export async function listAssessmentsForOwner(ownerKey: string) {
  const db = await getDatabase();
  return db.select().from(assessmentSessions).where(eq(assessmentSessions.ownerKey, ownerKey)).orderBy(desc(assessmentSessions.updatedAt));
}

export async function setAssessmentFocus(input: { assessmentId: string; ownerKey: string; questionId: string; answerPage: number }) {
  const db = await getDatabase();
  await db
    .update(assessmentSessions)
    .set({ activeQuestionId: input.questionId, activeAnswerPage: input.answerPage, updatedAt: new Date() })
    .where(and(eq(assessmentSessions.id, input.assessmentId), eq(assessmentSessions.ownerKey, input.ownerKey)));
}

export async function saveQuestionReview(input: {
  eventId: string;
  assessmentId: string;
  questionId: string;
  ownerKey: string;
  decision: "approved" | "adjusted";
  score?: number;
  note?: string;
}) {
  const db = await getDatabase();

  await db.transaction(async tx => {
    const assessment = (
      await tx
        .select({ id: assessmentSessions.id })
        .from(assessmentSessions)
        .where(and(eq(assessmentSessions.id, input.assessmentId), eq(assessmentSessions.ownerKey, input.ownerKey)))
        .limit(1)
    )[0];

    if (!assessment) throw new Error("Assessment not found.");

    await tx.insert(assessmentReviewEvents).values({
      id: input.eventId,
      assessmentId: input.assessmentId,
      questionId: input.questionId,
      userId: null,
      decision: input.decision,
      score: input.score ?? null,
      note: input.note ?? null,
    });

    await tx
      .update(assessmentQuestions)
      .set({
        teacherScore: input.score ?? null,
        teacherFeedback: input.note ?? null,
        reviewDecision: input.decision,
        updatedAt: new Date(),
      })
      .where(and(eq(assessmentQuestions.id, input.questionId), eq(assessmentQuestions.assessmentId, input.assessmentId)));
  });

  return getAssessmentForOwner(input.assessmentId, input.ownerKey);
}
