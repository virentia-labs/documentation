---
title: Ссылки
---

# Ссылки

Ссылка — это UI-форма навигации. `Link` рендерит настоящий якорь, чтобы
продолжали работать клавиатура, клик средней кнопкой, «открыть в новой вкладке»
и скринридеры, при этом обычные клики левой кнопкой проходят через `route.open`,
а не через полную перезагрузку страницы.

## Link

```tsx
import { Link } from "@virentia/router-react";

<Link to={profileRoute} params={{ id: 42 }} query={{ tab: "posts" }}>
  Profile
</Link>
```

`Link` строит `href` из зарегистрированного шаблона роута, поэтому якорь
показывает реальный URL. При обычном клике он отменяет навигацию по умолчанию и
вызывает `route.open` с теми же `params`, `query` и `replace`.

```ts
type LinkProps<Params> = {
  to: Route<Params>;
  params: Params; // optional when the route has no params
  query?: Query;
  replace?: boolean;
  children?: ReactNode;
} & AnchorHTMLAttributes<HTMLAnchorElement>; // minus href
```

`params` обязателен на уровне типов только тогда, когда у шаблона роута есть
параметры; роут без параметров его опускает. Любой другой атрибут якоря
(`className`, `target`, `onClick`, `aria-*`, `ref`) пробрасывается в `<a>`.

### Когда клик остается за браузером

`Link` намеренно **не** перехватывает клики, которые пользователь подразумевает
как нативную навигацию. Поведение браузера по умолчанию срабатывает, когда:

- у клика уже выставлен `defaultPrevented` (например, вашим собственным
  `onClick`);
- задан `target`, и он не равен `_self`;
- зажата клавиша-модификатор — <kbd>⌘</kbd>/<kbd>Ctrl</kbd>, <kbd>Shift</kbd>
  или <kbd>Alt</kbd>.

Ваш `onClick` выполняется первым, поэтому ранний выход или вызов
`preventDefault` там подавляет открытие роута, сохраняя при этом якорь.

## useLink

`useLink` возвращает тот же `href` и привязанную команду открытия, не рендеря
якорь. Используйте его, чтобы строить ссылки внутри компонентов дизайн-системы
(стилизованная кнопка, карточка, пункт меню):

```tsx
import { useLink } from "@virentia/router-react";

function ProfileButton() {
  const { path, open } = useLink(profileRoute, { id: 42 }, { tab: "posts" });

  return (
    <Button href={path} onClick={() => open({ params: { id: 42 } })}>
      Profile
    </Button>
  );
}
```

```ts
function useLink<Params extends object | void = void>(
  to: Route<Params>,
  params?: Params,
  query?: Query,
): {
  path: string;
  open: EventCallable<RouteOpenedPayload<Params>>;
};
```

`path` — это собранный URL для заданных params и query; `open` — команда
открытия роута, уже привязанная к роутеру провайдера. `Link` реализован поверх
`useLink` — обращайтесь к хуку только тогда, когда вам нужен элемент, не
являющийся якорем.

Полная семантика команд (`route.open` против `router.navigate`, `replace` и
границы вроде `allSettled`) описана в
[Навигации](/ru/router/core/navigation).
