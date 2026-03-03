/**
 * Invite message templates. Variables: {CODE}, {SIGNIN_URL}, {EXPIRES_AT}, {MAX_USES}, {NOTE}, {PERSONAL}
 */

export const TEMPLATE_LABELS: Record<string, string> = {
  general: "General",
  church_group: "Church group",
  mission_team: "Mission team",
  pastoral_circle: "Pastoral circle",
  seminary_cohort: "Seminary cohort",
};

export const TEMPLATES = {
  general: {
    label: "General",
    dm: `Hi — I'm inviting you to CSM, a quiet digital space for prayer, Scripture, and testimony.
CSM is currently invite-only.

Invite code: {CODE}
Sign in: {SIGNIN_URL}
Expires: {EXPIRES_AT}
Uses: {MAX_USES}

{PERSONAL}`,
    email: `Hello,

I'm inviting you to CSM — a quiet digital space for the Christian life: prayer, Scripture, testimony, and steady care for one another.
CSM is currently invite-only. No algorithms. No ads. A slower space.

How to join:
• Open this link: {SIGNIN_URL}
• Sign in with your email (magic link)
• Enter your invite code: {CODE}
• Complete your profile

Invite details:
• Code: {CODE}
• Expires: {EXPIRES_AT}
• Uses: {MAX_USES}
• Note: {NOTE}

{PERSONAL}

If you have any trouble signing in, reply here and I'll help.

Warmly,
`,
  },

  church_group: {
    label: "Church group",
    dm: `Hi — I'm inviting you to CSM for our church community.
It's a calm space to share prayers, gratitude, and testimonies without noise.
CSM is currently invite-only. No algorithms. No ads. A slower space.

Invite code: {CODE}
Sign in: {SIGNIN_URL}
Expires: {EXPIRES_AT}
Uses: {MAX_USES}

{PERSONAL}`,
    email: `Hello,

I'd like to invite you to CSM for our church community — a calm space to share prayers, gratitude, and testimonies with intention.
CSM is currently invite-only. No algorithms. No ads. A slower space.

How to join:
• Open: {SIGNIN_URL}
• Sign in with your email (magic link)
• Enter invite code: {CODE}
• Complete your profile

Invite details:
• Code: {CODE}
• Expires: {EXPIRES_AT}
• Uses: {MAX_USES}
• Note: {NOTE}

A gentle guideline: treat it like a shared room, not a stage.

{PERSONAL}

Grace and peace,
`,
  },

  mission_team: {
    label: "Mission team",
    dm: `Hi — I'm inviting you to CSM for mission updates and prayer.
It's a steady place to share requests and answered prayers without spectacle.
CSM is currently invite-only. No algorithms. No ads. A slower space.

Invite code: {CODE}
Sign in: {SIGNIN_URL}
Expires: {EXPIRES_AT}
Uses: {MAX_USES}

{PERSONAL}`,
    email: `Hello,

I'm inviting you to CSM as a space for mission prayer and updates — shared with intention, without spectacle.
CSM is currently invite-only. No algorithms. No ads. A slower space.

How to join:
• Open: {SIGNIN_URL}
• Sign in with your email (magic link)
• Enter invite code: {CODE}
• Complete your profile

Invite details:
• Code: {CODE}
• Expires: {EXPIRES_AT}
• Uses: {MAX_USES}
• Note: {NOTE}

You can share:
• Prayer requests and specific needs
• Brief updates (what to pray for next)
• Answered prayers as testimony (only when you choose)

{PERSONAL}

With gratitude,
`,
  },

  pastoral_circle: {
    label: "Pastoral circle",
    dm: `Hi — I'm inviting you to CSM for a pastoral circle.
It's a quiet space for steady prayer, reflection, and care.
CSM is currently invite-only. No algorithms. No ads. A slower space.

Invite code: {CODE}
Sign in: {SIGNIN_URL}
Expires: {EXPIRES_AT}
Uses: {MAX_USES}

{PERSONAL}`,
    email: `Hello,

I'd like to invite you to CSM for a pastoral circle — a quiet space for steady prayer, reflection, and care.
CSM is currently invite-only. No algorithms. No ads. A slower space.

How to join:
• Open: {SIGNIN_URL}
• Sign in with your email (magic link)
• Enter invite code: {CODE}
• Complete your profile

Invite details:
• Code: {CODE}
• Expires: {EXPIRES_AT}
• Uses: {MAX_USES}
• Note: {NOTE}

If it helps: keep posts brief, prayerful, and grounded in real life.

{PERSONAL}

In Christ,
`,
  },

  seminary_cohort: {
    label: "Seminary cohort",
    dm: `Hi — I'm inviting you to CSM for our seminary cohort.
It's a calm space for Scripture notes, questions, and prayer without performative debate.
CSM is currently invite-only. No algorithms. No ads. A slower space.

Invite code: {CODE}
Sign in: {SIGNIN_URL}
Expires: {EXPIRES_AT}
Uses: {MAX_USES}

{PERSONAL}`,
    email: `Hello,

I'm inviting you to CSM for our seminary cohort — a calm space for Scripture notes, questions, and prayer without performative debate.
CSM is currently invite-only. No algorithms. No ads. A slower space.

How to join:
• Open: {SIGNIN_URL}
• Sign in with your email (magic link)
• Enter invite code: {CODE}
• Complete your profile

Invite details:
• Code: {CODE}
• Expires: {EXPIRES_AT}
• Uses: {MAX_USES}
• Note: {NOTE}

A simple guideline: ask honest questions, share with humility, and keep the tone gentle.

{PERSONAL}

Peace,
`,
  },
} as const;
