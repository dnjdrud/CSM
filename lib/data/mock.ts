/**
 * Typed mock datasets for MVP. Only repository.ts should import this module.
 * getSeedData() returns initial data for cold start or reset; ministries are static reference data.
 */
import type { User, Post, Comment, Reaction, Follow, Ministry, Notification } from "@/lib/domain/types";

const seedUsers: User[] = [
  {
    id: "u1",
    name: "Sarah Chen",
    role: "LAY",
    affiliation: "Grace Church, Seattle",
    bio: "Seeking to integrate faith and vocation.",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "u2",
    name: "James Okonkwo",
    role: "MISSIONARY",
    affiliation: "Nairobi Community Initiative",
    bio: "To steward resources and people so communities can lead their own change.",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "u3",
    name: "Maria Santos",
    role: "LAY",
    affiliation: "Hospital de Santa Maria, Lisbon",
    bio: "To treat the person, not just the chart—and to honor limits when fixing isn't possible.",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "u4",
    name: "David Park",
    role: "LAY",
    affiliation: "City Fellowship, Austin",
    bio: "To build systems that serve people and to lead without needing the spotlight.",
    createdAt: "2024-01-01T00:00:00Z",
  },
];

const seedPosts: Post[] = [
  {
    id: "p0",
    authorId: "u2",
    category: "MINISTRY",
    title: "February update: building with the local council",
    content:
      "This month we sat with the local council every Tuesday. Not to present a plan—to listen. They've been clear: they want ownership of the health outreach, not a program dropped in from outside.\n\nWe're stepping back from \"delivering\" and focusing on training and resourcing the leaders they've already identified. It's slower. It's also the only way this will last.\n\nPray for wisdom as we hand over more. And for the families who still don't have consistent care—we haven't forgotten them.",
    visibility: "MEMBERS",
    tags: [],
    createdAt: "2025-02-27T14:00:00Z",
  },
  {
    id: "p1",
    authorId: "u3",
    category: "PRAYER",
    title: "Prayer for the family I sat with",
    content:
      "Would you pray with me for the family I mentioned last week—the one who lost their father. They're navigating grief and logistics. I don't have words to fix it. I'm asking for peace and presence for them.",
    visibility: "MEMBERS",
    tags: [],
    createdAt: "2025-02-27T08:00:00Z",
  },
  {
    id: "p2",
    authorId: "u2",
    category: "DEVOTIONAL",
    title: "What I learned about leadership from Nehemiah",
    content:
      "Rebuilding is slow. Nehemiah didn't rush the wall; he assigned each family a section and let them own it. I've tried to do the same: small, clear responsibilities, long timelines, and a lot of listening.\n\nWhen opposition came, he didn't hide. He prayed, posted a guard, and kept working. That combination—dependence and diligence—is what I want to model.\n\nThis year we're rebuilding our board. Same principle: one role at a time, clear ownership, and no rush to look impressive. The wall got built. So will this.",
    visibility: "MEMBERS",
    tags: [],
    reflectionPrompt: "Where in your work do you need to slow down and assign ownership instead of controlling outcomes?",
    createdAt: "2025-02-26T10:00:00Z",
  },
  {
    id: "p3",
    authorId: "u3",
    category: "DEVOTIONAL",
    title: "Holding space for grief at the bedside",
    content:
      "Medicine gives us tools to fix. Sometimes the only thing we can offer is presence. I've started to ask myself: am I treating the chart or the person?\n\nThere's a particular kind of silence that helps—when I stop explaining and just sit. It doesn't solve anything. It doesn't need to.\n\nLast week a family asked me to stay after I'd said there was nothing more we could do. I sat. They didn't need another plan. They needed a witness. I'm learning that being a witness is also work.",
    visibility: "MEMBERS",
    tags: [],
    reflectionPrompt: 'When have you been tempted to "fix" when someone needed you to simply be there?',
    createdAt: "2025-02-25T14:30:00Z",
  },
  {
    id: "p4",
    authorId: "u1",
    category: "DEVOTIONAL",
    title: "Why I stopped grading on Sundays",
    content:
      "I used to treat Sunday as a catch-up day. Papers, emails, planning. It felt responsible. Over time I noticed I was more irritable on Monday—with students and with myself.\n\nI'm not legalistic about it now. But I've tried to keep one day where my work doesn't demand a response. Rest as resistance to the endless inbox.\n\nSome weeks I slip. The boundary isn't about perfection; it's about remembering I'm not the one holding the world together. My students get a better teacher when I remember that.",
    visibility: "MEMBERS",
    tags: [],
    reflectionPrompt: "What would it look like to protect one boundary that isn't for productivity?",
    createdAt: "2025-02-24T09:15:00Z",
  },
  {
    id: "p5",
    authorId: "u4",
    category: "DEVOTIONAL",
    title: "Saying no to the wrong kind of scale",
    content:
      "We had a chance to pitch to a big client. The contract would have doubled our team and our revenue. It would also have meant building features we didn't believe in and supporting a product we'd have been ashamed of.\n\nWe said no. It wasn't dramatic—we just didn't submit the proposal. Our board asked why. I said we're not trying to be the biggest; we're trying to be faithful to what we said we'd build.\n\nThat decision cost us. It also clarified who we are. I've been re-reading the parable of the talents. The servant who buried the talent was wrong because he was afraid. The ones who invested were right because they took responsibility. I don't think the story is 'grow at any cost.' I think it's 'don't hide; use what you've been given.' We had a different kind of capital—our values, our team's trust. Spending that on a deal we didn't believe in would have been the real waste.",
    visibility: "MEMBERS",
    tags: [],
    createdAt: "2025-02-23T16:00:00Z",
  },
];

const seedComments: Comment[] = [];
const seedFollows: Follow[] = [];
const seedReactions: Reaction[] = [];
const seedNotifications: Notification[] = [];

/** Initial data for repository bootstrap or reset. Returns fresh copies. */
export function getSeedData(): {
  users: User[];
  posts: Post[];
  comments: Comment[];
  follows: Follow[];
  reactions: Reaction[];
  notifications: Notification[];
} {
  return {
    users: seedUsers.map((u) => ({ ...u })),
    posts: seedPosts.map((p) => ({ ...p, tags: p.tags ?? [] })),
    comments: [...seedComments],
    follows: [...seedFollows],
    reactions: [...seedReactions],
    notifications: [...seedNotifications],
  };
}

export const ministries: Ministry[] = [
  {
    id: "m1",
    name: "Nairobi Community Initiative",
    description:
      "Local leadership development and community health. We work with churches and neighborhood leaders to steward resources and strengthen local ownership.",
    location: "Nairobi, Kenya",
    supportAccount: "", // Add bank name, account number, etc. when ready
  },
];
