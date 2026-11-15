# One-page load/SSR

Start reduces a native app to app.tsx, optional load.server.ts and a Vite configuration. There is no file or client router; the request URL is loader input.

```ts
import { defineConfig } from "vite";
import virentiaStart from "@virentia/ui/start/vite";
export default defineConfig({ plugins: virentiaStart({ title: "My app" }) });
```

load({ url, request }) returns JSON data. App receives data and creates its root graph or supplies model constructor inputs. Server rendering gets a request scope; client startup restores payload and hydrates the same page. Loader modules stay server-only.

```ts
export async function load({ url }: { url: URL }) {
  return { greeting: url.searchParams.get("hello") ?? "Hello" };
}
```

virentia-start build --root path/to/app builds client and Node entry. serve starts the built page. Programmatic buildStart/createStartServer/serveStart are available. Payloads must remain JSON-compatible; built asset paths are handled by the template.

See [the full API](./api/server-start).
