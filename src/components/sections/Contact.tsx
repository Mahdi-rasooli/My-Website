import { profile, isPlaceholder } from "@/content/profile";
import Fill from "./Fill";

function ContactLink({ href, label, primary = false }: { href: string; label: string; primary?: boolean }) {
  const base = primary
    ? "bg-amber px-6 py-3.5 font-semibold text-bg-deep hover:shadow-[0_0_32px_-4px_var(--amber)]"
    : "border border-cyan/35 px-5 py-3.5 text-line hover:border-cyan hover:text-cyan";
  if (isPlaceholder(href)) {
    return (
      <span className="border border-dashed border-amber/40 px-5 py-3.5 text-amber/70" title="Add this link in src/content/profile.ts">
        {label}
      </span>
    );
  }
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className={`transition-[box-shadow,color,border-color] ${base}`}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {label}
    </a>
  );
}

export default function Contact() {
  const { links } = profile;
  return (
    <section
      data-stop={6}
      className="flex min-h-svh flex-col items-center justify-end px-5 pb-12 text-center md:pb-16"
    >
      <p className="font-mono text-xs text-cyan">output</p>
      <h2 className="mt-5 max-w-[16ch] text-[clamp(2.5rem,6vw,5rem)] leading-[0.95] font-extrabold [font-variation-settings:'wdth'_118]">
        Got a messy process? Let&apos;s talk.
      </h2>
      <p className="mt-5 max-w-[46ch] text-line/80">
        I&apos;m open to roles and projects in AI process optimization, machine learning and web development.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <ContactLink href={isPlaceholder(links.email) ? links.email : `mailto:${links.email}`} label="Email me" primary />
        <ContactLink href={links.linkedin} label="LinkedIn" />
        <ContactLink href={links.github} label="GitHub" />
        <a
          href={links.resumeUrl}
          download="Mahdi-Rasouli-Resume.pdf"
          className="border border-cyan/35 px-5 py-3.5 text-line transition-colors hover:border-cyan hover:text-cyan"
        >
          Download résumé (PDF)
        </a>
      </div>

      <footer className="mt-20 text-xs text-muted">
        © {new Date().getFullYear()} {profile.name}. <Fill text={profile.location} />. Built with Next.js and three.js.
      </footer>
    </section>
  );
}
