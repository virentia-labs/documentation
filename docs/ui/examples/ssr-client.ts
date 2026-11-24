import { hydratePage } from "@virentia/ui/start";
import { pageView, type PageData } from "./ssr-app";
export function hydrateBoard(container: Element, payloadText: string) {
  return hydratePage<PageData>(pageView, container, payloadText);
}
