# Corporate Innovation Platform — Data Model (ERD)

## 1. Entity-Relationship Diagram

```mermaid
erDiagram
    DEPARTMENT ||--o{ USER : "employs"
    DEPARTMENT ||--o{ IDEA : "owns"
    USER ||--o{ IDEA : "submits (owner)"
    USER ||--o{ IDEA : "reviewed as coordinator"
    USER ||--o{ EVALUATION : "scores as evaluator"
    USER ||--o{ DECISION : "decides as committee"
    USER ||--o{ EXECUTION : "assigned as execution owner"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ AUDIT_LOG : "performs"
    USER ||--o{ CRITERIA_WEIGHTS : "last updated by"
    IDEA ||--o{ EVALUATION : "has"
    IDEA ||--o{ DECISION : "has"
    IDEA ||--o| EXECUTION : "has (once approved)"

    DEPARTMENT {
        ObjectId _id PK
        string name UK
        string code UK
    }
    USER {
        ObjectId _id PK
        string username UK
        string email UK
        string passwordHash
        string role "employee|coordinator|evaluator|committee|admin"
        ObjectId department FK
        boolean isActive
        number failedLoginAttempts
        date lockUntil
        date createdAt
    }
    IDEA {
        ObjectId _id PK
        string code UK "IDEA-0001"
        string title
        string domain "Service|Process|Technology"
        ObjectId department FK
        ObjectId owner FK
        string problemStatement
        string proposedSolution
        string expectedImpact
        number initialCost
        string implementationRequirements
        string risksAndDependencies
        array attachments "embedded metadata"
        string status
        array statusHistory "embedded"
        date createdAt
        date updatedAt
    }
    EVALUATION {
        ObjectId _id PK
        ObjectId idea FK
        ObjectId evaluator FK
        object scores "6 weighted criteria, 0-100 each"
        number weightedTotal
        string recommendation
        string systemSuggestion "RecommendPilot|NeedsDevelopment|Archive"
        date createdAt
    }
    DECISION {
        ObjectId _id PK
        ObjectId idea FK
        ObjectId decidedBy FK
        string outcome "ApprovedForPilot|ReturnedForDevelopment|RejectedAndClosed"
        string reason
        date createdAt
    }
    EXECUTION {
        ObjectId _id PK
        ObjectId idea FK UK
        ObjectId owner FK
        date dueDate
        array progressUpdates "embedded"
        string finalReport
        date completedAt
    }
    CRITERIA_WEIGHTS {
        ObjectId _id PK
        number businessImpact
        number feasibility
        number initialCost
        number innovation
        number implementationRisk
        number scalability
        ObjectId updatedBy FK
        date updatedAt
    }
    NOTIFICATION {
        ObjectId _id PK
        ObjectId user FK
        string message
        string link
        boolean isRead
        date createdAt
    }
    AUDIT_LOG {
        ObjectId _id PK
        ObjectId user FK
        string action
        string targetType
        ObjectId targetId
        string note
        object meta
        date at
    }
```

## 2. Relationship notes

- **Department 1—N User / Idea**: a department groups employees and ideas for reporting; kept as
  its own collection (not an enum) so admins can add/rename departments without a code change.
- **User 1—N Idea (owner)**: every idea has exactly one owning employee; ownership drives the
  edit/view permission checks in `ideaService`.
- **Idea 1—N Evaluation**: modeled as one-to-many so a second evaluator could re-score in a future
  iteration, but the current UI/service only ever creates one evaluation per idea (enforced by a
  unique index on `idea` — see below).
- **Idea 1—N Decision**: an idea can be sent back and re-decided multiple times (Return →
  resubmit → decide again), so this stays one-to-many; the *latest* decision is what the UI shows.
- **Idea 1—1 Execution**: created only when an idea is Approved for Pilot; unique index on
  `idea` enforces the 1:1 relationship.
- **Attachments and statusHistory are embedded**, not separate collections, because they are
  always read/written together with their parent Idea and never queried independently — a
  textbook case for embedding over referencing in MongoDB.
- **CriteriaWeights is a singleton collection** (application enforces there is ever only one
  active document) so the weighted-scoring formula can change over time without touching code.
- **AuditLog and Notification** both reference `User` but are intentionally decoupled from any
  other entity via a generic `targetType`/`targetId` pair, since they must be able to describe
  actions on Users, Ideas, Evaluations, Decisions, or CriteriaWeights alike.

## 3. Indexes

