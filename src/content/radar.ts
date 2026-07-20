export const radar: RadarItem[] = [
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
];export type MilestoneStatus = "upcoming" | "in-force" | "delayed";

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
    title: "EU AI Act — High-risk system obligations apply",
    description:
      "Full conformity assessment, risk management, logging and post-market monitoring duties become enforceable for Annex III high-risk AI systems.",
    implication:
      "Deployers and providers of high-risk AI systems in the EU must complete conformity assessments and maintain post-market monitoring records.",
    status: "upcoming",
  },
  {
    date: "2026-08-02",
    jurisdiction: "EU",
    title: "EU AI Act — General-purpose AI transparency obligations",
    description:
      "GPAI providers must publish training data summaries, comply with the EU AI Act copyright policy, and provide systemic-risk documentation where applicable.",
    implication:
      "GPAI model providers serving EU users must publish systemic-risk assessments and downstream-use documentation.",
    status: "upcoming",
  },
  {
    date: "2026-09-15",
    jurisdiction: "United States",
    title: "NIST AI RMF 2.0 expected publication",
    description:
      "Anticipated update to the NIST AI Risk Management Framework with expanded guidance on generative AI and enterprise governance.",
    implication:
      "Risk and compliance teams can use the updated framework to benchmark AI governance programs and procurement requirements.",
    status: "upcoming",
  },
  {
    date: "2026-11-03",
    jurisdiction: "United States",
    title: "[VERIFY DATE] Federal AI procurement executive order compliance deadline",
    description:
      "[VERIFY DATE] Agencies may face new deadlines for documenting AI use cases and risk mitigations in federal procurement.",
    implication:
      "Government contractors and federal program managers should prepare AI inventory and risk documentation for audit readiness.",
    status: "upcoming",
  },
  {
    date: "2026-12-01",
    jurisdiction: "United Kingdom",
    title: "[VERIFY DATE] UK AI Bill committee-stage reporting deadline",
    description:
      "[VERIFY DATE] Expected timeline for the UK AI Bill to complete committee scrutiny and report to the House.",
    implication:
      "UK-based AI deployers and regulators should monitor the bill's scope for sectoral regulator duties.",
    status: "delayed",
  },
  {
    date: "2027-01-15",
    jurisdiction: "China",
    title: "[VERIFY DATE] Provisional AI regulation on deep synthesis services",
    description:
      "[VERIFY DATE] Potential expansion of China's algorithmic recommendation and deep synthesis rules to new provider categories.",
    implication:
      "Platforms and AI labs operating in China should track content-labeling and algorithmic filing requirements.",
    status: "upcoming",
  },
  {
    date: "2026-02-02",
    jurisdiction: "EU",
    title: "EU AI Act — Prohibited AI practices in force",
    description:
      "Rules banning manipulative, exploitative and social-scoring AI systems became enforceable across the EU.",
    implication:
      "Any AI system deployed in the EU must be reviewed for prohibited practices such as manipulative subliminal techniques.",
    status: "in-force",
  },
  {
    date: "2026-05-01",
    jurisdiction: "Colorado",
    title: "Colorado AI Act — Developer and deployer duties take effect",
    description:
      "Colorado's comprehensive AI law imposes transparency, risk mitigation and disclosure obligations on developers and deployers of high-risk AI.",
    implication:
      "Companies offering high-risk AI products or services in Colorado need documented risk management and consumer disclosure processes.",
    status: "in-force",
  },
];
