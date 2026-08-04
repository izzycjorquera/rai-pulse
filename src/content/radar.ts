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

/**
 * Real, moving developments with no confirmed effective date yet -- deliberately
 * excluded from MILESTONES above, which only carries dated deadlines.
 */
export interface HorizonItem {
  jurisdiction: string;
  title: string;
  /** Short status label shown instead of a date, e.g. "Senate-approved · awaiting vote". */
  statusTag: string;
  description: string;
  implication: string;
  sourceUrl?: string;
}

export const HORIZON: HorizonItem[] = [
  {
    jurisdiction: "Brazil",
    title: "AI regulatory framework (PL 2338/2023)",
    statusTag: "Senate-approved · awaiting Chamber vote",
    description:
      "Brazil's comprehensive AI bill, approved by the Senate in December 2024, is under review in the Chamber of Deputies, with a vote expected before the August 2026 recess. Modelled on the EU's risk-based approach, with Brazil's data protection authority (ANPD) positioned as coordinating regulator.",
    implication:
      "Multinationals operating in Brazil should track the Chamber's amendments now: a risk-based, EU-style framework arriving in Latin America's largest economy would be the region's first anchor point.",
    sourceUrl: "https://www25.senado.leg.br/web/atividade/materias/-/materia/157233",
  },
  {
    jurisdiction: "New York, US",
    title: "RAISE Act (frontier AI safety bill)",
    statusTag: "Status pending confirmation",
    description:
      "New York's frontier-model safety bill was sent to the Governor's desk, with a decision originally expected around January 2026. Whether it was signed, vetoed, or is still pending has not been confirmed here: treat this as a signal to watch, not a settled outcome.",
    implication:
      "A signed RAISE Act would make New York a fourth distinct US state approach to AI regulation, alongside Colorado, Texas and California.",
    sourceUrl: "https://www.nysenate.gov",
  },
  {
    jurisdiction: "China",
    title: "Anthropomorphic AI interaction ('companion AI') measures",
    statusTag: "In consultation · draft stage",
    description:
      "Draft measures from the Cyberspace Administration of China (CAC), issued for consultation in April 2026, would govern AI services designed for human-like or companion-style interaction. Final text and effective date are not yet settled.",
    implication:
      "Product teams building companion or human-like AI experiences for the Chinese market should track the CAC's final text before committing to a compliance timeline.",
    sourceUrl: "https://www.cac.gov.cn/",
  },
  {
    jurisdiction: "Global",
    title: "Framework Convention on Artificial Intelligence (CETS 225)",
    statusTag: "Signed · awaiting ratification trigger",
    description:
      "The first legally binding international AI treaty, with more than 20 signatories as of mid-2026 including the UK, US, Canada, EU, Japan and Australia. It enters into force three months after five ratifications, including three Council of Europe member states; that threshold is not yet confirmed as met.",
    implication:
      "This is the closest thing to a cross-regional baseline in AI governance: once the ratification trigger is hit, it becomes the one commitment spanning nearly every jurisdiction tracked on this page.",
    sourceUrl: "https://www.coe.int/en/web/artificial-intelligence/",
  },
];
