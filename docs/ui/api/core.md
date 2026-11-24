# Core re-exports

UI uses the same Core graph. store/reactive/computed/event/effect/reaction/scope/scoped are re-exported unchanged; there is no second signal system.

Declare state and display computeds in native models. View reads ready units. Use reaction for side effects; action only abbreviates event + reaction.

Import Core types such as Scope/StoreWritable/EventCallable separately. Models/containers come from Core/models, mutableStore from Mutable.

Direct Virentia unit awaits restore caller context; arbitrary native awaits do not. Concrete instance facades remain bound references after external awaits. Do not read contextual static-model self after fetch without an explicit scope frame.
