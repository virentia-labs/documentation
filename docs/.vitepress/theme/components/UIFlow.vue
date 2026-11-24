<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";
const props = defineProps<{ kind: "render" | "scope" | "lifecycle" | "ssr" }>();
const { lang } = useData();
const ru = computed(() => lang.value.startsWith("ru"));
const definitions = {
  "render": {
    "title": [
      "Three update paths, no tree diff",
      "Три пути обновления, без сравнения деревьев"
    ],
    "description": [
      "Model units drive DOM bindings or explicit structural ranges.",
      "Юниты модели управляют привязками DOM или явными структурными диапазонами."
    ],
    "boundary": [
      "View runs once per attachment. No reactive code compiler.",
      "View вызывается один раз на подключение. Реактивного компилятора нет."
    ],
    "paths": [
      {
        "title": [
          "Scalar",
          "Значение"
        ],
        "steps": [
          [
            "count",
            "store write",
            "запись стора",
            "reactive"
          ],
          [
            "binding",
            "Core reaction",
            "реакция Core",
            "reactive"
          ],
          [
            "Text.data",
            "same DOM node",
            "тот же DOM-узел",
            "dom"
          ]
        ],
        "explanation": [
          "The store updates one existing text node; view is not executed again.",
          "Стор обновляет один существующий текстовый узел; view не запускается снова."
        ]
      },
      {
        "title": [
          "Conditional structure",
          "Условная структура"
        ],
        "steps": [
          [
            "open",
            "true / false",
            "true / false",
            "reactive"
          ],
          [
            "editor()",
            "ordinary if",
            "обычный if",
            "setup"
          ],
          [
            "DOM range",
            "remove old; build new",
            "удалить старый; создать новый",
            "dom"
          ]
        ],
        "explanation": [
          "Only the explicit fragment reruns. Its range is recreated, even if tags match. Other ranges are untouched.",
          "Повторяется только явный участок. Его диапазон пересоздаётся даже при одинаковых тегах. Остальные диапазоны не затрагиваются."
        ]
      },
      {
        "title": [
          "List operation",
          "Операция списка"
        ],
        "steps": [
          [
            "container",
            "insert/remove/move",
            "insert/remove/move",
            "reactive"
          ],
          [
            "For",
            "apply source edit",
            "исполнить операцию",
            "setup"
          ],
          [
            "row ranges",
            "preserve unaffected rows",
            "сохранить незатронутые строки",
            "dom"
          ]
        ],
        "explanation": [
          "The source supplies the edit. For does not match old/new row snapshots.",
          "Операцию задаёт источник. For не сопоставляет старый и новый снимки строк."
        ]
      }
    ]
  },
  "scope": {
    "title": [
      "A shared definition is not shared state",
      "Общее определение — не общие значения"
    ],
    "description": [
      "App scope owns model collections and unit values.",
      "Scope приложения хранит коллекции и значения юнитов."
    ],
    "boundary": [
      "Explicit scopes; one native instance per definition + ID.",
      "Явные scope; один нативный экземпляр на определение + ID."
    ],
    "paths": [
      {
        "title": [
          "Application A",
          "Приложение A"
        ],
        "steps": [
          [
            "scope A",
            "test/request A",
            "тест/запрос A",
            "setup"
          ],
          [
            "Editor / same",
            "state A",
            "значения A",
            "reactive"
          ],
          [
            "input A",
            "ref A",
            "ref A",
            "dom"
          ]
        ],
        "explanation": [
          "Same-ID instances in another application cannot change this model's values or DOM refs.",
          "Экземпляр с таким же ID в другом приложении не меняет значения этой модели и её DOM-refs."
        ]
      },
      {
        "title": [
          "Application B",
          "Приложение B"
        ],
        "steps": [
          [
            "scope B",
            "independent test/request",
            "отдельный тест/запрос",
            "setup"
          ],
          [
            "Editor / same",
            "state B",
            "значения B",
            "reactive"
          ],
          [
            "input B",
            "ref B",
            "ref B",
            "dom"
          ]
        ],
        "explanation": [
          "The static unit declarations are shared; their instance values and bindings are not.",
          "Декларации static-юнитов общие; значения экземпляров и привязки — разные."
        ]
      }
    ]
  },
  "lifecycle": {
    "title": [
      "Model lifetime and DOM attachment differ",
      "Жизнь модели и подключение DOM различаются"
    ],
    "description": [
      "Lifecycle events are native model units, not hooks or ref callbacks.",
      "Lifecycle-события — нативные юниты модели, не хуки и не ref-callbacks."
    ],
    "boundary": [
      "with: [ui] supplies mounted/unmounted. Ref is a writable store.",
      "With: [ui] даёт mounted/unmounted. Ref — writable стор."
    ],
    "paths": [
      {
        "title": [
          "Mount",
          "Монтирование"
        ],
        "steps": [
          [
            "DOM",
            "complete connected tree",
            "полное подключённое дерево",
            "dom"
          ],
          [
            "refs",
            "write elements",
            "записать элементы",
            "reactive"
          ],
          [
            "mounted",
            "parent-first",
            "родитель первым",
            "setup"
          ]
        ],
        "explanation": [
          "All refs exist before the parent and child mounted reactions run.",
          "Все refs готовы до mounted-реакций родителя и детей."
        ]
      },
      {
        "title": [
          "Unmount",
          "Размонтирование"
        ],
        "steps": [
          [
            "unmounted",
            "parent-first",
            "родитель первым",
            "setup"
          ],
          [
            "await reactions",
            "DOM/refs remain usable",
            "DOM/refs ещё доступны",
            "reactive"
          ],
          [
            "teardown",
            "remove DOM; refs null",
            "удалить DOM; refs null",
            "dom"
          ]
        ],
        "explanation": [
          "Standalone waits lifecycle before physical teardown. Supplied/kept models survive display removal; deleting a model awaits the same phase.",
          "Standalone ждёт lifecycle до физического удаления. Переданные/сохранённые модели переживают скрытие; удаление модели ждёт ту же фазу."
        ]
      }
    ]
  },
  "ssr": {
    "title": [
      "HTML and snapshot travel together",
      "HTML и snapshot передаются вместе"
    ],
    "description": [
      "Restore before model creation and hydration.",
      "Восстановление — до создания моделей и гидратации."
    ],
    "boundary": [
      "Stable SIDs/model names and matching identifierPrefix. JSON state only.",
      "Стабильные SID/имена моделей и одинаковый identifierPrefix. Только JSON-state."
    ],
    "paths": [
      {
        "title": [
          "Server request",
          "Серверный запрос"
        ],
        "steps": [
          [
            "request scope",
            "create graph from load data",
            "создать граф из load-данных",
            "setup"
          ],
          [
            "render",
            "HTML with boundaries",
            "HTML с границами",
            "dom"
          ],
          [
            "serialize",
            "SID values + ID manifest",
            "SID-значения + manifest ID",
            "reactive"
          ]
        ],
        "explanation": [
          "Snapshot after rendering includes materialized writable stores. No DOM lifecycle or refs are transferred.",
          "Snapshot после рендера включает materialized writable-сторы. DOM-lifecycle и refs не переносятся."
        ]
      },
      {
        "title": [
          "Client",
          "Клиент"
        ],
        "steps": [
          [
            "scope(snapshot)",
            "restore values and IDs",
            "восстановить значения и ID",
            "setup"
          ],
          [
            "bootstrap",
            "recreate model membership",
            "создать состав моделей",
            "reactive"
          ],
          [
            "hydrate",
            "adopt existing DOM",
            "подключить существующий DOM",
            "dom"
          ]
        ],
        "explanation": [
          "The manifest preserves identity, not complete dormant collection membership. Build the same graph from load data before adopting matching nodes.",
          "Manifest сохраняет identity, не полный состав отложенных коллекций. Создайте тот же граф из load-данных до подключения совпадающих узлов."
        ]
      }
    ]
  }
};
const diagram = computed(() => {
  const source = definitions[props.kind];
  const t = (value: string[]) => value[ru.value ? 1 : 0];
  return {
    title: t(source.title), description: t(source.description), boundary: t(source.boundary),
    paths: source.paths.map(path => ({
      title: t(path.title), explanation: t(path.explanation),
      steps: path.steps.map(step => ({ title: step[0], detail: step[ru.value ? 2 : 1], tone: step[3], edge: "" })),
    })),
  };
});
const textLabel = computed(() => ru.value ? "Текстовое описание схемы" : "Read this diagram as text");
</script>
<template>
  <figure class="ui-flow">
    <figcaption>
      <strong>{{ diagram.title }}</strong>
      <p>{{ diagram.description }}</p>
    </figcaption>
    <p class="ui-flow__boundary">{{ diagram.boundary }}</p>
    <div class="ui-flow__paths" aria-hidden="true">
      <div v-for="path in diagram.paths" :key="path.title" class="ui-flow__path">
        <p class="ui-flow__path-title">{{ path.title }}</p>
        <div class="ui-flow__chain">
          <template v-for="(step, index) in path.steps" :key="step.title">
            <div class="ui-flow__node" :class="`ui-flow__node--${step.tone ?? 'setup'}`">
              <strong>{{ step.title }}</strong>
              <span>{{ step.detail }}</span>
            </div>
            <div v-if="index < path.steps.length - 1" class="ui-flow__edge">
              <span>{{ step.edge }}</span>
              <span class="ui-flow__arrow"></span>
            </div>
          </template>
        </div>
      </div>
    </div>
    <details class="ui-flow__text">
      <summary>{{ textLabel }}</summary>
      <ol>
        <li v-for="path in diagram.paths" :key="path.title">
          <strong>{{ path.title }}.</strong> {{ path.explanation }}
        </li>
      </ol>
    </details>
  </figure>
