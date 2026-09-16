import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MSP Proposal Generator — Voorstellen maken" },
      {
        name: "description",
        content:
          "Maak, bewerk en download professionele merchant- en partnervoorstellen met tarieven, voorwaarden en ondertekening.",
      },
      { property: "og:title", content: "MSP Proposal Generator" },
      {
        property: "og:description",
        content:
          "Stel in enkele klikken een compleet voorstel samen en download het als PDF.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-background">
      <h1 className="sr-only">MSP Proposal Generator</h1>
      <iframe
        src="/proposal-generator.html"
        title="MSP Proposal Generator"
        className="h-full w-full border-0"
      />
    </main>
  );
}