| Collection | Index | Reason |
|---|---|---|
| User | `{ username: 1 }` unique | login lookup + uniqueness |
| User | `{ email: 1 }` unique | uniqueness, future password reset |
| Department | `{ name: 1 }` unique, `{ code: 1 }` unique | referential integrity, human lookup |
| Idea | `{ code: 1 }` unique | human-readable reference (`IDEA-0001`), fast lookup |
| Idea | `{ owner: 1, status: 1 }` | "My Ideas" queries filtered by status |
| Idea | `{ status: 1 }` | queue screens (screening/evaluation/decision queues) |
| Idea | `{ department: 1 }`, `{ domain: 1 }` | department/domain reports |
| Idea | text index on `{ title, problemStatement }` | duplicate-detection search |
| Evaluation | `{ idea: 1 }` unique | one evaluation per idea |
| Decision | `{ idea: 1, createdAt: -1 }` | fetch latest decision per idea fast |
| Execution | `{ idea: 1 }` unique | one execution record per idea |
| Notification | `{ user: 1, isRead: 1, createdAt: -1 }` | unread list per user, newest first |
| AuditLog | `{ at: -1 }`, `{ user: 1 }`, `{ targetType: 1, targetId: 1 }` | audit log filters |

## 4. Mongoose Schema Definitions

> These are the authoritative shapes implemented 1:1 in `server/src/models/*.js`.

```js
// Department.js
{
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true, uppercase: true },
}

// User.js
{
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, required: true, enum: ROLES }, // employee|coordinator|evaluator|committee|admin
  department: { type: ObjectId, ref: 'Department', required: true },
  isActive: { type: Boolean, default: true },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  timestamps: true,
}

// Idea.js
{
  code: { type: String, required: true, unique: true },              // IDEA-0001
  title: { type: String, required: true, minlength: 5, maxlength: 150 },
  domain: { type: String, required: true, enum: ['Service', 'Process', 'Technology'] },
  department: { type: ObjectId, ref: 'Department', required: true },
  owner: { type: ObjectId, ref: 'User', required: true },
  problemStatement: { type: String, maxlength: 5000 },
  proposedSolution: { type: String, maxlength: 5000 },
  expectedImpact: { type: String, maxlength: 5000 },
  initialCost: { type: Number, min: 0 },
  implementationRequirements: { type: String, maxlength: 5000 },
  risksAndDependencies: { type: String, maxlength: 5000 },
  attachments: [{
    originalName: String, storedName: String, mimeType: String, size: Number,
    uploadedAt: { type: Date, default: Date.now },
  }],
  status: { type: String, required: true, enum: IDEA_STATUSES, default: 'Draft' },
  statusHistory: [{
    from: String, to: String, by: { type: ObjectId, ref: 'User' },
    note: String, at: { type: Date, default: Date.now },
  }],
  timestamps: true,
}

// Evaluation.js
{
  idea: { type: ObjectId, ref: 'Idea', required: true, unique: true },
  evaluator: { type: ObjectId, ref: 'User', required: true },
  scores: {
    businessImpact: { type: Number, min: 0, max: 100, required: true },
    feasibility: { type: Number, min: 0, max: 100, required: true },
    initialCost: { type: Number, min: 0, max: 100, required: true },
    innovation: { type: Number, min: 0, max: 100, required: true },
    implementationRisk: { type: Number, min: 0, max: 100, required: true },
    scalability: { type: Number, min: 0, max: 100, required: true },
  },
  weightedTotal: { type: Number, required: true },
  recommendation: { type: String, maxlength: 2000 },
  systemSuggestion: { type: String, enum: ['RecommendPilot', 'NeedsDevelopment', 'Archive'] },
  timestamps: true,
}

// Decision.js
{
  idea: { type: ObjectId, ref: 'Idea', required: true },
  decidedBy: { type: ObjectId, ref: 'User', required: true },
  outcome: { type: String, required: true, enum: ['ApprovedForPilot', 'ReturnedForDevelopment', 'RejectedAndClosed'] },
  reason: { type: String, maxlength: 2000 }, // required at service layer for Returned/Rejected
  timestamps: true,
}

// Execution.js
{
  idea: { type: ObjectId, ref: 'Idea', required: true, unique: true },
  owner: { type: ObjectId, ref: 'User', required: true },
  dueDate: { type: Date, required: true },
  progressUpdates: [{
    note: String, by: { type: ObjectId, ref: 'User' }, at: { type: Date, default: Date.now },
  }],
  finalReport: { type: String, maxlength: 5000 },
  completedAt: Date,
  timestamps: true,
}

// CriteriaWeights.js (singleton)
{
  businessImpact: { type: Number, default: 25 },
  feasibility: { type: Number, default: 20 },
  initialCost: { type: Number, default: 15 },
  innovation: { type: Number, default: 15 },
  implementationRisk: { type: Number, default: 10 },
  scalability: { type: Number, default: 15 },
  updatedBy: { type: ObjectId, ref: 'User' },
  timestamps: true,
}

// Notification.js
{
  user: { type: ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  link: String,
  isRead: { type: Boolean, default: false },
  timestamps: true,
}

// AuditLog.js
{
  user: { type: ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: ObjectId,
  note: String,
  meta: Object,
  timestamps: true,
}
```
