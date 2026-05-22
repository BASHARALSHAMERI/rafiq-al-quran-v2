import YAML from "yaml";
import { env } from "../config/env";

type HttpVerb = "get" | "post" | "patch" | "delete";
type Operation = Record<string, unknown>;
type PathItem = Partial<Record<HttpVerb, Operation>>;

const errorSchemaRef = { $ref: "#/components/schemas/ErrorEnvelope" };

const ok = (description: string, schema: Record<string, unknown>) => ({
  description,
  content: {
    "application/json": {
      schema: {
        allOf: [
          { $ref: "#/components/schemas/SuccessEnvelope" },
          {
            type: "object",
            properties: {
              data: schema
            }
          }
        ]
      }
    }
  }
});

const err = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: errorSchemaRef
    }
  }
});

const secured = (tag: string, summary: string, extra?: Partial<Operation>): Operation => ({
  tags: [tag],
  summary,
  security: [{ BearerAuth: [] }],
  ...(extra ?? {})
});

const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "integer", minimum: 1 }
};

const authHeader = {
  name: "Authorization",
  in: "header",
  required: true,
  schema: { type: "string", example: "Bearer <jwt>" }
};

const paginationParams = [
  { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
  { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } }
];

const defaultSecuredResponses = {
  "401": err("Unauthorized"),
  "403": err("Forbidden"),
  "500": err("Internal server error")
};

