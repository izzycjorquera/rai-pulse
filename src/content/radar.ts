export type MilestoneStatus = "upcoming" | "in-force" | "delayed";

export interface Milestone {
  /** ISO 8601 date string (YYYY-MM-DD). */
  date: string;
  jurisdiction: string;
  title: string;
  description: string;
  implication: string;
  status: MilestoneStatus;
  /** Official/primary source, shown as a link for readers to verify. */
  sourceUrl?: string;
}

export const MILESTONES: Milestone[] = [
  {
    date: "2025-09-01",
    jurisdiction: "China",
    title: "AI-generated content labelling rules take effect",
    description:
      "The Measures for Labelling AI-Generated Synthetic Content, alongside the mandatory standard GB 45438-2025, require both visible and implicit (metadata) labels on AI-generated content distributed in China.",
    implication:
      "Platforms and product teams serving Chinese users need dual labelling in place; contrast with the EU's Article 50 regime below, which tackles the same problem with a different mechanism.",
    status: "in-force",
    sourceUrl: "https://www.cac.gov.cn/",
  },
  {
    date: "2026-01-01",
    jurisdiction: "Texas, US",
    title: "TRAIGA (Texas Responsible AI Governance Act) takes effect",
    description:
      "An intent-based liability framework prohibiting specific harmful AI uses (behavioural manipulation, unlawful discrimination, certain deepfakes), with obligations concentrated on government agencies. Enforcement sits exclusively with the Texas Attorney General: no private right of action, a 60-day cure period, and civil penalties up to $200,000 per violation.",
    implication:
      "A narrower, prohibition-focused model, a deliberate contrast to Colorado's risk-based approach below. Watch the federal-preemption debate: proposed federal action could limit or override state AI laws like this one.",
    status: "in-force",
    sourceUrl:
      "https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint/consumer-ai-rights",
  },
  {
    date: "2026-01-01",
    jurisdiction: "California, US",
    title: "Transparency in Frontier AI Act (TFAIA / SB 53) takes effect",
    description:
      "The first US state law aimed squarely at frontier model developers (those training above 10^26 FLOPs). Requires published safety frameworks, transparency reports, and critical-incident reporting to state regulators, enforced by the California AG with penalties up to $1M per violation.",
    implication:
      "A third distinct US model, developer-and-transparency-focused rather than deployer-risk-focused. Texas, Colorado and California now show three states solving the same problem three different ways.",
    status: "in-force",
    sourceUrl:
      "https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202520260SB53",
  },
  {
    date: "2026-08-02",
    jurisdiction: "EU",
    title: "AI Act transparency obligations apply (Article 50)",
    description:
      "Chatbot disclosure, AI-generated content marking, and deepfake labeling requirements take effect, and the Commission's enforcement powers over general-purpose AI models activate. The Digital Omnibus deferred high-risk obligations, but this transparency layer was not delayed.",
    implication:
      "Any organisation with customer-facing chatbots or AI-generated content in the EU market needs disclosure and marking mechanisms live by this date.",
    status: "in-force",
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
    date: "2027-01-22",
    jurisdiction: "South Korea",
    title: "AI Basic Act grace period ends: enforcement begins",
    description:
      "South Korea's AI Basic Act (formally the Framework Act on the Development of Artificial Intelligence and the Establishment of a Foundation for Trustworthiness) took effect on 22 January 2026, but MSIT is running a grace period of at least one year during which administrative fines are deferred, except in cases involving serious social harm. Substantive obligations already apply; the enforcement teeth arrive at the end of the grace window. The Act applies extraterritorially.",
    implication:
      "Organisations serving Korean users need transparency notices, generative-AI labelling, and, where thresholds are met, a designated local representative in place before fines become live.",
    status: "upcoming",
    sourceUrl: "https://www.trade.gov/market-intelligence/south-korea-ai-basic-act",
  },
  {
    date: "2027-12-02",
    jurisdiction: "EU",
    title: "AI Act high-risk obligations apply (Annex III)",
    description:
      "The deferred core of the AI Act: full provider and deployer obligations for stand-alone high-risk systems in areas like employment, credit, education, and essential services.",
    implication:
      "Multinationals with EU operations get sixteen extra months: an extension of time, not a relaxation of the underlying obligations.",
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
