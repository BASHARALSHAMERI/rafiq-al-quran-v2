import {
  CommitteeRole,
  ExamQuestionSource,
  ExamStatus,
  ExamType,
  ExamPurpose,
  NominationRequestStatus
} from "@prisma/client";
import { z } from "zod";

const questionBankSourceSchema = z.nativeEnum(ExamQuestionSource);
const examTemplateTypeSchema = z.enum(["JUZ", "FULL_QURAN"]);
const scoreNumberSchema = z.coerce.number().min(0).max(1000);
const committeeRoleSchema = z.nativeEnum(CommitteeRole);

const examCriteriaBodySchema = z
  .object({
    memorizationScore: scoreNumberSchema,
    tajweedScore: scoreNumberSchema,
    theoreticalTajweedScore: scoreNumberSchema,
    performanceScore: scoreNumberSchema,
    promptingPenalty: scoreNumberSchema,
    remindingPenalty: scoreNumberSchema,
    tajweedPenalty: scoreNumberSchema,
    minQuestionCount: z.coerce.number().int().min(1).max(20),
    defaultQuestionCount: z.coerce.number().int().min(1).max(20),
    maxQuestionCount: z.coerce.number().int().min(1).max(20)
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.minQuestionCount > value.defaultQuestionCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "defaultQuestionCount must be greater than or equal to minQuestionCount",
        path: ["defaultQuestionCount"]
      });
    }

    if (value.defaultQuestionCount > value.maxQuestionCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "defaultQuestionCount must be less than or equal to maxQuestionCount",
        path: ["defaultQuestionCount"]
      });
    }
  });

const committeeMembersBodySchema = z
  .array(
    z
      .object({
        userId: z.coerce.number().int().positive(),
        committeeRole: committeeRoleSchema
      })
      .strict()
  )
  .min(1)
  .max(10)
  .superRefine((members, ctx) => {
    const chairCount = members.filter((member) => member.committeeRole === CommitteeRole.CHAIR).length;
    if (chairCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Committee must contain exactly one chair",
        path: ["committeeMembers"]
      });
    }
  });

export const examIdParamSchema = z
  .object({
    id: z.coerce.number().int().positive()
  })
  .strict();

export const attemptIdParamSchema = examIdParamSchema;
export const nominationIdParamSchema = examIdParamSchema;
export const questionBankIdParamSchema = examIdParamSchema;
export const attemptQuestionParamSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    questionId: z.coerce.number().int().positive()
  })
  .strict();

export const listExamsQuerySchema = z
  .object({
    centerId: z.coerce.number().int().positive().optional(),
    circleId: z.coerce.number().int().positive().optional(),
    purpose: z.nativeEnum(ExamPurpose).optional(),
    status: z.nativeEnum(ExamStatus).optional(),
    from: z.string().trim().min(1).optional(),
    to: z.string().trim().min(1).optional()
  })
  .strict();

export const listAttemptsQuerySchema = z
  .object({
    centerId: z.coerce.number().int().positive().optional(),
    circleId: z.coerce.number().int().positive().optional(),
    studentId: z.coerce.number().int().positive().optional(),
    purpose: z.nativeEnum(ExamPurpose).optional()
  })
  .strict();

export const listNominationRequestsQuerySchema = z
  .object({
    centerId: z.coerce.number().int().positive().optional(),
    circleId: z.coerce.number().int().positive().optional(),
    studentId: z.coerce.number().int().positive().optional(),
    status: z.nativeEnum(NominationRequestStatus).optional()
  })
  .strict();

export const listQuestionBankQuerySchema = z
  .object({
    fromSurah: z.coerce.number().int().min(1).max(114).optional(),
    toSurah: z.coerce.number().int().min(1).max(114).optional(),
    difficultyLevel: z.coerce.number().int().min(1).max(5).optional(),
    source: questionBankSourceSchema.optional(),
    search: z.string().trim().max(200).optional()
  })
  .strict()
  .refine(
    (value) =>
      value.fromSurah === undefined ||
      value.toSurah === undefined ||
      value.fromSurah <= value.toSurah,
    {
      message: "fromSurah must be less than or equal to toSurah",
      path: ["fromSurah"]
    }
  );

