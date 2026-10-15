/**
 * Everything personal on the site lives here.
 * Search for `TODO(mahdi)` to find the placeholders that still need real details.
 */

export type NodeId = "boot" | "web" | "ml" | "avitec";

export interface Metric {
  value: string;
  label: string;
}

export interface Project {
  name: string;
  description: string;
  url?: string;
}

export interface JourneyNode {
  id: NodeId;
  /** Two-digit label shown as the node ID, e.g. "01". */
  index: string;
  title: string;
  subtitle: string;
  period: string;
  summary: string;
  bullets: string[];
  skills: string[];
  projects?: Project[];
  metrics?: Metric[];
}

export interface Links {
  email: string;
  linkedin: string;
  github: string;
  resumeUrl: string;
}

export interface Profile {
  name: string;
  firstName: string;
  role: string;
  pitch: string;
  /** ISO date, YYYY-MM-DD. */
  birthDate: string;
  location: string;
  nodes: JourneyNode[];
  links: Links;
  game: {
    eyebrow: string;
    title: string;
    intro: string;
    punchline: string;
  };
}

export const profile: Profile = {
  name: "Mahdi Rasouli",
  firstName: "Mahdi",
  role: "Systems & Methods · AI Process Engineer",
  pitch: "I turn messy processes into elegant systems.",
  birthDate: "2003-09-03",
  location: "TODO(mahdi): City, Country",
  nodes: [
    {
      id: "boot",
      index: "01",
      title: "Boot sequence",
      subtitle: "B.Sc. Computer Science",
      period: "2003 → TODO(mahdi): graduation year",
      summary:
        "Born on 3 September 2003. Studied Computer Science and learned to see every problem as a system of inputs, steps and outputs.",
      bullets: [
        "TODO(mahdi): University name",
        "Algorithms, data structures, software engineering",
        "TODO(mahdi): thesis / final project",
      ],
      skills: ["Algorithms", "Data structures", "Software design"],
    },
    {
      id: "web",
      index: "02",
      title: "Web developer",
      subtitle: "Building interfaces people actually use",
      period: "TODO(mahdi): start – end",
      summary:
        "Shipped production websites and web apps, from pixel-level UI to the logic behind it.",
      bullets: [
        "TODO(mahdi): company name and what you built there",
        "Responsive, accessible front-ends",
        "Performance-minded, component-driven code",
      ],
      skills: ["TypeScript", "React", "Next.js", "HTML & CSS", "REST APIs"],
      projects: [
        { name: "TODO(mahdi): Project one", description: "One line on what it does and your part in it." },
        { name: "TODO(mahdi): Project two", description: "One line on what it does and your part in it." },
      ],
    },
    {
      id: "ml",
      index: "03",
      title: "Machine learning",
      subtitle: "Teaching systems to learn from data",
      period: "TODO(mahdi): year",
      summary:
        "Completed a machine-learning course and built models end to end: data cleaning, feature engineering, training and evaluation.",
      bullets: [
        "TODO(mahdi): course name / provider",
        "Supervised & unsupervised learning",
        "TODO(mahdi): one ML project you are proud of",
      ],
      skills: ["Python", "scikit-learn", "Pandas", "Model evaluation", "Neural networks"],
    },
    {
      id: "avitec",
      index: "04",
      title: "Avitec",
      subtitle: "Systems & Methods",
      period: "TODO(mahdi): start → now",
      summary:
        "Designing, modelling and optimizing how the company works, and using AI to make those processes faster, leaner and smarter.",
      bullets: [
        "Map and model end-to-end business processes",
        "Find bottlenecks and redesign the flow",
        "Apply AI to automate and optimize process steps",
      ],
      skills: ["Process modelling", "BPMN", "Process optimization", "AI automation", "Systems thinking"],
      metrics: [
        { value: "TODO", label: "processes modelled" },
        { value: "TODO%", label: "cycle time saved" },
        { value: "TODO", label: "steps automated" },
      ],
    },
  ],
  links: {
    email: "TODO(mahdi): you@example.com",
    linkedin: "TODO(mahdi): https://www.linkedin.com/in/your-handle",
    github: "TODO(mahdi): https://github.com/your-handle",
    resumeUrl: "/resume.pdf",
  },
  game: {
    eyebrow: "// interactive · 20 seconds",
    title: "Optimize my morning",
    intro:
      "This is my job, in miniature. Drag the steps into an efficient flow and delete the waste before the clock runs out.",
    punchline: "Not bad. Imagine what I'd do with your company's processes.",
  },
};

/** True while a value is still a placeholder; used to hide unfinished links. */
export function isPlaceholder(value: string): boolean {
  return value.includes("TODO");
}
