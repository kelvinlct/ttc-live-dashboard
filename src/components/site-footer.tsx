export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>Predictions are estimates and can change as vehicles move.</p>
        <p>
          Data © Toronto Transit Commission. Not an official TTC app.{" "}
          <a className="underline" href="https://retro.umoiq.com/xmlFeedDocs/NextBusXMLFeed.pdf">
            Feed notes
          </a>
        </p>
      </div>
    </footer>
  );
}
