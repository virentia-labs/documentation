export const walkthroughs = {
  "render": [
    {
      "code": "const increment = action(() => {\n  self.count.value++;\n});\nview: (_props, self) => <button\n  onClick={self.model.increment}\n>Count: {self.model.count}</button>\n// Current state: count = 0; view calls = 1.",
      "en": "The initial view connects count to the button's text.",
      "ru": "Начальная view связывает count с текстом кнопки.",
      "nodes": [
        {
          "id": "action",
          "label": "increment",
          "detail": "ready",
          "detailRu": "событие клика"
        },
        {
          "id": "store",
          "label": "count: 0",
          "detail": "same store",
          "detailRu": "тот же стор"
        },
        {
          "id": "dom",
          "label": "Count: 0",
          "detail": "same button",
          "detailRu": "та же кнопка"
        }
      ],
      "edges": [
        [
          "action",
          "store"
        ],
        [
          "store",
          "dom"
        ]
      ]
    },
    {
      "code": "const increment = action(() => {\n  self.count.value++;\n});\nview: (_props, self) => <button\n  onClick={self.model.increment}\n>Count: {self.model.count}</button>\n// Current state: count = 1; view calls = 1.",
      "en": "The first click changes the store and the same text node.",
      "ru": "Первый клик меняет стор и тот же текстовый узел.",
      "nodes": [
        {
          "id": "action",
          "label": "increment",
          "detail": "invoked by click",
          "detailRu": "событие клика"
        },
        {
          "id": "store",
          "label": "count: 1",
          "detail": "same store",
          "detailRu": "тот же стор"
        },
        {
          "id": "dom",
          "label": "Count: 1",
          "detail": "same button",
          "detailRu": "та же кнопка"
        }
      ],
      "edges": [
        [
          "action",
          "store"
        ],
        [
          "store",
          "dom"
        ]
      ]
    },
    {
      "code": "const increment = action(() => {\n  self.count.value++;\n});\nview: (_props, self) => <button\n  onClick={self.model.increment}\n>Count: {self.model.count}</button>\n// Current state: count = 2; view calls = 1.",
      "en": "Another click follows the same binding; view still has one call.",
      "ru": "Следующий клик проходит по той же привязке; view всё ещё вызвана один раз.",
      "nodes": [
        {
          "id": "action",
          "label": "increment",
          "detail": "invoked by click",
          "detailRu": "событие клика"
        },
        {
          "id": "store",
          "label": "count: 2",
          "detail": "same store",
          "detailRu": "тот же стор"
        },
        {
          "id": "dom",
          "label": "Count: 2",
          "detail": "same button",
          "detailRu": "та же кнопка"
        }
      ],
      "edges": [
        [
          "action",
          "store"
        ],
        [
          "store",
          "dom"
        ]
      ]
    }
  ],
  "ownership": [
    {
      "code": "const board = scoped(appScope, () =>\n  BoardModel.create({\n    id: \"board\",\n    counters: [{ id: \"coffee\", label: \"Coffee\" }],\n  }),\n);",
      "en": "The parent creates its child before any display exists.",
      "ru": "Родитель создаёт ребёнка до появления отображения.",
      "nodes": [
        {
          "id": "board",
          "label": "board",
          "detail": "parent instance",
          "detailRu": "родительский экземпляр"
        },
        {
          "id": "relation",
          "label": "counters",
          "detail": "owned relation",
          "detailRu": "владение детьми"
        },
        {
          "id": "child",
          "label": "coffee",
          "detail": "native child",
          "detailRu": "нативный ребёнок"
        }
      ],
      "edges": [
        [
          "board",
          "relation"
        ],
        [
          "relation",
          "child"
        ]
      ]
    },
    {
      "code": "render(() => <Board model={board} />, container, {\n  scope: appScope,\n});\n// Inside Board.view:\n<For each={self.model.counters} view={Counter} />",
      "en": "Rendering uses those existing instances. Each Counter receives its model.",
      "ru": "Рендер использует созданные экземпляры. Каждый Counter получает свою модель.",
      "nodes": [
        {
          "id": "child",
          "label": "coffee",
          "detail": "existing model",
          "detailRu": "готовая модель"
        },
        {
          "id": "view",
          "label": "Counter",
          "detail": "its display",
          "detailRu": "её отображение"
        },
        {
          "id": "dom",
          "label": "<section>",
          "detail": "its DOM",
          "detailRu": "её DOM"
        }
      ],
      "edges": [
        [
          "child",
          "view"
        ],
        [
          "view",
          "dom"
        ]
      ]
    },
    {
      "code": "await board.counters.remove(\"coffee\");\n// The child model and its display are gone.\n// Other counters are unchanged.",
      "en": "Removing an owned child disposes its model and display together.",
      "ru": "Удаление ребёнка из контейнера завершает его модель вместе с отображением.",
      "nodes": [
        {
          "id": "board",
          "label": "board",
          "detail": "owner",
          "detailRu": "владелец"
        },
        {
          "id": "remove",
          "label": "remove coffee",
          "detail": "dispose child",
          "detailRu": "удалить ребёнка"
        },
        {
          "id": "dom",
          "label": "row removed",
          "detail": "other rows remain",
          "detailRu": "другие строки остаются"
        }
      ],
      "edges": [
        [
          "board",
          "remove"
        ],
        [
          "remove",
          "dom"
        ]
      ]
    }
  ],
  "refs": [
    {
      "code": "setup(self) {\n  const input = ref<HTMLInputElement>();\n  return { input };\n}",
      "en": "Declare a reference store in the model. Its initial value is null.",
      "ru": "Объявляем стор ссылки в модели. Начальное значение — null.",
      "nodes": [
        {
          "id": "model",
          "label": "FieldModel",
          "detail": "unit declaration",
          "detailRu": "объявление юнита"
        },
        {
          "id": "store",
          "label": "input: null",
          "detail": "per-instance value",
          "detailRu": "значение экземпляра"
        }
      ],
      "edges": [
        [
          "model",
          "store"
        ]
      ]
    },
    {
      "code": "view: (_props, self) =>\n  <input ref={self.model.input} />",
      "en": "Attaching the element fills this instance's store.",
      "ru": "Подключение элемента заполняет стор этого экземпляра.",
      "nodes": [
        {
          "id": "dom",
          "label": "<input>",
          "detail": "connected element",
          "detailRu": "подключённый элемент"
        },
        {
          "id": "store",
          "label": "input.value",
          "detail": "that element",
          "detailRu": "этот элемент"
        }
      ],
      "edges": [
        [
          "dom",
          "store"
        ]
      ]
    },
    {
      "code": "// In the model, with: [ui]:\nreaction({\n  on: self.mounted,\n  run: () => input.value?.focus(),\n});",
      "en": "Mounted runs after refs are filled. Focus the element from a model reaction.",
      "ru": "Mounted вызывается после заполнения refs. Реакция модели ставит фокус.",
      "nodes": [
        {
          "id": "event",
          "label": "mounted",
          "detail": "instance event",
          "detailRu": "событие экземпляра"
        },
        {
          "id": "reaction",
          "label": "reaction",
          "detail": "reads input.value",
          "detailRu": "читает input.value"
        },
        {
          "id": "dom",
          "label": "<input>",
          "detail": "focused",
          "detailRu": "в фокусе"
        }
      ],
      "edges": [
        [
          "event",
          "reaction"
        ],
        [
          "reaction",
          "dom"
        ]
      ]
    }
  ],
  "self": [
    {
      "code": "const Chat = component({\n  model: ChatModel,\n  view: (_props, self) => <p>{self.model.title}</p>,\n});",
      "en": "View's self is bound to the native instance, not imported ambient state.",
      "ru": "Self view привязан к нативному экземпляру, а не к импортированному глобальному контексту.",
      "nodes": [
        {
          "id": "model",
          "label": "ChatModel",
          "detail": "definition",
          "detailRu": "определение"
        },
        {
          "id": "instance",
          "label": "chat-1",
          "detail": "instance",
          "detailRu": "экземпляр"
        },
        {
          "id": "self",
          "label": "self.model",
          "detail": "typed bound handle",
          "detailRu": "типизированная ссылка"
        }
      ],
      "edges": [
        [
          "model",
          "instance"
        ],
        [
          "instance",
          "self"
        ]
      ]
    },
    {
      "code": "view: (_props, self) => {\n  const inputId = self.elementId(\"input\");\n  return <input id={inputId} data-chat={self.id} />;\n}",
      "en": "Model ID and named DOM ID have different purposes. elementId also includes the root prefix.",
      "ru": "ID модели и именованный DOM-ID решают разные задачи. ElementId включает также префикс корня.",
      "nodes": [
        {
          "id": "id",
          "label": "self.id",
          "detail": "model identity",
          "detailRu": "идентичность модели"
        },
        {
          "id": "prefix",
          "label": "root prefix",
          "detail": "SSR/client pair",
          "detailRu": "пара SSR/клиент"
        },
        {
          "id": "dom",
          "label": "elementId",
          "detail": "DOM identity",
          "detailRu": "идентичность DOM"
        }
      ],
      "edges": [
        [
          "id",
          "dom"
        ],
        [
          "prefix",
          "dom"
        ]
      ]
    },
    {
      "code": "view: (_props, self) => {\n  const live = self.instances;\n  // Snapshot of same-definition instances in this app scope.\n  // Includes pre-DOM and retained models, not another test.\n  return <p>{self.model.title}</p>;\n}",
      "en": "instances is a snapshot of the current application's live models, not a reactive global registry.",
      "ru": "Instances — снимок живых моделей текущего приложения, не реактивный глобальный реестр.",
      "nodes": [
        {
          "id": "scope",
          "label": "app scope",
          "detail": "isolation boundary",
          "detailRu": "граница изоляции"
        },
        {
          "id": "instances",
          "label": "self.instances",
          "detail": "live snapshot",
          "detailRu": "снимок живых"
        },
        {
          "id": "other",
          "label": "other scope",
          "detail": "not included",
          "detailRu": "не включён"
        }
      ],
      "edges": [
        [
          "scope",
          "instances"
        ]
      ]
    }
  ],
  "testing": [
    {
      "code": "test.concurrent(\"first\", async () => {\n  const appScope = scope();\n  const container = document.createElement(\"div\");\n  const unmount = render(() => <Counter id=\"same\" />, container, { scope: appScope });\n  await unmount();\n});",
      "en": "An ordinary Vitest test creates and passes its own scope. Virentia has no test wrapper.",
      "ru": "Обычный тест Vitest сам создаёт и передаёт scope. У Virentia нет тестовой обёртки.",
      "nodes": [
        {
          "id": "test",
          "label": "test.concurrent",
          "detail": "ordinary Vitest",
          "detailRu": "обычный Vitest"
        },
        {
          "id": "scope",
          "label": "scope()",
          "detail": "created by this test",
          "detailRu": "создан самим тестом"
        },
        {
          "id": "dom",
          "label": "container",
          "detail": "private root",
          "detailRu": "свой корень"
        }
      ],
      "edges": [
        [
          "test",
          "scope"
        ],
        [
          "test",
          "dom"
        ]
      ]
    },
    {
      "code": "test.concurrent.each([\"first\", \"second\"])(\"%s\", async () => {\n  const appScope = scope();\n  const container = document.createElement(\"div\");\n  const unmount = render(() => <Counter id=\"same\" />, container, { scope: appScope });\n  await unmount();\n});",
      "en": "Both test bodies create their own scopes. Shared model declarations and equal IDs do not share state.",
      "ru": "Оба теста создают свои scope. Общее определение модели и одинаковые ID не объединяют значения.",
      "nodes": [
        {
          "id": "type",
          "label": "CounterModel",
          "detail": "shared declaration",
          "detailRu": "общее определение"
        },
        {
          "id": "a",
          "label": "scope A / same",
          "detail": "state A",
          "detailRu": "значения A"
        },
        {
          "id": "b",
          "label": "scope B / same",
          "detail": "state B",
          "detailRu": "значения B"
        }
      ],
      "edges": [
        [
          "type",
          "a"
        ],
        [
          "type",
          "b"
        ]
      ]
    },
    {
      "code": "test.concurrent.each([\"first\", \"second\"])(\"%s\", async () => {\n  const appScope = scope();\n  const container = document.createElement(\"div\");\n  const unmount = render(() => <Counter id=\"same\" />, container, { scope: appScope });\n  try {\n    const counter = collection(Counter.model, appScope).get(\"same\")!;\n    const button = container.querySelector(\"button\");\n    await counter.increment();\n    expect(container.querySelector(\"button\")).toBe(button);\n    expect(button!.textContent).toBe(\"1\");\n  } finally { await unmount(); }\n});",
      "en": "A bound action changes the same button. The test awaits its own unmount, even if an assertion fails.",
      "ru": "Bound-действие меняет тот же button. Тест ждёт своего unmount даже при упавшей проверке.",
      "nodes": [
        {
          "id": "action",
          "label": "increment",
          "detail": "bound unit",
          "detailRu": "bound-юнит"
        },
        {
          "id": "dom",
          "label": "button",
          "detail": "same DOM node",
          "detailRu": "тот же DOM-узел"
        },
        {
          "id": "detach",
          "label": "unmount()",
          "detail": "only this display",
          "detailRu": "только своё отображение"
        }
      ],
      "edges": [
        [
          "action",
          "dom"
        ],
        [
          "detach",
          "dom"
        ]
      ]
    }
  ],
  "component": [
    {
      "code": "import { staticModel } from \"@virentia/core/models\";\nimport { component } from \"@virentia/ui\";\n\nexport const CounterModel = staticModel({});\nexport const Counter = component({\n  model: CounterModel,\n  view: () => <button>Counter</button>,\n});",
      "en": "An empty model and a view create the first button.",
      "ru": "Пустая модель и view создают первую кнопку.",
      "nodes": [
        {
          "id": "model",
          "label": "CounterModel",
          "detail": "no fields yet",
          "detailRu": "пока без полей"
        },
        {
          "id": "view",
          "label": "Counter",
          "detail": "view function",
          "detailRu": "функция view"
        },
        {
          "id": "dom",
          "label": "<button>",
          "detail": "Counter",
          "detailRu": "Counter"
        }
      ],
      "edges": [
        [
          "model",
          "view"
        ],
        [
          "view",
          "dom"
        ]
      ]
    },
    {
      "code": "import { staticModel } from \"@virentia/core/models\";\nimport { component } from \"@virentia/ui\";\n\nexport const CounterModel = staticModel({});\nexport const Counter = component({\n  model: CounterModel,\n  view: () => <button>Clicks</button>,\n});",
      "en": "Change only the markup in view. The button now has a different label.",
      "ru": "Меняем только разметку view. У кнопки новая надпись.",
      "nodes": [
        {
          "id": "model",
          "label": "CounterModel",
          "detail": "unchanged",
          "detailRu": "без изменений"
        },
        {
          "id": "view",
          "label": "Counter",
          "detail": "new label",
          "detailRu": "новая надпись"
        },
        {
          "id": "dom",
          "label": "<button>",
          "detail": "Clicks",
          "detailRu": "Clicks"
        }
      ],
      "edges": [
        [
          "model",
          "view"
        ],
        [
          "view",
          "dom"
        ]
      ]
    }
  ],
  "state": [
    {
      "code": "export const CounterModel = staticModel({\n  data: { count: f.number(0) },\n});",
      "en": "Add a numeric field with an initial value of zero.",
      "ru": "Добавляем числовое поле с начальным значением 0.",
      "nodes": [
        {
          "id": "field",
          "label": "f.number(0)",
          "detail": "field declaration",
          "detailRu": "описание поля"
        },
        {
          "id": "store",
          "label": "count",
          "detail": "store on the instance",
          "detailRu": "стор экземпляра"
        }
      ],
      "edges": [
        [
          "field",
          "store"
        ]
      ]
    },
    {
      "code": "export const CounterModel = staticModel({\n  data: { count: f.number(0) },\n});\nexport const Counter = component({\n  model: CounterModel,\n  view: (_props, self) =>\n    <button>{self.model.count}</button>,\n});",
      "en": "Pass the count store to JSX to bind the text.",
      "ru": "Передаём стор count в JSX, чтобы связать его с текстом.",
      "nodes": [
        {
          "id": "store",
          "label": "count",
          "detail": "value: 0",
          "detailRu": "значение: 0"
        },
        {
          "id": "binding",
          "label": "text binding",
          "detail": "listens to count",
          "detailRu": "слушает count"
        },
        {
          "id": "dom",
          "label": "<button>",
          "detail": "0",
          "detailRu": "0"
        }
      ],
      "edges": [
        [
          "store",
          "binding"
        ],
        [
          "binding",
          "dom"
        ]
      ]
    }
  ],
  "events": [
    {
      "code": "setup(self) {\n  const increment = action(() => {\n    self.count.value++;\n  });\n  return { increment };\n}",
      "en": "Declare increment in CounterModel.setup and return it.",
      "ru": "Объявляем increment в setup модели CounterModel и возвращаем его.",
      "nodes": [
        {
          "id": "action",
          "label": "increment",
          "detail": "event + reaction",
          "detailRu": "событие + реакция"
        },
        {
          "id": "store",
          "label": "count",
          "detail": "changes by one",
          "detailRu": "увеличивается на 1"
        }
      ],
      "edges": [
        [
          "action",
          "store"
        ]
      ]
    },
    {
      "code": "setup(self) {\n  const increment = action(() => {\n    self.count.value++;\n  });\n  return { increment };\n}\nview: (_props, self) => <button\n  onClick={self.model.increment}\n>{self.model.count}</button>",
      "en": "Connect the native click to the model action.",
      "ru": "Подключаем клик к действию модели.",
      "nodes": [
        {
          "id": "click",
          "label": "click",
          "detail": "button event",
          "detailRu": "событие кнопки"
        },
        {
          "id": "action",
          "label": "increment",
          "detail": "model action",
          "detailRu": "действие модели"
        },
        {
          "id": "store",
          "label": "count",
          "detail": "updated value",
          "detailRu": "новое значение"
        }
      ],
      "edges": [
        [
          "click",
          "action"
        ],
        [
          "action",
          "store"
        ]
      ]
    },
    {
      "code": "const increment = action(() => {\n  self.count.value++;\n});\n// After a click: count is 1.\nview: (_props, self) => <button\n  onClick={self.model.increment}\n>{self.model.count}</button>",
      "en": "A click changes count to 1. The existing button gets the new text; view does not run again.",
      "ru": "Клик меняет count на 1. Новое число записывается в ту же кнопку; view не повторяется.",
      "nodes": [
        {
          "id": "action",
          "label": "increment",
          "detail": "ran once",
          "detailRu": "выполнилось один раз"
        },
        {
          "id": "store",
          "label": "count: 1",
          "detail": "same store",
          "detailRu": "тот же стор"
        },
        {
          "id": "dom",
          "label": "<button>1",
          "detail": "same element",
          "detailRu": "тот же элемент"
        }
      ],
      "edges": [
        [
          "action",
          "store"
        ],
        [
          "store",
          "dom"
        ]
      ]
    }
  ],
  "derived": [
    {
      "code": "setup(self) {\n  const increment = action(() => { self.count.value++; });\n  const doubled = computed(() => self.count.value * 2);\n  return { increment, doubled };\n}",
      "en": "The computation reads count; Core tracks that dependency.",
      "ru": "Вычисление читает count; Core отслеживает эту зависимость.",
      "nodes": [
        {
          "id": "store",
          "label": "count",
          "detail": "source value",
          "detailRu": "исходное значение"
        },
        {
          "id": "derived",
          "label": "doubled",
          "detail": "count × 2",
          "detailRu": "count × 2"
        }
      ],
      "edges": [
        [
          "store",
          "derived"
        ]
      ]
    },
    {
      "code": "view: (_props, self) => <section>\n  <button onClick={self.model.increment}>\n    Count: {self.model.count}\n  </button>\n  <output>Doubled: {self.model.doubled}</output>\n</section>",
      "en": "Bind the computed store to a second text. Both values follow one increment.",
      "ru": "Связываем computed со вторым текстом. Оба значения меняются от одного increment.",
      "nodes": [
        {
          "id": "store",
          "label": "count: 1",
          "detail": "button text",
          "detailRu": "текст кнопки"
        },
        {
          "id": "derived",
          "label": "doubled: 2",
          "detail": "derived store",
          "detailRu": "вычисляемый стор"
        },
        {
          "id": "dom",
          "label": "<output>2",
          "detail": "output text",
          "detailRu": "текст результата"
        }
      ],
      "edges": [
        [
          "store",
          "derived"
        ],
        [
          "derived",
          "dom"
        ]
      ]
    }
  ],
  "props": [
    {
      "code": "export const CounterModel = staticModel({\n  data: {\n    count: f.number(0),\n    label: f.string(\"Counter\"),\n  },\n  // setup is unchanged\n});",
      "en": "Add label to the model's inputs. Keep the existing setup.",
      "ru": "Добавляем label во входные данные модели. Setup остаётся прежним.",
      "nodes": [
        {
          "id": "input",
          "label": "label",
          "detail": "constructor input",
          "detailRu": "входное значение"
        },
        {
          "id": "model",
          "label": "CounterModel",
          "detail": "label store",
          "detailRu": "стор label"
        }
      ],
      "edges": [
        [
          "input",
          "model"
        ]
      ]
    },
    {
      "code": "view: (_props, self) => <section>\n  <h2>{self.model.label}</h2>\n  <button onClick={self.model.increment}>\n    Count: {self.model.count}\n  </button>\n  <output>Doubled: {self.model.doubled}</output>\n</section>\n\n// In main:\n<Counter label=\"Coffee\" count={2} />\n<Counter label=\"Tea\" count={5} />",
      "en": "One definition creates independent instances with different input values.",
      "ru": "Одно определение создаёт независимые экземпляры с разными входами.",
      "nodes": [
        {
          "id": "model",
          "label": "CounterModel",
          "detail": "shared definition",
          "detailRu": "общее определение"
        },
        {
          "id": "coffee",
          "label": "Coffee: 2",
          "detail": "first instance",
          "detailRu": "первый экземпляр"
        },
        {
          "id": "tea",
          "label": "Tea: 5",
          "detail": "second instance",
          "detailRu": "второй экземпляр"
        }
      ],
      "edges": [
        [
          "model",
          "coffee"
        ],
        [
          "model",
          "tea"
        ]
      ]
    }
  ],
  "condition": [
    {
      "code": "view(_props, self) {\n  const counter = self.model;\n  function details() {\n    if (!counter.expanded.value) return null;\n    return <output>Doubled: {counter.doubled}</output>;\n  }\n  return <section>\n    <h2>{counter.label}</h2>\n    <button onClick={counter.increment}>Count: {counter.count}</button>\n    <button onClick={counter.toggle}>Details</button>\n    {details}\n  </section>;\n}",
      "en": "Pass the details function to JSX. It reads expanded and chooses the output.",
      "ru": "Передаём функцию details в JSX. Она читает expanded и выбирает, показать ли output.",
      "nodes": [
        {
          "id": "state",
          "label": "expanded: true",
          "detail": "show details",
          "detailRu": "показать подробности"
        },
        {
          "id": "fragment",
          "label": "details()",
          "detail": "reads expanded",
          "detailRu": "читает expanded"
        },
        {
          "id": "output",
          "label": "<output>",
          "detail": "current doubled value",
          "detailRu": "текущее удвоение"
        }
      ],
      "edges": [
        [
          "state",
          "fragment"
        ],
        [
          "fragment",
          "output"
        ]
      ]
    },
    {
      "code": "// expanded is now false\nview(_props, self) {\n  const counter = self.model;\n  function details() {\n    if (!counter.expanded.value) return null;\n    return <output>Doubled: {counter.doubled}</output>;\n  }\n  return <section>\n    <h2>{counter.label}</h2>\n    <button onClick={counter.increment}>Count: {counter.count}</button>\n    <button onClick={counter.toggle}>Details</button>\n    {details}\n  </section>;\n}",
      "en": "When expanded becomes false, only the output range is removed. The counter button and model stay.",
      "ru": "Когда expanded становится false, удаляется только диапазон output. Кнопка и модель счётчика остаются.",
      "nodes": [
        {
          "id": "state",
          "label": "expanded: false",
          "detail": "hide details",
          "detailRu": "скрыть подробности"
        },
        {
          "id": "fragment",
          "label": "details()",
          "detail": "returns null",
          "detailRu": "возвращает null"
        },
        {
          "id": "output",
          "label": "empty range",
          "detail": "button remains",
          "detailRu": "кнопка остаётся"
        }
      ],
      "edges": [
        [
          "state",
          "fragment"
        ],
        [
          "fragment",
          "output"
        ]
      ]
    }
  ],
  "list": [
    {
      "code": "import { children, staticModel } from \"@virentia/core/models\";\nimport { action, component, For } from \"@virentia/ui\";\nimport { Counter, CounterModel } from \"./Counter\";\n\nexport const BoardModel = staticModel({\n  data: { counters: children.many(CounterModel) },\n});\nexport const Board = component({\n  model: BoardModel,\n  view: (_props, self) =>\n    <For each={self.model.counters} view={Counter} />,\n});",
      "en": "The board owns the collection. For passes each ready instance to Counter.",
      "ru": "Доска владеет коллекцией. For передаёт каждый готовый экземпляр в Counter.",
      "nodes": [
        {
          "id": "board",
          "label": "BoardModel",
          "detail": "parent model",
          "detailRu": "родительская модель"
        },
        {
          "id": "items",
          "label": "counters",
          "detail": "child container",
          "detailRu": "контейнер детей"
        },
        {
          "id": "rows",
          "label": "Counter × 2",
          "detail": "two displays",
          "detailRu": "два отображения"
        }
      ],
      "edges": [
        [
          "board",
          "items"
        ],
        [
          "items",
          "rows"
        ]
      ]
    },
    {
      "code": "// In BoardModel.setup:\nconst add = action(() => {\n  self.counters.add({ label: \"New counter\" });\n});\nreturn { add };\n\n// In Board.view:\n<button onClick={self.model.add}>Add counter</button>\n<For each={self.model.counters} view={Counter} />",
      "en": "Adding a child creates one new row. Existing counters keep their values and DOM.",
      "ru": "Добавление ребёнка создаёт одну строку. Прежние счётчики сохраняют значения и DOM.",
      "nodes": [
        {
          "id": "add",
          "label": "add",
          "detail": "model action",
          "detailRu": "действие модели"
        },
        {
          "id": "items",
          "label": "counters + 1",
          "detail": "insert operation",
          "detailRu": "операция добавления"
        },
        {
          "id": "rows",
          "label": "Counter × 3",
          "detail": "one new display",
          "detailRu": "одно новое отображение"
        }
      ],
      "edges": [
        [
          "add",
          "items"
        ],
        [
          "items",
          "rows"
        ]
      ]
    },
    {
      "code": "const removeLast = action(() => {\n  const items = self.counters.items;\n  const last = items[items.length - 1];\n  if (last) return self.counters.remove(last);\n});\nreturn { add, removeLast };",
      "en": "Removing the last child disposes that model and its row, not the other counters.",
      "ru": "Удаление последнего ребёнка завершает его модель и строку, не затрагивая остальные счётчики.",
      "nodes": [
        {
          "id": "remove",
          "label": "removeLast",
          "detail": "model action",
          "detailRu": "действие модели"
        },
        {
          "id": "items",
          "label": "counters − 1",
          "detail": "remove operation",
          "detailRu": "операция удаления"
        },
        {
          "id": "rows",
          "label": "Counter × 2",
          "detail": "remaining displays",
          "detailRu": "оставшиеся отображения"
        }
      ],
      "edges": [
        [
          "remove",
          "items"
        ],
        [
          "items",
          "rows"
        ]
      ]
    }
  ]
};