const paths: Record<string, PathItem> = {
  "/health": {
    get: {
      tags: ["System"],
      summary: "Legacy health endpoint",
      security: [],
      responses: {
        "200": ok("Health payload", { $ref: "#/components/schemas/HealthData" })
      }
    }
  },
  "/ready": {
    get: {
      tags: ["System"],
      summary: "Legacy readiness endpoint",
      security: [],
      responses: {
        "200": ok("Readiness payload", { type: "object", additionalProperties: true }),
        "503": err("Service unavailable")
      }
    }
  },
  "/version": {
    get: {
      tags: ["System"],
      summary: "Legacy version endpoint",
      security: [],
      responses: {
        "200": ok("Version payload", { type: "object", additionalProperties: true })
      }
    }
  },
  "/system/health": {
    get: {
      tags: ["System"],
      summary: "System health",
      security: [],
      responses: {
        "200": ok("Health payload", { $ref: "#/components/schemas/HealthData" })
      }
    }
  },
  "/system/ready": {
    get: {
      tags: ["System"],
      summary: "System readiness",
      security: [],
      responses: {
        "200": ok("Readiness payload", { type: "object", additionalProperties: true }),
        "503": err("Service unavailable")
      }
    }
  },
  "/system/version": {
    get: {
      tags: ["System"],
      summary: "System version",
      security: [],
      responses: {
        "200": ok("Version payload", { type: "object", additionalProperties: true })
      }
    }
  },
  "/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" }
          }
        }
      },
      responses: {
        "200": ok("Session payload", { $ref: "#/components/schemas/AuthSessionResponse" }),
        "400": err("Invalid body"),
        "401": err("Invalid credentials"),
        "429": err("Rate limited")
      }
    }
  },
  "/auth/forgot-password": {
    post: {
      tags: ["Auth"],
      summary: "Request password reset",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ForgotPasswordRequest" }
          }
        }
      },
      responses: {
        "200": ok("Password reset request accepted", {
          $ref: "#/components/schemas/GenericMessageResponse"
        }),
        "400": err("Invalid body"),
        "429": err("Rate limited")
      }
    }
  },
  "/auth/reset-password": {
    post: {
      tags: ["Auth"],
      summary: "Reset password with token",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ResetPasswordRequest" }
          }
        }
      },
      responses: {
        "200": ok("Password reset result", { $ref: "#/components/schemas/GenericMessageResponse" }),
        "400": err("Invalid token or body"),
        "429": err("Rate limited")
      }
    }
  },
  "/auth/refresh": {
    post: {
      tags: ["Auth"],
      summary: "Refresh session",
      security: [],
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RefreshRequest" }
          }
        }
      },
      responses: {
        "200": ok("Session payload", { $ref: "#/components/schemas/AuthSessionResponse" }),
        "400": err("Invalid body"),
        "401": err("Invalid refresh token"),
        "429": err("Rate limited")
      }
    }
  },
  "/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "Logout",
      security: [],
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RefreshRequest" }
          }
        }
      },
      responses: {
        "200": ok("Logout payload", { type: "object", additionalProperties: true }),
        "400": err("Invalid body")
      }
    }
  },
  "/auth/me": {
    get: secured("Auth", "Current user", {
      parameters: [authHeader],
      responses: {
        "200": ok("User payload", { $ref: "#/components/schemas/UserProfile" }),
        "401": err("Unauthorized")
      }
    })
  },
  "/org/centers": {
    post: secured("Centers", "Create center", {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateCenterRequest" }
          }
        }
      },
      responses: {
        "201": ok("Created center", { $ref: "#/components/schemas/Center" }),
        "400": err("Invalid body"),
        "409": err("Center code conflict"),
        ...defaultSecuredResponses
      }
    }),
    get: secured("Centers", "List centers", {
      parameters: [authHeader, { name: "centerId", in: "query", schema: { type: "integer", minimum: 1 } }],
      responses: {
        "200": ok("Centers", { type: "array", items: { $ref: "#/components/schemas/Center" } }),
        ...defaultSecuredResponses
      }
    })
  },
  "/org/centers/{id}": {
    patch: secured("Centers", "Update center", {
      parameters: [authHeader, idParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateCenterRequest" }
          }
        }
      },
      responses: {
        "200": ok("Updated center", { $ref: "#/components/schemas/Center" }),
        "400": err("Invalid body"),
        "404": err("Center not found"),
        "409": err("Center code conflict"),
        ...defaultSecuredResponses
      }
    })
  },
  "/org/centers/{id}/status": {
    patch: secured("Centers", "Update center status", {
      parameters: [authHeader, idParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateStatusRequest" }
          }
        }
      },
      responses: {
        "200": ok("Updated center status", { $ref: "#/components/schemas/Center" }),
        "400": err("Invalid body"),
        "404": err("Center not found"),
        ...defaultSecuredResponses
      }
    })
  },
  "/org/circles": {
    post: secured("Halaqat", "Create circle", {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateCircleRequest" }
          }
        }
      },
      responses: {
        "201": ok("Created circle", { $ref: "#/components/schemas/Circle" }),
        "400": err("Invalid body"),
        "404": err("Center not found"),
        "409": err("Circle name conflict"),
        ...defaultSecuredResponses
      }
    }),
    get: secured("Halaqat", "List circles", {
      parameters: [
        authHeader,
        { name: "centerId", in: "query", schema: { type: "integer", minimum: 1 } },
        { name: "circleId", in: "query", schema: { type: "integer", minimum: 1 } }
      ],
      responses: {
        "200": ok("Circles", { type: "array", items: { $ref: "#/components/schemas/Circle" } }),
        ...defaultSecuredResponses
      }
    })
  },
  "/org/circles/{id}": {
    patch: secured("Halaqat", "Update circle", {
      parameters: [authHeader, idParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateCircleRequest" }
          }
        }
      },
      responses: {
        "200": ok("Updated circle", { $ref: "#/components/schemas/Circle" }),
        "400": err("Invalid body"),
        "404": err("Circle not found"),
        "409": err("Circle name conflict"),
        ...defaultSecuredResponses
      }
    })
  },
  "/org/circles/{id}/status": {
    patch: secured("Halaqat", "Update circle status", {
      parameters: [authHeader, idParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateStatusRequest" }
          }
        }
      },
      responses: {
        "200": ok("Updated circle status", { $ref: "#/components/schemas/Circle" }),
        "400": err("Invalid body"),
        "404": err("Circle not found"),
        ...defaultSecuredResponses
      }
    })
  },
  "/users": {
    post: secured("Users", "Create user", {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateUserRequest" }
          }
        }
      },
      responses: {
        "201": ok("Created user", { $ref: "#/components/schemas/UserProfileDetailed" }),
        "400": err("Invalid body"),
        "409": err("Email conflict"),
        ...defaultSecuredResponses
      }
    }),
    get: secured("Users", "List users", {
      parameters: [
        authHeader,
        { name: "role", in: "query", schema: { $ref: "#/components/schemas/Role" } },
        { name: "centerId", in: "query", schema: { type: "integer", minimum: 1 } },
        { name: "circleId", in: "query", schema: { type: "integer", minimum: 1 } }
      ],
      responses: {
        "200": ok("Users", { type: "array", items: { $ref: "#/components/schemas/UserProfile" } }),
        ...defaultSecuredResponses
      }
    })
  },
  "/users/{id}": {
    get: secured("Users", "Get user by id", {
      parameters: [authHeader, idParam],
      responses: {
        "200": ok("User", { $ref: "#/components/schemas/UserProfileDetailed" }),
        "404": err("Not found"),
        ...defaultSecuredResponses
      }
    }),
    patch: secured("Users", "Update user", {
      parameters: [authHeader, idParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateUserRequest" }
          }
        }
      },
      responses: {
        "200": ok("Updated user", { $ref: "#/components/schemas/UserProfileDetailed" }),
        "400": err("Invalid body"),
        "404": err("Not found"),
        "409": err("Email conflict"),
        ...defaultSecuredResponses
      }
    })
  },
  "/users/{id}/status": {
    patch: secured("Users", "Update user status", {
      parameters: [authHeader, idParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateStatusRequest" }
          }
        }
      },
      responses: {
        "200": ok("Updated user", { $ref: "#/components/schemas/UserProfileDetailed" }),
        "400": err("Invalid body"),
        "404": err("Not found"),
        "409": err("Status conflict"),
        ...defaultSecuredResponses
      }
    })
  },
  "/users/{id}/center-access": {
    post: secured("Users", "Add center access link", {
      parameters: [authHeader, idParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UserCenterAccessLinkRequest" }
          }
        }
      },
      responses: {
        "201": ok("Updated user", { $ref: "#/components/schemas/UserProfileDetailed" }),
        "400": err("Invalid body"),
        "404": err("Not found"),
        "409": err("Link exists"),
        ...defaultSecuredResponses
      }
    })
  },
  "/users/{id}/center-access/{centerId}": {
    delete: secured("Users", "Remove center access link", {
      parameters: [authHeader, idParam, { name: "centerId", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
      responses: {
        "200": ok("Updated user", { $ref: "#/components/schemas/UserProfileDetailed" }),
        "404": err("Not found"),
        ...defaultSecuredResponses
      }
    })
  },
  "/users/{id}/circle-access": {
    post: secured("Users", "Add circle access link", {
      parameters: [authHeader, idParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UserCircleAccessLinkRequest" }
          }
        }
      },
      responses: {
        "201": ok("Updated user", { $ref: "#/components/schemas/UserProfileDetailed" }),
        "400": err("Invalid body"),
        "404": err("Not found"),
        "409": err("Link exists"),
        ...defaultSecuredResponses
      }
    })
  },
  "/users/{id}/circle-access/{circleId}": {
    delete: secured("Users", "Remove circle access link", {
      parameters: [authHeader, idParam, { name: "circleId", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
      responses: {
        "200": ok("Updated user", { $ref: "#/components/schemas/UserProfileDetailed" }),
        "404": err("Not found"),
        ...defaultSecuredResponses
      }
    })
  },
  "/users/{id}/parent-links": {
    post: secured("Users", "Add parent-student link", {
      parameters: [authHeader, idParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ParentStudentLinkRequest" }
          }
        }
      },
      responses: {
        "201": ok("Updated user", { $ref: "#/components/schemas/UserProfileDetailed" }),
        "400": err("Invalid body"),
        "404": err("Not found"),
        "409": err("Link exists"),
        ...defaultSecuredResponses
      }
    })
  },
  "/users/{id}/parent-links/{studentId}": {
    delete: secured("Users", "Remove parent-student link", {
      parameters: [authHeader, idParam, { name: "studentId", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
      responses: {
        "200": ok("Updated user", { $ref: "#/components/schemas/UserProfileDetailed" }),
        "404": err("Not found"),
        ...defaultSecuredResponses
      }
    })
  },
  "/users/{id}/enrollments": {
    post: secured("Users", "Add student enrollment link", {
      parameters: [authHeader, idParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/StudentEnrollmentLinkRequest" }
          }
        }
      },
      responses: {
        "201": ok("Updated user", { $ref: "#/components/schemas/UserProfileDetailed" }),
        "400": err("Invalid body"),
        "404": err("Not found"),
        "409": err("Link exists"),
        ...defaultSecuredResponses
      }
    })
  },
  "/users/{id}/enrollments/{circleId}": {
    delete: secured("Users", "Remove student enrollment link", {
      parameters: [authHeader, idParam, { name: "circleId", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
      responses: {
        "200": ok("Updated user", { $ref: "#/components/schemas/UserProfileDetailed" }),
        "404": err("Not found"),
        ...defaultSecuredResponses
      }
    })
  },
  "/dashboard/metrics": {
    get: secured("Dashboard", "Dashboard metrics", {
      parameters: [authHeader],
      responses: { "200": ok("Metrics", { type: "object", additionalProperties: true }), ...defaultSecuredResponses }
    })
  },
  "/dashboard/activity-feed": {
    get: secured("Dashboard", "Dashboard activity feed", {
      parameters: [authHeader],
      responses: { "200": ok("Activity feed", { type: "array", items: { type: "object" } }), ...defaultSecuredResponses }
    })
  },
  "/dashboard/attendance-summary": {
    get: secured("Attendance", "Dashboard attendance summary", {
      parameters: [authHeader],
      responses: { "200": ok("Attendance summary", { type: "object", additionalProperties: true }), ...defaultSecuredResponses }
    })
  },
  "/attendance": {
    get: secured("Attendance", "List attendance for date", {
      parameters: [
        authHeader,
        { name: "circleId", in: "query", required: true, schema: { type: "integer", minimum: 1 } },
        { name: "date", in: "query", required: true, schema: { type: "string", format: "date" } }
      ],
      responses: {
        "200": ok("Attendance records", { type: "array", items: { type: "object", additionalProperties: true } }),
        "400": err("Invalid query"),
        ...defaultSecuredResponses
      }
    })
  },
  "/attendance/bulk": {
    post: secured("Attendance", "Submit bulk attendance", {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AttendanceBulkRequest" }
          }
        }
      },
      responses: {
        "201": ok("Attendance submission result", { type: "object", additionalProperties: true }),
        "409": err("LOCKED_RECORD or VERSION_CONFLICT"),
        ...defaultSecuredResponses
      }
    })
  },
  "/follow-ups": {
    get: secured("FollowUps", "List follow-up records", {
      parameters: [
        authHeader,
        { name: "centerId", in: "query", schema: { type: "integer", minimum: 1 } },
        { name: "circleId", in: "query", schema: { type: "integer", minimum: 1 } },
        { name: "studentId", in: "query", schema: { type: "integer", minimum: 1 } },
        { name: "from", in: "query", schema: { type: "string", format: "date" } },
        { name: "to", in: "query", schema: { type: "string", format: "date" } },
        { name: "status", in: "query", schema: { type: "string", enum: ["DRAFT", "FINAL"] } },
        ...paginationParams
      ],
      responses: {
        "200": ok("Follow-up list", { type: "object", additionalProperties: true }),
        "400": err("Invalid query"),
        ...defaultSecuredResponses
      }
    }),
    post: secured("FollowUps", "Create follow-up record", {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateFollowUpRequest" }
          }
        }
      },
      responses: {
        "201": ok("Created follow-up", { type: "object", additionalProperties: true }),
        "503": err("QURAN_METADATA_UNAVAILABLE"),
        ...defaultSecuredResponses
      }
    })
  },
  "/follow-ups/{id}": {
    patch: secured("FollowUps", "Update follow-up record", {
      parameters: [authHeader, idParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateFollowUpRequest" }
          }
        }
      },
      responses: {
        "200": ok("Updated follow-up", { type: "object", additionalProperties: true }),
        "409": err("LOCKED_RECORD or VERSION_CONFLICT"),
        "503": err("QURAN_METADATA_UNAVAILABLE"),
        ...defaultSecuredResponses
      }
    })
  },
  "/follow-ups/{id}/finalize": {
    patch: secured("FollowUps", "Finalize follow-up record", {
      parameters: [authHeader, idParam],
      responses: {
        "200": ok("Finalized follow-up", { type: "object", additionalProperties: true }),
        "409": err("LOCKED_RECORD or VERSION_CONFLICT"),
        ...defaultSecuredResponses
      }
    })
  },
  "/quran/range/calculate": {
    post: secured("Quran", "Calculate Quran range metadata", {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/QuranRangeRequest" }
          }
        }
      },
      responses: {
        "200": ok("Calculated range", { $ref: "#/components/schemas/QuranRangeResponse" }),
        "422": err("VALIDATION_FAILED"),
        "503": err("QURAN_METADATA_UNAVAILABLE"),
        ...defaultSecuredResponses
      }
    })
  },
  "/corrections": {
    get: secured("Corrections", "List correction requests", {
      parameters: [
        authHeader,
        { name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED", "APPLIED", "CANCELLED"] } },
        { name: "targetType", in: "query", schema: { type: "string", enum: ["ATTENDANCE", "FOLLOW_UP", "EXAM_ATTEMPT"] } },
        { name: "centerId", in: "query", schema: { type: "integer", minimum: 1 } },
        { name: "circleId", in: "query", schema: { type: "integer", minimum: 1 } },
        ...paginationParams
      ],
      responses: {
        "200": ok("Corrections list", { type: "object", additionalProperties: true }),
        ...defaultSecuredResponses
      }
    }),
    post: secured("Corrections", "Create correction request", {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateCorrectionRequest" }
          }
        }
      },
      responses: {
        "201": ok("Created correction request", { type: "object", additionalProperties: true }),
        "422": err("VALIDATION_FAILED"),
        ...defaultSecuredResponses
      }
    })
  },
  "/corrections/{id}/approve": {
    post: secured("Corrections", "Approve correction request", {
      parameters: [authHeader, idParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApproveCorrectionRequest" }
          }
        }
      },
      responses: {
        "200": ok("Updated correction request", { type: "object", additionalProperties: true }),
        "409": err("VERSION_CONFLICT"),
        ...defaultSecuredResponses
      }
    })
  },
  "/corrections/{id}/reject": {
    post: secured("Corrections", "Reject correction request", {
      parameters: [authHeader, idParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RejectCorrectionRequest" }
          }
        }
      },
      responses: {
        "200": ok("Updated correction request", { type: "object", additionalProperties: true }),
        ...defaultSecuredResponses
      }
    })
  },
  "/exams": {
    get: secured("Exams", "List exams", {
      parameters: [authHeader],
      responses: { "200": ok("Exams", { type: "array", items: { type: "object" } }), ...defaultSecuredResponses }
    }),
    post: secured("Exams", "Create exam", {
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateExamRequest" } } } },
      responses: { "201": ok("Created exam", { type: "object", additionalProperties: true }), "400": err("Invalid body"), ...defaultSecuredResponses }
    })
  },
  "/exams/{id}": {
    patch: secured("Exams", "Update exam", {
      parameters: [authHeader, idParam],
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateExamRequest" } } } },
      responses: { "200": ok("Updated exam", { type: "object", additionalProperties: true }), "400": err("Invalid body"), "404": err("Not found"), ...defaultSecuredResponses }
    })
  },
  "/exams/{id}/publish": {
    post: secured("Exams", "Publish exam", {
      parameters: [authHeader, idParam],
      responses: { "200": ok("Published exam", { type: "object", additionalProperties: true }), "400": err("Invalid transition"), "404": err("Not found"), ...defaultSecuredResponses }
    })
  },
  "/exams/{id}/attempts": {
    get: secured("Exams", "List exam attempts", {
      parameters: [authHeader, idParam],
      responses: { "200": ok("Attempts", { type: "array", items: { type: "object" } }), "404": err("Not found"), ...defaultSecuredResponses }
    }),
    post: secured("Exams", "Create exam attempt", {
      parameters: [authHeader, idParam],
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateExamAttemptRequest" } } } },
      responses: { "201": ok("Created attempt", { type: "object", additionalProperties: true }), "400": err("Invalid body"), "404": err("Not found"), "409": err("Conflict"), ...defaultSecuredResponses }
    })
  },
  "/attempts/{id}/score": {
    post: secured("Exams", "Score attempt", {
      parameters: [authHeader, idParam],
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ScoreAttemptRequest" } } } },
      responses: { "200": ok("Scored attempt", { type: "object", additionalProperties: true }), "400": err("Invalid body"), "404": err("Not found"), ...defaultSecuredResponses }
    })
  },
  "/attempts/{id}/committee": {
    patch: secured("Exams", "Update attempt committee notes", {
      parameters: [authHeader, idParam],
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateAttemptCommitteeRequest" } } } },
      responses: {
        "200": ok("Updated attempt", { type: "object", additionalProperties: true }),
        "409": err("LOCKED_RECORD or VERSION_CONFLICT"),
        ...defaultSecuredResponses
      }
    })
  },
  "/question-bank": {
    get: secured("Exams", "List question bank items", {
      parameters: [authHeader],
      responses: {
        "200": ok("Question bank items", { type: "array", items: { type: "object", additionalProperties: true } }),
        ...defaultSecuredResponses
      }
    }),
    post: secured("Exams", "Create question bank item", {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateQuestionBankItemRequest" }
          }
        }
      },
      responses: {
        "201": ok("Created question bank item", { type: "object", additionalProperties: true }),
        "503": err("QURAN_METADATA_UNAVAILABLE"),
        ...defaultSecuredResponses
      }
    })
  },
  "/question-bank/generate": {
    post: secured("Exams", "Generate question bank items", {
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/GenerateQuestionBankRequest" }
          }
        }
      },
      responses: {
        "201": ok("Generated question bank items", { type: "array", items: { type: "object", additionalProperties: true } }),
        "503": err("QURAN_METADATA_UNAVAILABLE"),
        ...defaultSecuredResponses
      }
    })
  },
  "/question-bank/{id}": {
    delete: secured("Exams", "Delete question bank item", {
      parameters: [authHeader, idParam],
      responses: {
        "200": ok("Deleted question bank item", { type: "object", additionalProperties: true }),
        ...defaultSecuredResponses
      }
    })
  },
  "/library/categories": {
    get: secured("Library", "List categories", {
      parameters: [authHeader],
      responses: { "200": ok("Categories", { type: "array", items: { type: "object" } }), ...defaultSecuredResponses }
    }),
    post: secured("Library", "Create category", {
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateLibraryCategoryRequest" } } } },
      responses: { "201": ok("Created category", { type: "object", additionalProperties: true }), "400": err("Invalid body"), "409": err("Conflict"), ...defaultSecuredResponses }
    })
  },
  "/library/items": {
    get: secured("Library", "List items", {
      parameters: [authHeader, ...paginationParams],
      responses: {
        "200": ok("Paginated library items", {
          type: "object",
          properties: {
            data: { type: "array", items: { type: "object" } },
            page: { type: "integer" },
            pageSize: { type: "integer" },
            total: { type: "integer" }
          }
        }),
        ...defaultSecuredResponses
      }
    }),
    post: secured("Library", "Upload library item", {
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                visibility: { $ref: "#/components/schemas/LibraryVisibility" },
                file: { type: "string", format: "binary" }
              }
            }
          }
        }
      },
      responses: { "201": ok("Created item", { type: "object", additionalProperties: true }), "400": err("Invalid body"), "413": err("Payload too large"), ...defaultSecuredResponses }
    })
  },
  "/library/items/{id}/download": {
    get: secured("Library", "Download library item", {
      parameters: [authHeader, idParam],
      responses: {
        "200": {
          description: "Binary stream",
          content: { "application/octet-stream": { schema: { type: "string", format: "binary" } } }
        },
        "404": err("Not found"),
        ...defaultSecuredResponses
      }
    })
  },
  "/library/items/{id}": {
    patch: secured("Library", "Update item", {
      parameters: [authHeader, idParam],
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateLibraryItemRequest" } } } },
      responses: { "200": ok("Updated item", { type: "object", additionalProperties: true }), "400": err("Invalid body"), "404": err("Not found"), ...defaultSecuredResponses }
    }),
    delete: secured("Library", "Archive item", {
      parameters: [authHeader, idParam],
      responses: { "200": ok("Archived item", { type: "object", additionalProperties: true }), "404": err("Not found"), ...defaultSecuredResponses }
    })
  },
  "/finance/plans": {
    get: secured("Finance", "List plans", {
      parameters: [authHeader],
      responses: { "200": ok("Plans", { type: "array", items: { type: "object" } }), ...defaultSecuredResponses }
    }),
    post: secured("Finance", "Create plan", {
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreatePlanRequest" } } } },
      responses: { "201": ok("Created plan", { type: "object", additionalProperties: true }), "400": err("Invalid body"), ...defaultSecuredResponses }
    })
  },
  "/finance/plans/{id}": {
    patch: secured("Finance", "Update plan", {
      parameters: [authHeader, idParam],
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdatePlanRequest" } } } },
      responses: { "200": ok("Updated plan", { type: "object", additionalProperties: true }), "400": err("Invalid body"), "404": err("Not found"), ...defaultSecuredResponses }
    })
  },
  "/finance/invoices": {
    get: secured("Finance", "List invoices", {
      parameters: [authHeader],
      responses: { "200": ok("Invoices", { type: "array", items: { type: "object" } }), ...defaultSecuredResponses }
    }),
    post: secured("Finance", "Create invoice", {
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateInvoiceRequest" } } } },
      responses: { "201": ok("Created invoice", { type: "object", additionalProperties: true }), "400": err("Invalid body"), "409": err("Conflict"), ...defaultSecuredResponses }
    })
  },
  "/finance/invoices/{id}": {
    get: secured("Finance", "Get invoice", {
      parameters: [authHeader, idParam],
      responses: { "200": ok("Invoice", { type: "object", additionalProperties: true }), "404": err("Not found"), ...defaultSecuredResponses }
    })
  },
  "/finance/invoices/{id}/payments": {
    get: secured("Finance", "List invoice payments", {
      parameters: [authHeader, idParam],
      responses: { "200": ok("Payments", { type: "array", items: { type: "object" } }), "404": err("Not found"), ...defaultSecuredResponses }
    })
  },
  "/finance/payments": {
    post: secured("Finance", "Create payment", {
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreatePaymentRequest" } } } },
      responses: { "201": ok("Created payment", { type: "object", additionalProperties: true }), "400": err("Invalid body"), "404": err("Not found"), ...defaultSecuredResponses }
    })
  },
  "/reports/catalog": {
    get: secured("Reports", "Reports catalog", {
      parameters: [authHeader],
      responses: { "200": ok("Catalog", { type: "array", items: { type: "object" } }), ...defaultSecuredResponses }
    })
  },
  "/reports/attendance": {
    get: secured("Reports", "Attendance report", {
      parameters: [authHeader],
      responses: { "200": ok("Attendance report", { type: "object", additionalProperties: true }), "400": err("Invalid query"), ...defaultSecuredResponses }
    })
  },
  "/reports/follow-up": {
    get: secured("Reports", "Follow-up report", {
      parameters: [authHeader],
      responses: { "200": ok("Follow-up report", { type: "object", additionalProperties: true }), "400": err("Invalid query"), ...defaultSecuredResponses }
    })
  },
  "/reports/exams": {
    get: secured("Reports", "Exams report", {
      parameters: [authHeader],
      responses: { "200": ok("Exams report", { type: "object", additionalProperties: true }), "400": err("Invalid query"), ...defaultSecuredResponses }
    })
  },
  "/reports/finance": {
    get: secured("Reports", "Finance report", {
      parameters: [authHeader],
      responses: { "200": ok("Finance report", { type: "object", additionalProperties: true }), "400": err("Invalid query"), ...defaultSecuredResponses }
    })
  },
  "/reports/student/{id}": {
    get: secured("Reports", "Student consolidated report", {
      parameters: [authHeader, idParam],
      responses: {
        "200": ok("Student report", { type: "object", additionalProperties: true }),
        "404": err("Student not found"),
        ...defaultSecuredResponses
      }
    })
  },
  "/reports/export": {
    post: secured("Reports", "Export report", {
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ExportReportRequest" } } } },
      responses: { "201": ok("Export result", { type: "object", additionalProperties: true }), "400": err("Invalid body"), ...defaultSecuredResponses }
    })
  },
  "/reports/exports/{id}/download": {
    get: secured("Reports", "Download exported report", {
      parameters: [authHeader, idParam],
      responses: {
        "200": {
          description: "Binary stream",
          content: { "application/octet-stream": { schema: { type: "string", format: "binary" } } }
        },
        "404": err("Not found"),
        "413": err("Payload too large"),
        ...defaultSecuredResponses
      }
    })
  },
  "/notifications": {
    get: secured("Notifications", "List notifications", {
      parameters: [authHeader, ...paginationParams],
      responses: {
        "200": ok("Paginated notifications", {
          type: "object",
          properties: {
            rows: { type: "array", items: { type: "object" } },
            total: { type: "integer" },
            page: { type: "integer" },
            pageSize: { type: "integer" }
          }
        }),
        "400": err("Invalid query"),
        ...defaultSecuredResponses
      }
    })
  },
  "/notifications/unread-count": {
    get: secured("Notifications", "Unread count", {
      parameters: [authHeader],
      responses: { "200": ok("Unread count", { type: "object", additionalProperties: true }), ...defaultSecuredResponses }
    })
  },
  "/notifications/{id}/read": {
    patch: secured("Notifications", "Mark notification as read", {
      parameters: [authHeader, idParam],
      responses: { "200": ok("Notification", { type: "object", additionalProperties: true }), "404": err("Not found"), ...defaultSecuredResponses }
    })
  },
  "/notifications/read-all": {
    patch: secured("Notifications", "Mark all notifications as read", {
      parameters: [authHeader],
      responses: { "200": ok("Batch result", { type: "object", additionalProperties: true }), ...defaultSecuredResponses }
    })
  },
  "/audit": {
    get: secured("Audit", "List audit logs", {
      parameters: [authHeader, ...paginationParams],
      responses: {
        "200": ok("Paginated audit logs", {
          type: "object",
          properties: {
            rows: { type: "array", items: { type: "object" } },
            total: { type: "integer" },
            page: { type: "integer" },
            pageSize: { type: "integer" }
          }
        }),
        "400": err("Invalid query"),
        ...defaultSecuredResponses
      }
    })
  },
  "/audit/catalog": {
    get: secured("Audit", "Audit catalog", {
      parameters: [authHeader],
      responses: { "200": ok("Catalog", { type: "object", additionalProperties: true }), ...defaultSecuredResponses }
    })
  },
  "/openapi.json": {
    get: {
      tags: ["Docs"],
      summary: "OpenAPI JSON",
      security: [],
      responses: {
        "200": {
          description: "OpenAPI JSON",
          content: { "application/json": { schema: { type: "object", additionalProperties: true } } }
        },
        "404": err("Docs disabled")
      }
    }
  },
  "/openapi.yaml": {
    get: {
      tags: ["Docs"],
      summary: "OpenAPI YAML",
      security: [],
      responses: {
        "200": {
          description: "OpenAPI YAML",
          content: { "application/yaml": { schema: { type: "string" } } }
        },
        "404": err("Docs disabled")
      }
    }
  },
  "/docs": {
    get: {
      tags: ["Docs"],
      summary: "Swagger UI",
      security: [],
      responses: {
        "200": {
          description: "Swagger UI HTML",
          content: { "text/html": { schema: { type: "string" } } }
        },
        "404": err("Docs disabled")
      }
    }
  }
};

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Rafiq Al-Quran API",
    version: "2.19.0",
    description: "Release baseline API contract for current backend endpoints."
  },
  servers: [
    { url: env.PUBLIC_BASE_URL ?? `http://localhost:${env.PORT}`, description: "Current runtime" },
    { url: "http://localhost:4000", description: "Development" },
    { url: "https://staging.api.rafiq.example", description: "Staging" },
    { url: "https://api.rafiq.example", description: "Production" }
  ],
  tags: [
    { name: "Auth" },
    { name: "Users" },
    { name: "Centers" },
    { name: "Halaqat" },
    { name: "Dashboard" },
    { name: "Attendance" },
    { name: "FollowUps" },
    { name: "Exams" },
    { name: "Quran" },
    { name: "Corrections" },
    { name: "Library" },
    { name: "Finance" },
    { name: "Reports" },
    { name: "Notifications" },
    { name: "Audit" },
    { name: "System" },
    { name: "Docs" }
  ],
  security: [{ BearerAuth: [] }],
  paths,
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      SuccessEnvelope: {
        type: "object",
        properties: {
          ok: { type: "boolean", enum: [true] },
          data: { type: "object", additionalProperties: true }
        },
        required: ["ok"]
      },
      ErrorEnvelope: {
        type: "object",
        properties: {
          ok: { type: "boolean", enum: [false] },
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              requestId: { type: "string" },
              details: {}
            },
            required: ["code", "message", "requestId"]
          },
          message: { type: "string" },
          details: {}
        },
        required: ["ok", "error"]
      },
      HealthData: {
        type: "object",
        properties: {
          service: { type: "string" },
          version: { type: "string" },
          uptimeMs: { type: "integer" },
          uptimeSec: { type: "integer" },
          now: { type: "string", format: "date-time" }
        }
      },
      Role: {
        type: "string",
        enum: ["SUPER_ADMIN", "CENTER_ADMIN", "SUPERVISOR", "TEACHER", "PARENT", "STUDENT"]
      },
      Center: {
        type: "object",
        properties: {
          id: { type: "integer" },
          organizationId: { type: "integer", nullable: true },
          name: { type: "string" },
          code: { type: "string", nullable: true },
          timezone: { type: "string", example: "Asia/Riyadh" },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time", nullable: true }
        }
      },
      Circle: {
        type: "object",
        properties: {
          id: { type: "integer" },
          centerId: { type: "integer" },
          teacherId: { type: "integer", nullable: true },
          name: { type: "string" },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time", nullable: true },
          weeklySchedule: {
            type: "array",
            items: { $ref: "#/components/schemas/CircleScheduleRow" }
          }
        }
      },
      Weekday: {
        type: "string",
        enum: ["FRIDAY", "SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"]
      },
      CircleScheduleMode: {
        type: "string",
        enum: ["CLOCK", "PRAYER"]
      },
      PrayerName: {
        type: "string",
        enum: ["FAJR", "DHUHR", "ASR", "MAGHRIB", "ISHA"]
      },
      CircleScheduleRowClock: {
        type: "object",
        required: ["day", "mode", "fromTime", "toTime"],
        properties: {
          day: { $ref: "#/components/schemas/Weekday" },
          mode: { type: "string", enum: ["CLOCK"] },
          fromTime: { type: "string", pattern: "^([01]\\\\d|2[0-3]):[0-5]\\\\d$" },
          toTime: { type: "string", pattern: "^([01]\\\\d|2[0-3]):[0-5]\\\\d$" }
        }
      },
      CircleScheduleRowPrayer: {
        type: "object",
        required: ["day", "mode", "fromPrayer", "toPrayer"],
        properties: {
          day: { $ref: "#/components/schemas/Weekday" },
          mode: { type: "string", enum: ["PRAYER"] },
          fromPrayer: { $ref: "#/components/schemas/PrayerName" },
          toPrayer: { $ref: "#/components/schemas/PrayerName" }
        }
      },
      CircleScheduleRow: {
        oneOf: [
          { $ref: "#/components/schemas/CircleScheduleRowClock" },
          { $ref: "#/components/schemas/CircleScheduleRowPrayer" }
        ]
      },
      UserProfile: {
        type: "object",
        properties: {
          id: { type: "integer" },
          fullName: { type: "string" },
          email: { type: "string" },
          role: { $ref: "#/components/schemas/Role" }
        }
      },
      UserProfileDetailed: {
        allOf: [
          { $ref: "#/components/schemas/UserProfile" },
          {
            type: "object",
            properties: {
              isActive: { type: "boolean" },
              createdAt: { type: "string", format: "date-time", nullable: true },
              updatedAt: { type: "string", format: "date-time", nullable: true },
              centerAccesses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    centerId: { type: "integer" }
                  }
                }
              },
              circleAccesses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    circleId: { type: "integer" }
                  }
                }
              },
              studentEnrollments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    circleId: { type: "integer" }
                  }
                }
              },
              parentLinks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    studentId: { type: "integer" },
                    relationType: { type: "string" }
                  }
                }
              }
            }
          }
        ]
      },
      LoginRequest: {
        type: "object",
        required: ["identifier", "password"],
        properties: {
          identifier: {
            type: "string",
            description: "Email or phone number."
          },
          email: {
            type: "string",
            description: "Deprecated: legacy alias for identifier.",
            deprecated: true
          },
          password: { type: "string", minLength: 8 }
        }
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["identifier"],
        properties: {
          identifier: {
            type: "string",
            description: "Email or phone number."
          }
        }
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["token", "newPassword"],
        properties: {
          token: { type: "string", minLength: 20, maxLength: 4000 },
          newPassword: { type: "string", minLength: 8, maxLength: 128 }
        }
      },
      GenericMessageResponse: {
        type: "object",
        properties: {
          message: { type: "string" }
        }
      },
      RefreshRequest: {
        type: "object",
        properties: {
          refreshToken: { type: "string" }
        }
      },
      AuthSessionResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          accessExpiresIn: { type: "string" },
          refreshToken: { type: "string" },
          user: { $ref: "#/components/schemas/UserProfile" }
        }
      },
      CreateUserRequest: {
        type: "object",
        required: ["fullName", "email", "role", "password"],
        properties: {
          fullName: { type: "string", minLength: 1, maxLength: 120 },
          email: { type: "string", format: "email" },
          role: { $ref: "#/components/schemas/Role" },
          password: { type: "string", minLength: 8, maxLength: 128 },
          isActive: { type: "boolean" }
        }
      },
      UpdateUserRequest: {
        type: "object",
        properties: {
          fullName: { type: "string", minLength: 1, maxLength: 120 },
          email: { type: "string", format: "email" }
        }
      },
      UserCenterAccessLinkRequest: {
        type: "object",
        required: ["centerId"],
        properties: {
          centerId: { type: "integer", minimum: 1 }
        }
      },
      UserCircleAccessLinkRequest: {
        type: "object",
        required: ["circleId"],
        properties: {
          circleId: { type: "integer", minimum: 1 }
        }
      },
      ParentStudentLinkRequest: {
        type: "object",
        required: ["studentId"],
        properties: {
          studentId: { type: "integer", minimum: 1 },
          relationType: {
            type: "string",
            enum: ["FATHER", "MOTHER", "GUARDIAN"]
          }
        }
      },
      StudentEnrollmentLinkRequest: {
        type: "object",
        required: ["circleId"],
        properties: {
          circleId: { type: "integer", minimum: 1 },
          startDate: { type: "string", format: "date-time" }
        }
      },
      CreateCenterRequest: {
        type: "object",
        required: ["nameAr", "gender", "centerAdminUserId"],
        properties: {
          nameAr: { type: "string", minLength: 1, maxLength: 120 },
          name: { type: "string", minLength: 1, maxLength: 120 },
          nameEn: { type: "string", maxLength: 120 },
          gender: { type: "string", enum: ["MALE", "FEMALE"] },
          logoUrl: { type: "string", maxLength: 500, nullable: true },
          locationText: { type: "string", maxLength: 255 },
          timezone: { type: "string", minLength: 1, maxLength: 64, example: "Asia/Riyadh" },
          centerAdminUserId: { type: "integer", minimum: 1 },
          supervisorUserIds: { type: "array", items: { type: "integer", minimum: 1 }, maxItems: 50 }
        }
      },
      UpdateCenterRequest: {
        type: "object",
        properties: {
          nameAr: { type: "string", minLength: 1, maxLength: 120 },
          name: { type: "string", minLength: 1, maxLength: 120 },
          nameEn: { type: "string", maxLength: 120 },
          gender: { type: "string", enum: ["MALE", "FEMALE"] },
          logoUrl: { type: "string", maxLength: 500, nullable: true },
          locationText: { type: "string", maxLength: 255 },
          timezone: { type: "string", minLength: 1, maxLength: 64, example: "Asia/Riyadh" },
          centerAdminUserId: { type: "integer", minimum: 1 },
          supervisorUserIds: { type: "array", items: { type: "integer", minimum: 1 }, maxItems: 50 }
        }
      },
      CreateCircleRequest: {
        type: "object",
        required: ["centerId", "nameAr", "circleType", "primaryTeacherUserId"],
        properties: {
          centerId: { type: "integer", minimum: 1 },
          nameAr: { type: "string", minLength: 1, maxLength: 120 },
          name: { type: "string", minLength: 1, maxLength: 120 },
          nameEn: { type: "string", maxLength: 120 },
          circleType: { type: "string", enum: ["HIFZ", "REVIEW", "HIFZ_REVIEW"] },
          primaryTeacherUserId: { type: "integer", minimum: 1 },
          teacherId: { type: "integer", minimum: 1 },
          locationText: { type: "string", maxLength: 255 },
          weeklySchedule: {
            type: "array",
            maxItems: 7,
            items: { $ref: "#/components/schemas/CircleScheduleRow" }
          }
        }
      },
      UpdateCircleRequest: {
        type: "object",
        properties: {
          nameAr: { type: "string", minLength: 1, maxLength: 120 },
          name: { type: "string", minLength: 1, maxLength: 120 },
          nameEn: { type: "string", maxLength: 120 },
          circleType: { type: "string", enum: ["HIFZ", "REVIEW", "HIFZ_REVIEW"] },
          primaryTeacherUserId: { type: "integer", minimum: 1 },
          teacherId: { type: "integer", minimum: 1 },
          locationText: { type: "string", maxLength: 255 },
          weeklySchedule: {
            type: "array",
            maxItems: 7,
            items: { $ref: "#/components/schemas/CircleScheduleRow" }
          }
        }
      },
      UpdateStatusRequest: {
        type: "object",
        required: ["isActive"],
        properties: {
          isActive: { type: "boolean" }
        }
      },
      CreateExamRequest: { type: "object", additionalProperties: true },
      UpdateExamRequest: { type: "object", additionalProperties: true },
      CreateExamAttemptRequest: { type: "object", additionalProperties: true },
      ScoreAttemptRequest: { type: "object", additionalProperties: true },
      UpdateAttemptCommitteeRequest: {
        type: "object",
        properties: {
          committeeNotes: { type: "string", maxLength: 2000, nullable: true },
          lockVersion: { type: "integer", minimum: 0 }
        }
      },
      CreateQuestionBankItemRequest: {
        type: "object",
        required: [
          "fromSurah",
          "fromAyah",
          "toSurah",
          "toAyah",
          "pageNumber",
          "lineCount",
          "difficultyLevel"
        ],
        properties: {
          fromSurah: { type: "integer", minimum: 1, maximum: 114 },
          fromAyah: { type: "integer", minimum: 1 },
          toSurah: { type: "integer", minimum: 1, maximum: 114 },
          toAyah: { type: "integer", minimum: 1 },
          pageNumber: { type: "integer", minimum: 1, maximum: 604 },
          lineCount: { type: "integer", minimum: 1, maximum: 15 },
          difficultyLevel: { type: "integer", minimum: 1, maximum: 5 },
          suggestedText: { type: "string", maxLength: 4000 }
        }
      },
      GenerateQuestionBankRequest: {
        type: "object",
        required: ["fromSurah", "toSurah"],
        properties: {
          fromSurah: { type: "integer", minimum: 1, maximum: 114 },
          toSurah: { type: "integer", minimum: 1, maximum: 114 },
          count: { type: "integer", minimum: 1, maximum: 100, default: 1 },
          pageNumber: { type: "integer", minimum: 1, maximum: 604 },
          lineCount: { type: "integer", minimum: 1, maximum: 15 },
          difficultyLevel: { type: "integer", minimum: 1, maximum: 5 },
          suggestedTextPrefix: { type: "string", maxLength: 200 }
        }
      },
      AttendanceBulkRequest: {
        type: "object",
        required: ["circleId", "date", "records"],
        properties: {
          circleId: { type: "integer", minimum: 1 },
          date: { type: "string", format: "date" },
          records: {
            type: "array",
            minItems: 1,
            maxItems: 500,
            items: {
              type: "object",
              required: ["studentId", "status"],
              properties: {
                studentId: { type: "integer", minimum: 1 },
                status: { type: "string", enum: ["PRESENT", "ABSENT", "LATE", "EXCUSED"] },
                note: { type: "string", maxLength: 500, nullable: true },
                lockVersion: { type: "integer", minimum: 0 }
              }
            }
          }
        }
      },
      CreateFollowUpRequest: {
        type: "object",
        required: ["studentId", "circleId", "recordDate", "type"],
        properties: {
          studentId: { type: "integer", minimum: 1 },
          circleId: { type: "integer", minimum: 1 },
          recordDate: { type: "string", format: "date" },
          type: { type: "string", enum: ["NEW_MEMORIZATION", "REVIEW", "MATN"] },
          status: { type: "string", enum: ["DRAFT", "FINAL"] },
          surah: { type: "string", maxLength: 120, nullable: true },
          fromSurah: { type: "integer", minimum: 1, maximum: 114, nullable: true },
          fromAyah: { type: "integer", minimum: 1, nullable: true },
          toSurah: { type: "integer", minimum: 1, maximum: 114, nullable: true },
          toAyah: { type: "integer", minimum: 1, nullable: true },
          pagesCount: { type: "number", nullable: true, description: "Ignored by server" },
          rating: { type: "integer", minimum: 1, maximum: 100, nullable: true },
          matnId: { type: "integer", minimum: 1, nullable: true },
          matnName: { type: "string", maxLength: 120, nullable: true },
          matnStatus: { type: "string", maxLength: 50, nullable: true },
          notes: { type: "string", maxLength: 500, nullable: true }
        }
      },
      UpdateFollowUpRequest: {
        type: "object",
        properties: {
          recordDate: { type: "string", format: "date" },
          type: { type: "string", enum: ["NEW_MEMORIZATION", "REVIEW", "MATN"] },
          surah: { type: "string", maxLength: 120, nullable: true },
          fromSurah: { type: "integer", minimum: 1, maximum: 114, nullable: true },
          fromAyah: { type: "integer", minimum: 1, nullable: true },
          toSurah: { type: "integer", minimum: 1, maximum: 114, nullable: true },
          toAyah: { type: "integer", minimum: 1, nullable: true },
          pagesCount: { type: "number", nullable: true, description: "Ignored by server" },
          rating: { type: "integer", minimum: 1, maximum: 100, nullable: true },
          matnId: { type: "integer", minimum: 1, nullable: true },
          matnName: { type: "string", maxLength: 120, nullable: true },
          matnStatus: { type: "string", maxLength: 50, nullable: true },
          notes: { type: "string", maxLength: 500, nullable: true },
          lockVersion: { type: "integer", minimum: 0 }
        }
      },
      QuranRangeRequest: {
        type: "object",
        required: ["fromSurah", "fromAyah", "toSurah", "toAyah"],
        properties: {
          fromSurah: { type: "integer", minimum: 1, maximum: 114 },
          fromAyah: { type: "integer", minimum: 1 },
          toSurah: { type: "integer", minimum: 1, maximum: 114 },
          toAyah: { type: "integer", minimum: 1 }
        }
      },
      QuranRangeResponse: {
        type: "object",
        properties: {
          fromSurah: { type: "integer" },
          fromAyah: { type: "integer" },
          toSurah: { type: "integer" },
          toAyah: { type: "integer" },
          ayahCount: { type: "integer" },
          fromPage: { type: "integer" },
          toPage: { type: "integer" },
          pagesCount: { type: "integer" },
          source: { type: "string", enum: ["provider", "cache"] }
        }
      },
      CreateCorrectionRequest: {
        type: "object",
        required: ["targetType", "targetId", "reason", "proposedChanges"],
        properties: {
          targetType: { type: "string", enum: ["ATTENDANCE", "FOLLOW_UP", "EXAM_ATTEMPT"] },
          targetId: { type: "integer", minimum: 1 },
          reason: { type: "string", minLength: 3, maxLength: 4000 },
          proposedChanges: { type: "object", additionalProperties: true }
        }
      },
      ApproveCorrectionRequest: {
        type: "object",
        properties: {
          applyChanges: { type: "boolean", default: true },
          reviewNote: { type: "string", maxLength: 500 }
        }
      },
      RejectCorrectionRequest: {
        type: "object",
        required: ["reviewNote"],
        properties: {
          reviewNote: { type: "string", minLength: 3, maxLength: 500 }
        }
      },
      LibraryVisibility: { type: "string", enum: ["ORG", "CENTER", "CIRCLE"] },
      CreateLibraryCategoryRequest: { type: "object", additionalProperties: true },
      UpdateLibraryItemRequest: { type: "object", additionalProperties: true },
      CreatePlanRequest: { type: "object", additionalProperties: true },
      UpdatePlanRequest: { type: "object", additionalProperties: true },
      CreateInvoiceRequest: { type: "object", additionalProperties: true },
      CreatePaymentRequest: { type: "object", additionalProperties: true },
      ExportReportRequest: { type: "object", additionalProperties: true }
    }
  }
};

export const getOpenApiDocument = () => openApiDocument;
export const getOpenApiJson = () => JSON.stringify(openApiDocument, null, 2);
export const getOpenApiYaml = () => YAML.stringify(openApiDocument);
