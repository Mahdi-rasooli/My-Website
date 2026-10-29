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
  /** Short label above the title that says what the chapter is about, e.g. "graduated 2025". */
  tag: string;
  title: string;
  subtitle: string;
  /** Optional dates shown beside the tag. */
  period?: string;
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
    title: string;
    intro: string;
    punchline: string;
  };
}

export const profile: Profile = {
  name: "Mahdi Rasouli",
  firstName: "Mahdi",
  role: "AI process engineer at Avitec",
  pitch: "I turn messy processes into elegant systems.",
  birthDate: "2003-09-03",
  location: "TODO(mahdi): City, Country",
  nodes: [
    {
      id: "boot",
      tag: "graduated 2025",
      title: "Boot sequence",
      subtitle: "B.Sc. Computer Science",
      summary:
        "Born on 3 September 2003. Studied Computer Science and learned to see every problem as a system of inputs, steps and outputs.",
      bullets: ["Science and Research Branch, Tehran", "Algorithms, data structures, software engineering"],
      skills: ["Algorithms", "Data structures", "ML"],
      projects: [
        {
          name: "Food-ordering website (final project)",
          description: "Full-stack app with menu browsing, a cart and real-time order tracking.",
          url: "https://github.com/Mahdi-rasooli/food-ordering-project",
        },
      ],
    },
    {
      id: "web",
      tag: "freelance · Avitec",
      title: "Web developer",
      subtitle: "Building interfaces people actually use",
      summary:
        "Shipped websites and web apps as a freelancer and at Avitec, from pixel-level UI to the logic behind it.",
      bullets: [
        "Freelance projects, then web development at Avitec",
        "Responsive, accessible front-ends",
        "Performance-minded, component-driven code",
      ],
      skills: ["TypeScript", "React", "Next.js", "HTML & CSS", "REST APIs", "Express", "MongoDB"],
      projects: [
        {
          name: "Job portal",
          description:
            "Full-stack job board: search and apply for jobs, separate dashboards for job seekers and employers, role-based authentication.",
          url: "https://github.com/Mahdi-rasooli/job-portal",
        },
        { name: "Study management", description: "A study-management web app." },
      ],
    },
    {
      id: "ml",
      tag: "machine learning with python",
      title: "Machine learning",
      subtitle: "Teaching systems to learn from data",
      summary:
        "Completed a machine-learning course and built models end to end: data cleaning, feature engineering, training and evaluation.",
      bullets: [
        "Course: Machine Learning with Python",
        "Supervised & unsupervised learning",
        "Data cleaning, feature engineering and model evaluation",
      ],
      skills: ["Python", "scikit-learn", "Pandas", "Model evaluation", "Neural networks"],
      projects: [
        { name: "Tehran house-price prediction", description: "A model that predicts house prices in Tehran." },
      ],
    },
    {
      id: "avitec",
      tag: "systems & methods",
      title: "Avitec",
      subtitle: "From web development to designing processes",
      period: "2025 → now",
      summary:
        "Started on the web team, then moved to Systems & Methods: designing and modelling how the company works, and using AI to make those processes faster, leaner and smarter.",
      bullets: [
        "Model end-to-end business processes on the APQC framework",
        "Integrated management system (IMS): ISO 9001, 14001 and 45001",
        "Find bottlenecks, redesign the flow and automate steps with AI",
      ],
      skills: [
        "Process modelling",
        "BPMN",
        "APQC",
        "ISO 9001 / 14001 / 45001 (IMS)",
        "AI automation",
        "Systems thinking",
      ],
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
    github: "https://github.com/Mahdi-rasooli",
    resumeUrl: "/resume.pdf",
  },
  game: {
    title: "Untangle the pipeline",
    intro:
      "This is my job, in miniature. A messy process is a tangle of steps that don't connect. Turn the pipes until the work flows straight from input to output. Three boards, each a little messier.",
    punchline: "Not bad. Imagine what I'd do with your company's processes.",
  },
};

/** True while a value is still a placeholder; used to hide unfinished links. */
export function isPlaceholder(value: string): boolean {
  return value.includes("TODO");
}
