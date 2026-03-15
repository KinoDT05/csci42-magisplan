// --- SAMPLE DATA (remove when Supabase is ready) ---

export const SAMPLE_TOPICS = [
  {
    topicID: 1,
    topicName: "Budget Allocation for Q3",
    topicDescription: "We need to discuss how to allocate the remaining budget for Q3. Several committees have submitted proposals and we need to reach a consensus before the deadline on Friday.",
    isArchived: false,
    committeeID: 1,
    committeeName: "Finance Committee",
    authorName: "Maria Santos",
    dateCreated: "2025-03-01T09:00:00Z",
  },
  {
    topicID: 2,
    topicName: "Upcoming General Assembly Preparations",
    topicDescription: "Let's coordinate the tasks needed before the general assembly next month. This includes venue setup, invitations, and the program flow.",
    isArchived: false,
    committeeID: 2,
    committeeName: "Events Committee",
    authorName: "Juan dela Cruz",
    dateCreated: "2025-03-05T11:30:00Z",
  },
  {
    topicID: 3,
    topicName: "New Member Onboarding Process",
    topicDescription: "We should revisit our onboarding process for new members. The current process has been getting feedback that it's too lengthy and confusing.",
    isArchived: false,
    committeeID: 3,
    committeeName: "Membership Committee",
    authorName: "Ana Reyes",
    dateCreated: "2025-03-10T14:00:00Z",
  },
];

export const SAMPLE_REPLIES = [
  {
    replyID: 1,
    topicID: 1,
    replyContent: "I think we should prioritize the events budget since we have two major activities lined up.",
    authorName: "Carlo Mendoza",
    dateCreated: "2025-03-02T10:00:00Z",
  },
  {
    replyID: 2,
    topicID: 1,
    replyContent: "Agreed. The logistics cost alone for the assembly will take up a big chunk.",
    authorName: "Lisa Garcia",
    dateCreated: "2025-03-02T11:15:00Z",
  },
  {
    replyID: 3,
    topicID: 2,
    replyContent: "I can handle the venue coordination. Just send me the details.",
    authorName: "Marco Villanueva",
    dateCreated: "2025-03-06T09:00:00Z",
  },
  {
    replyID: 4,
    topicID: 3,
    replyContent: "Maybe we can break it down into two sessions instead of one long one?",
    authorName: "Sofia Lim",
    dateCreated: "2025-03-11T08:30:00Z",
  },
];

// Slugify helper: "Budget Allocation for Q3" → "budget-allocation-for-q3"
export function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}