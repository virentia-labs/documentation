# Refs, action и lifecycle

Ref — изменяемый стор модели. `ui` — trait Core, добавляющий события mounted/unmounted; lifecycle принадлежит модели, не ref-стору.

```ts
ref<T extends Element = Element>(): StoreWritable<T | null>;
action<P = void>(run: ReactionRun<P>): EventCallable<P>;
action<P = void>(name: string, run: ReactionRun<P>): EventCallable<P>;
interface LifecycleEvent {
  readonly id: string;
  readonly model: InstanceApi;
  readonly props: Readonly<Record<string, unknown>>;
  readonly scope: Scope; // application scope
}
type NativeEvent<T extends EventTarget, E extends Event = Event> =
  Omit<E, "currentTarget"> & { readonly currentTarget: T };
```

`RefUnit<T>` — alias writable стора. `Ref<T>` — структурный writable-интерфейс, нужный DOM-параметру: value, node и writable: true. Один стор может держать только один живой DOM-элемент в экземпляре. Значение задаётся до mounted и обнуляется после финального unmount. Ref-значения не включаются в SSR snapshot.

Mounted идёт parent-first после готовности всех refs. Unmounted идёт parent-first до удаления DOM. Runtime ждёт его reactions, включая async, потом очищает диапазоны и refs. Ошибки не отменяют финальную очистку. Бесконечная реакция блокирует её; заранее обеспечьте завершение ожиданий.

Action создаёт event плюс reaction и сохраняет обычный callable API Core. Его lifetime — модельный: до DOM и при keep он работает. После удаления модели её bound action недоступен.

`DOMEventUnit` и `EventHandlers<T>` принимают event/action units с нативным payload, либо void-события. Обычные callback-функции не являются DOM-handler API. `EventHandler<T,E>` описывает форму нативного callback, но сам по себе не превращает его в unit. Используйте action.

Binding value→DOM односторонний. Input/Change события только сообщают о вводе: изменение стора явно выполняется в реакции/action.

[Учебный пример](../learn/refs-and-lifetime) показывает focus и input без хуков.
