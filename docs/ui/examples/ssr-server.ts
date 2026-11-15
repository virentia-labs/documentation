import { renderDocument, renderPage } from "@virentia/ui/start";
import { pageView, type PageData } from "./ssr-app";
export function renderRequest(data: PageData, clientEntryUrl: string): string {
  const page = renderPage(pageView, data, { identifierPrefix: "task-board" });
  return renderDocument(page, { title: data.title, clientEntryUrl });
}
