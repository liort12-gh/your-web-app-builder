import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign/$token")({
  head: () => ({
    meta: [
      { title: "Voorstel bekijken en ondertekenen" },
      {
        name: "description",
        content:
          "Bekijk het voorstel, vul uw bedrijfs- en contactgegevens in en onderteken digitaal.",
      },
      { property: "og:title", content: "Voorstel bekijken en ondertekenen" },
      {
        property: "og:description",
        content: "Neem het voorstel door en onderteken direct online.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignPage,
});

function SignPage() {
  const { token } = Route.useParams();

  return (
    <main className="h-screen w-screen overflow-hidden bg-background">
      <h1 className="sr-only">Voorstel ondertekenen</h1>
      <iframe
        src={`/proposal-generator.html?sign=${encodeURIComponent(token)}`}
        title="Voorstel ondertekenen"
        className="h-full w-full border-0"
      />
    </main>
  );
}
