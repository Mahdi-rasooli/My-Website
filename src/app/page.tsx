import ScrollDriver from "@/components/ScrollDriver";
import SceneLayer from "@/components/scene/SceneLayer";
import Boot from "@/components/sections/Boot";
import Hero from "@/components/sections/Hero";
import Journey from "@/components/sections/Journey";
import Contact from "@/components/sections/Contact";
import ProcessRail from "@/components/sections/ProcessRail";

export default function Home() {
  return (
    <>
      <ScrollDriver />
      <SceneLayer />
      <Boot />
      <ProcessRail />
      <main className="relative z-10">
        <Hero />
        <Journey />
        <section data-stop={5} className="min-h-svh" aria-label="Mini-game" />
        <Contact />
      </main>
    </>
  );
}
