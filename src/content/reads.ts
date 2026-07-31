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
    title: "Responsible AI: Implement an Ethical Approach in Your Organization",
    authorOrShow: "Olivia Gambelin",
    year: "2024",
    digest:
      "Gambelin, an AI ethicist and founder of Ethical Intelligence, lays out a practical playbook for embedding ethics into AI development rather than treating it as a compliance afterthought. She introduces the concept of \"values-based innovation,\" showing teams how to translate abstract principles into concrete design decisions, governance structures and decision-making frameworks. The book's key message is that responsible AI is a competitive advantage, not a constraint — organizations that build trust into their products early will outlast those that bolt on ethics after the fact.",
    whyItMatters: "Playbook for practitioners",
    link: "https://www.amazon.com/Responsible-AI-Implement-Approach-Organization/dp/1398615706",
  },
  {
    type: "listen",
    title: "Can We Govern AI? with Marietje Schaake",
    authorOrShow: "Your Undivided Attention",
    year: "2024",
    digest:
      "Schaake, who helped write the EU's landmark tech regulations as a member of the European Parliament, walks hosts Tristan Harris and Aza Raskin through why AI is uniquely hard to govern: the data and models stay locked inside private companies, and constant updates mean there's no fixed product left to regulate. She argues democratic institutions can still keep pace with AI, but only by treating governance as continuous oversight rather than a one-time law. The episode's key message is that the choice isn't between regulation and innovation — it's between AI shaped by democratic input or shaped entirely by the companies building it.",
    whyItMatters: "Governance in real time",
    link: "https://www.humanetech.com/podcast/can-we-govern-ai",
  },
];
