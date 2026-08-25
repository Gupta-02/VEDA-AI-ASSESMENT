import { z } from "zod";
import * as assessmentDb from "./db";
import { publicProcedure, router } from "./trpc";

const percentage = z.number().int().min(0).max(100);
const ownerKey = z.string().min(12).max(128);

const questionInput = z.object({
  id: z.string().min(1).max(24),
  questionNumber: z.string().min(1).max(64),
  sortOrder: z.number().int().min(0),
  text: z.string().min(1),
  marks: z.number().int().min(0).optional(),
  mappingStatus: z.enum(["mapped", "needs_review", "unanswered", "unmatched"]),
  extractedAnswer: z.string().optional(),
  confidence: percentage,
  suggestedScore: z.number().int().min(0).optional(),
  teacherScore: z.number().int().min(0).optional(),
  teacherFeedback: z.string().max(8000).optional(),
  reviewDecision: z.enum(["pending", "approved", "adjusted"]).optional(),
  answerPage: z.number().int().min(1).optional(),
});

const regionInput = z.object({
  id: z.string().min(1).max(24),
  questionId: z.string().min(1).max(24).optional(),
  pageNumber: z.number().int().min(1),
  topPercent: percentage,
  leftPercent: percentage,
  widthPercent: percentage.refine(value => value > 0),
  heightPercent: percentage.refine(value => value > 0),
  label: z.string().max(255).optional(),
  confidence: percentage,
});

export const createAssessmentInput = z.object({
  id: z.string().min(1).max(24),
  ownerKey,
  title: z.string().min(1).max(255),
  studentName: z.string().max(255).optional(),
  questionPaperName: z.string().max(512).optional(),
  answerSheetName: z.string().max(512).optional(),
  questions: z.array(questionInput).min(1),
  regions: z.array(regionInput),
});

export const appRouter = router({
  assessments: router({
    list: publicProcedure.input(z.object({ ownerKey })).query(({ input }) => {
      return assessmentDb.listAssessmentsForOwner(input.ownerKey);
    }),
    get: publicProcedure
      .input(z.object({ assessmentId: z.string().min(1).max(24), ownerKey }))
      .query(({ input }) => assessmentDb.getAssessmentForOwner(input.assessmentId, input.ownerKey)),
    create: publicProcedure
      .input(createAssessmentInput)
      .mutation(({ input }) => assessmentDb.createAssessment(input)),
    setFocus: publicProcedure
      .input(
        z.object({
          assessmentId: z.string().min(1).max(24),
          questionId: z.string().min(1).max(24),
          answerPage: z.number().int().min(1),
          ownerKey,
        }),
      )
      .mutation(({ input }) => assessmentDb.setAssessmentFocus(input)),
    saveReview: publicProcedure
      .input(
        z.object({
          eventId: z.string().min(1).max(24),
          assessmentId: z.string().min(1).max(24),
          questionId: z.string().min(1).max(24),
          ownerKey,
          decision: z.enum(["approved", "adjusted"]),
          score: z.number().int().min(0).optional(),
          note: z.string().max(8000).optional(),
        }),
      )
      .mutation(({ input }) => assessmentDb.saveQuestionReview(input)),
  }),
});

export type AppRouter = typeof appRouter;
