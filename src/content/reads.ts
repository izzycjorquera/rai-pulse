export type ReadType = "paper" | "book" | "listen";

export type ReadItem = {
  type: ReadType;
  title: string;
  authorOrShow: string;
  year: string;
  digest: string;
  whyItMatters: string;
  link: string;
  imageUrl?: string;
};

export const READS: ReadItem[] = [
  {
    type: "paper",
    title: "Frontier AI Regulation: Managing Emerging Risks to Public Safety",
    authorOrShow: "Anderljung et al.",
    year: "2023",
    digest:
      "Anderljung and co-authors compare regulatory instruments for frontier models — export controls, compute thresholds, safety evaluations and liability regimes — and argue that ex-ante evaluation gates are the most adaptable tool when capabilities are uncertain. They draw on biosafety, aviation and nuclear governance to show how safety cases can be formalised without over-specifying technical details.",
    whyItMatters: "Bridges safety and law",
    link: "https://arxiv.org/abs/2307.03718",
  },
  {
    type: "book",
    title: "[Book title — replace me]",
    authorOrShow: "[Author name]",
    year: "2024",
    digest:
      "[Two to three sentences on why this book matters for responsible AI practitioners. Replace with your own copy for the week's pick.]",
    whyItMatters: "On the shelf",
    link: "#",
  },
  {
    type: "listen",
    title: "[Episode title — replace me]",
    authorOrShow: "[Podcast name]",
    year: "2025",
    digest:
      "[One or two sentences on why this episode is worth an hour of your commute. Replace with your own copy.]",
    whyItMatters: "Recommended listen",
    link: "#",
  },
];