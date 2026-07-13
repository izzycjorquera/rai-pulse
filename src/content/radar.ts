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
