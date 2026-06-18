# Кешированные модели

Используйте кеш моделей, когда размонтирование компонента не должно уничтожать его модель.

Это полезно для чатов, вкладок редактора, медиаплееров, превью и экранов деталей, которые должны открываться с прежним состоянием. Кеш — это еще и решение о времени жизни: модель останется в памяти, пока вы не удалите ее или не очистите кеш.

## Ключ модели

Кешированные модели хранятся по ключу внутри scope. Для чата ключом может быть `chatId`. Для вкладок редактора — id документа. Ключ должен описывать то, к чему пользователь ожидает вернуться.

```ts
import { component, createModelCache } from "@virentia/vue";

const chatCache = createModelCache<string, Props, ChatModel>();

export const ChatPanel = component({
  cache: chatCache,
  key: (props: Props) => props.chatId,
  model: createChatModel,
  view: ChatPanelView,
});
```

Когда `ChatPanel` размонтируется, кешированная модель остается живой. Когда тот же ключ снова появляется в том же scope, Vue получает существующую модель вместо создания новой.

Кешировать можно и через `useModel`, передав `{ cache, key }`:

```ts
const model = useModel(createChatModel, () => props, {
  cache: chatCache,
  key: props.chatId,
});
```

## Логика загрузки в модели

Модель может использовать `mounted`, чтобы загрузить данные при первом появлении:

```ts
import { effect, reaction, store } from "@virentia/core";
import type { ModelContext } from "@virentia/vue";

function createChatModel({ key, mounted }: ModelContext<Props, string>) {
  const messages = store({ items: [] as string[] });
  const loadFx = effect(async (chatId: string) => [`loaded:${chatId}`]);

  reaction({
    on: mounted,
    run() {
      void loadFx(key);
    },
  });

  return { loading: loadFx.pending, messages };
}
```

Для кешированных моделей хорошо подумайте, должна ли `mounted` перезагружать данные каждый раз при возврате view или только при первом создании модели. Если перезагрузки дорогие, держите дополнительный стор вроде `loaded` и защищайте им реакцию.

## Удаляйте осознанно

Кеширование меняет память на непрерывность. Удаляйте модель, когда пользователь окончательно закрывает чат, вкладку, плеер или превью.

```ts
chatCache.delete("support", appScope);
chatCache.clear(appScope);
```

Удаление кешированной модели очищает ее owner, поэтому реакции и cleanup, зарегистрированные внутри модели, тоже отсоединяются.
