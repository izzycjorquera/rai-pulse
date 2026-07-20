export type MilestoneStatus = "upcoming" | "in-force" | "delayed";

export interface Milestone {
  /** ISO 8601 date string (YYYY-MM-DD). */
  date: string;
  jurisdiction: string;
  title: string;
  description: string;
  implication: string;
  status: MilestoneStatus;
}

export const MILESTONES: Milestone[] = [
  {
    date: "2026-08-02",
    jurisdiction: "EU",
    title: "AI Act transparency obligations apply (Article 50)",
    description:
      "Chatbot disclosure, AI-generated content marking, and deepfake labeling requirements take effect, and the Commission's enforcement powers over general-purpose AI models activate. The Digital Omnibus deferred high-risk obligations, but this transparency layer was not delayed.",
    implication:
      "Any organisation with customer-facing chatbots or AI-generated content in the EU market needs disclosure and marking mechanisms live by this date.",
    status: "upcoming",
  },
  {
    date: "2026-12-02",
    jurisdiction: "EU",
    title: "Deadline for AI-content watermarking solutions",
    description:
      "Under the Digital Omnibus agreement, the grace period for implementing technical transparency solutions for artificially generated content ends, with compliance due by this date.",
    implication:
      "Content and product teams shipping generative features in the EU need machine-readable marking implemented, not just planned.",
    status: "upcoming",
  },
  {
    date: "2027-01-01",
    jurisdiction: "Colorado, US",
    title: "Revised Colorado AI law and Chatbot Safety Act take effect",
    description:
      "SB 26-189 replaces Colorado's original AI Act with a narrower framework: notice requirements, an adverse-action and human-review process, and three-year record retention for automated decision-making in consequential decisions. The Chatbot Safety Act takes effect the same day.",
    implication:
      "Employers and lenders using automated decision tools for Colorado residents need notice and human-review workflows ready; chatbot operators face age-estimation and disclosure duties.",
    status: "upcoming",
  },
  {
    date: "2027-12-02",
    jurisdiction: "EU",
    title: "AI Act high-risk obligations apply (Annex III)",
    description:
      "The deferred core of the AI Act: full provider and deployer obligations for stand-alone high-risk systems in areas like employment, credit, education, and essential services.",
    implication:
      "Multinationals with EU operations get sixteen extra months — an extension of time, not a relaxation of the underlying obligations.",
    status: "upcoming",
  },
  {
    date: "2028-08-02",
    jurisdiction: "EU",
    title: "High-risk obligations for AI embedded in regulated products",
    description:
      "Obligations extend to AI systems that are products or safety components under EU product-safety law (medical devices, machinery, and similar), with a narrowed definition of 'safety component'.",
    implication:
      "Manufacturers embedding AI in regulated hardware inherit conformity-assessment duties on this later track.",
    status: "upcoming",
  },
];
