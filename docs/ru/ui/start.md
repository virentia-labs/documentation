# Одна страница с load/SSR

Start сокращает инфраструктуру нативного приложения до app.tsx, необязательного load.server.ts и Vite-конфига. Это одна страница: файлового или клиентского роутера нет. URL остаётся входом серверного load.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import virentiaStart from "@virentia/ui/start/vite";
export default defineConfig({ plugins: virentiaStart({ title: "My app" }) });
```

Load экспортирует async load({ url, request }) и возвращает JSON-данные. App получает data, создаёт root model или передаёт их в model-backed компонент. Server entry получает отдельный request scope; client entry восстанавливает payload и гидратирует ту же страницу. Модуль load не попадает в клиентскую сборку.

```ts
// load.server.ts
export async function load({ url }: { url: URL }) {
  return { greeting: url.searchParams.get("hello") ?? "Hello" };
}
```

Команда `virentia-start build --root path/to/app` собирает клиент и Node server. `virentia-start serve --root path/to/app` запускает построенную страницу. При programmatic использовании доступны buildStart/createStartServer/serveStart.

Состояние вне JSON не должно попадать в payload. Реальные пути assets берутся из сборки; template не требует ручного server/client manifest. [Полный API](./api/server-start).