export const createExamBodySchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    type: examTemplateTypeSchema,
    examBranch: z.string().trim().max(120).nullable().optional(),
    purpose: z.nativeEnum(ExamPurpose).default(ExamPurpose.NORMAL),
    maxScore: z.coerce.number().positive().max(1000).default(100),
    passScore: z.coerce.number().nonnegative().max(1000),
    criteria: examCriteriaBodySchema.optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.passScore > value.maxScore) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "passScore cannot exceed maxScore",
        path: ["passScore"]
      });
    }

    const hasBranch = Boolean(value.examBranch?.trim());
    if (value.type === "JUZ" && !hasBranch) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "examBranch is required for JUZ",
        path: ["examBranch"]
      });
    }

    if (value.type === "FULL_QURAN" && hasBranch) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "examBranch must be empty for FULL_QURAN",
        path: ["examBranch"]
      });
    }
  });

export const updateExamBodySchema = z
  .object({
    title: z.string().trim().min(3).max(160).optional(),
    type: examTemplateTypeSchema.optional(),
    examBranch: z.string().trim().max(120).nullable().optional(),
    purpose: z.nativeEnum(ExamPurpose).optional(),
    maxScore: z.coerce.number().positive().max(1000).optional(),
    passScore: z.coerce.number().nonnegative().max(1000).optional(),
    criteria: examCriteriaBodySchema.optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const createNominationRequestBodySchema = z
  .object({
    examId: z.coerce.number().int().positive(),
    studentId: z.coerce.number().int().positive(),
    circleId: z.coerce.number().int().positive(),
    teacherNotes: z.string().trim().max(2000).optional(),
    readinessScore: z.coerce.number().int().min(0).max(100).optional(),
    proposedExamDate: z.string().trim().min(1).optional()
  })
  .strict();

export const createAttemptBodySchema = z
  .object({
    studentId: z.coerce.number().int().positive(),
    circleId: z.coerce.number().int().positive(),
    examDate: z.string().trim().min(1),
    fullQuranCompletedAt: z.string().trim().min(1).nullable().optional(),
    committeeMemberIds: z.array(z.coerce.number().int().positive()).min(1).max(10)
  })
  .strict();

export const supervisorReviewNominationBodySchema = z
  .object({
    decision: z.enum(["APPROVE", "RETURN", "REJECT", "DEFER"]),
    notes: z.string().trim().max(2000).optional()
  })
  .strict();

export const centerReviewNominationBodySchema = z
  .object({
    decision: z.enum(["REJECT"]),
    notes: z.string().trim().max(2000).optional()
  })
  .strict();

export const centerApproveNominationBodySchema = z
  .object({
    examDate: z.string().trim().min(1),
    fullQuranCompletedAt: z.string().trim().min(1).nullable().optional(),
    centerApprovalNotes: z.string().trim().max(2000).optional(),
    committeeMembers: committeeMembersBodySchema
  })
  .strict();

export const createQuestionBankItemBodySchema = z
  .object({
    fromSurah: z.coerce.number().int().min(1).max(114),
    fromAyah: z.coerce.number().int().positive(),
    toSurah: z.coerce.number().int().min(1).max(114),
    toAyah: z.coerce.number().int().positive(),
    pageNumber: z.coerce.number().int().min(1).max(604),
    lineCount: z.coerce.number().int().min(1).max(15),
    difficultyLevel: z.coerce.number().int().min(1).max(5),
    suggestedText: z.string().trim().max(4000).optional()
  })
  .strict()
  .refine(
    (value) =>
      value.fromSurah < value.toSurah ||
      (value.fromSurah === value.toSurah && value.fromAyah <= value.toAyah),
    {
      message: "Question range is invalid",
      path: ["fromSurah"]
    }
  );

export const updateQuestionBankItemBodySchema = createQuestionBankItemBodySchema;

export const generateQuestionBankBodySchema = z
  .object({
    fromSurah: z.coerce.number().int().min(1).max(114),
    toSurah: z.coerce.number().int().min(1).max(114),
    count: z.coerce.number().int().min(1).max(100).default(1),
    pageNumber: z.coerce.number().int().min(1).max(604).optional(),
    lineCount: z.coerce.number().int().min(1).max(15).optional(),
    difficultyLevel: z.coerce.number().int().min(1).max(5).optional(),
    suggestedTextPrefix: z.string().trim().max(200).optional()
  })
  .strict();

export const updateAttemptCommitteeBodySchema = z
  .object({
    examDate: z.string().trim().min(1).optional(),
    fullQuranCompletedAt: z.string().trim().min(1).nullable().optional(),
    committeeMembers: committeeMembersBodySchema.optional(),
    lockVersion: z.coerce.number().int().min(0).optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const generateAttemptQuestionsBodySchema = z
  .object({
    count: z.coerce.number().int().min(1).max(20).optional()
  })
  .strict();

export const createAttemptQuestionBodySchema = z
  .object({
    fromSurah: z.coerce.number().int().min(1).max(114),
    fromAyah: z.coerce.number().int().positive(),
    toSurah: z.coerce.number().int().min(1).max(114),
    toAyah: z.coerce.number().int().positive()
  })
  .strict()
  .refine(
    (value) =>
      value.fromSurah < value.toSurah ||
      (value.fromSurah === value.toSurah && value.fromAyah <= value.toAyah),
    {
      message: "Question range is invalid",
      path: ["fromSurah"]
    }
  );

export const evaluateAttemptBodySchema = z
  .object({
    memorizationScore: scoreNumberSchema.default(0),
    tajweedScore: scoreNumberSchema.default(0),
    theoreticalTajweedScore: scoreNumberSchema.default(0),
    performanceScore: scoreNumberSchema.default(0),
    committeeNotes: z.string().trim().max(2000).optional(),
    strengthNotes: z.string().trim().max(2000).optional(),
    weaknessNotes: z.string().trim().max(2000).optional(),
    questions: z
      .array(
        z
          .object({
            id: z.coerce.number().int().positive(),
            promptingDeductions: scoreNumberSchema.default(0),
            remindingDeductions: scoreNumberSchema.default(0),
            tajweedDeductions: scoreNumberSchema.default(0),
            isEvaluated: z.boolean().default(true)
          })
          .strict()
      )
      .min(1)
  })
  .strict();

export const scoreAttemptBodySchema = z
  .object({
    memorizationScore: scoreNumberSchema.default(0),
    tajweedScore: scoreNumberSchema.default(0),
    theoreticalTajweedScore: scoreNumberSchema.default(0),
    performanceScore: scoreNumberSchema.default(0),
    promptingDeductions: scoreNumberSchema.default(0),
    remindingDeductions: scoreNumberSchema.default(0),
    tajweedDeductions: scoreNumberSchema.default(0),
    committeeNotes: z.string().trim().max(2000).optional(),
    strengthNotes: z.string().trim().max(2000).optional(),
    weaknessNotes: z.string().trim().max(2000).optional(),
    questions: z
      .array(
        z
          .object({
            id: z.coerce.number().int().positive(),
            promptingDeductions: scoreNumberSchema.default(0),
            remindingDeductions: scoreNumberSchema.default(0),
            tajweedDeductions: scoreNumberSchema.default(0),
            isEvaluated: z.boolean().default(true)
          })
          .strict()
      )
      .optional()
  })
  .strict();

export const emptyBodySchema = z.object({}).strict();

export const reopenAttemptForQuestionAdjustmentBodySchema = z
  .object({
    reason: z.string().trim().min(5).max(500)
  })
  .strict();
