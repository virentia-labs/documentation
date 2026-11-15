# Refs, actions and lifecycle

A ref is a writable model store. ui is a Core trait supplying mounted/unmounted events; lifecycle belongs to the model, not the ref store.

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

RefUnit aliases the writable store. Ref is the structural DOM writable interface: value, node, writable: true. Only one live element may attach to a ref in an instance. Refs are populated before mounted, cleared after final unmount and excluded from snapshots.

Mounted/unmounted are parent-first. Unmounted runs before DOM removal; async lifecycle work is awaited, then cleanup completes even on error. Never-settling work prevents teardown.

Action creates an event/reaction pair owned by the model. It works before DOM and while retained, and becomes unavailable after disposal.

DOMEventUnit/EventHandlers accept native-payload event/action units or void events, not plain callbacks. EventHandler describes a callback shape but does not make a unit; use action.

Value binding is one-way; model writes from input/change are explicit action/reaction work. See the [learning example](../learn/refs-and-lifetime).