</template>

<style scoped>
.ui-flow {
  container-type: inline-size;
  margin: 24px 0;
  padding: 22px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}
.ui-flow figcaption > strong {
  font-size: 17px;
  line-height: 1.45;
}
.ui-flow figcaption p {
  margin: 6px 0 14px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.6;
}
.ui-flow__boundary {
  margin: 0 0 20px;
  padding: 10px 12px;
  border-inline-start: 3px solid var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  font-size: 15px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.ui-flow__paths {
  display: grid;
  gap: 20px;
}
.ui-flow__path-title {
  margin: 0 0 9px;
  color: var(--vp-c-text-2);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
}
.ui-flow__chain {
  display: flex;
  align-items: stretch;
}
.ui-flow__node {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--vp-c-divider);
  border-top: 3px solid var(--vp-c-text-3);
  border-radius: 8px;
  background: var(--vp-c-bg);
  overflow-wrap: anywhere;
}
.ui-flow__node--reactive {
  border-top-color: var(--vp-c-brand-1);
}
.ui-flow__node--dom {
  border-top-color: var(--vp-c-green-1, #308464);
}
.ui-flow__node strong {
  font-size: 15px;
  line-height: 1.5;
}
.ui-flow__node span {
  color: var(--vp-c-text-2);
  font-size: 15px;
  line-height: 1.5;
}
.ui-flow__edge {
  display: flex;
  flex: 0 0 90px;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 0 4px;
  color: var(--vp-c-text-2);
  text-align: center;
  font-size: 14px;
  line-height: 1.4;
  overflow-wrap: normal;
}
.ui-flow__arrow::after {
  content: "→";
  font-size: 24px;
  line-height: 1;
}
.ui-flow__text {
  margin-top: 18px;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 12px;
  font-size: 15px;
  line-height: 1.7;
}
.ui-flow__text summary {
  cursor: pointer;
  color: var(--vp-c-brand-1);
}
.ui-flow__text summary:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 4px;
  border-radius: 2px;
}
.ui-flow__text ol {
  margin: 12px 0 0;
  padding-left: 22px;
}
.ui-flow__text li + li {
  margin-top: 10px;
}
@container (max-width: 530px) {
  .ui-flow__chain {
    flex-direction: column;
  }
  .ui-flow__edge {
    flex: none;
    min-height: 54px;
    padding: 6px 0;
  }
  .ui-flow__arrow::after {
    content: "↓";
  }
}
@media (max-width: 540px) {
  .ui-flow {
    padding: 14px;
  }
  .ui-flow__chain {
    flex-direction: column;
  }
  .ui-flow__edge {
    flex: none;
    min-height: 54px;
    padding: 6px 0;
  }
  .ui-flow__arrow::after {
    content: "↓";
  }
}
@media print {
  .ui-flow {
    break-inside: avoid;
  }
}
</style>
