import type { DefaultTheme } from "vitepress";

export type LocaleKey = "en" | "ru";

export interface SectionNavLink {
  text: string;
  link: string;
}

export type SectionNavItem = SectionNavLink | { text: string; items: SectionNavLink[] };

export interface DocsSection {
  id: string;
  label: Record<LocaleKey, string>;
  link: Record<LocaleKey, string>;
  match: Record<LocaleKey, string[]>;
  nav: Record<LocaleKey, SectionNavItem[]>;
}

const guideEn: DefaultTheme.SidebarItem[] = [
  {
    text: "Guide",
    items: [
      { text: "Getting started", link: "/guide/getting-started" },
      { text: "Ideology", link: "/guide/ideology" },
      { text: "Internals", link: "/guide/deep-knowledge" },
    ],
  },
];

const guideRu: DefaultTheme.SidebarItem[] = [
  {
    text: "Руководство",
    items: [
      { text: "Начало работы", link: "/ru/guide/getting-started" },
      { text: "Идеология", link: "/ru/guide/ideology" },
      { text: "Внутреннее устройство", link: "/ru/guide/deep-knowledge" },
    ],
  },
];

const coreEn: DefaultTheme.SidebarItem[] = [
  {
    text: "Core",
    items: [
      { text: "Overview", link: "/core/" },
      { text: "Units", link: "/core/units" },
      { text: "Stores", link: "/core/stores" },
      { text: "Events", link: "/core/events" },
      { text: "Effects", link: "/core/effects" },
      { text: "Reactions", link: "/core/reactions" },
      { text: "Transactions", link: "/core/transactions" },
      { text: "Lazy models", link: "/core/lazy-models" },
      { text: "Scopes", link: "/core/scopes" },
      { text: "Scope loss", link: "/core/scope-loss" },
      { text: "Source-stable SIDs", link: "/core/compiler" },
      { text: "Dependencies", link: "/core/dependencies" },
      { text: "Owners and cleanup", link: "/core/owners" },
      { text: "Low-level kernel", link: "/core/kernel" },
    ],
  },
];

const coreRu: DefaultTheme.SidebarItem[] = [
  {
    text: "Ядро",
    items: [
      { text: "Обзор", link: "/ru/core/" },
      { text: "Юниты в ядре", link: "/ru/core/units" },
      { text: "Сторы", link: "/ru/core/stores" },
      { text: "События", link: "/ru/core/events" },
      { text: "Эффекты", link: "/ru/core/effects" },
      { text: "Реакции", link: "/ru/core/reactions" },
      { text: "Транзакции", link: "/ru/core/transactions" },
      { text: "Ленивые модели", link: "/ru/core/lazy-models" },
      { text: "Скоупы", link: "/ru/core/scopes" },
      { text: "Потеря scope", link: "/ru/core/scope-loss" },
      { text: "Стабильные SID", link: "/ru/core/compiler" },
      { text: "Зависимости", link: "/ru/core/dependencies" },
      { text: "Владельцы и очистка", link: "/ru/core/owners" },
      { text: "Низкоуровневое ядро", link: "/ru/core/kernel" },
    ],
  },
];

const modelsEn: DefaultTheme.SidebarItem[] = [
  {
    text: "Models",
    items: [
      { text: "Overview", link: "/models/" },
      { text: "Fields and data", link: "/models/fields" },
      { text: "Traits", link: "/models/traits" },
      { text: "Model instances", link: "/models/instances" },
      { text: "Model kinds", link: "/models/kinds" },
      { text: "Relations", link: "/models/relations" },
      { text: "Queries and indexes", link: "/models/queries" },
      { text: "Unions", link: "/models/unions" },
      { text: "Data in and out", link: "/models/wire" },
      { text: "UI bindings", link: "/models/bindings" },
    ],
  },
];

const modelsRu: DefaultTheme.SidebarItem[] = [
  {
    text: "Модели",
    items: [
      { text: "Обзор", link: "/ru/models/" },
      { text: "Поля и данные", link: "/ru/models/fields" },
      { text: "Трейты", link: "/ru/models/traits" },
      { text: "Экземпляры моделей", link: "/ru/models/instances" },
      { text: "Виды моделей", link: "/ru/models/kinds" },
      { text: "Связи", link: "/ru/models/relations" },
      { text: "Запросы и индексы", link: "/ru/models/queries" },
      { text: "Объединения", link: "/ru/models/unions" },
      { text: "Загрузка и сериализация", link: "/ru/models/wire" },
      { text: "UI-биндинги", link: "/ru/models/bindings" },
    ],
  },
];

const utilsEn: DefaultTheme.SidebarItem[] = [
  {
    text: "Utils",
    items: [
      { text: "Overview", link: "/utils/" },
      { text: "debounce", link: "/utils/debounce" },
      { text: "throttle", link: "/utils/throttle" },
      { text: "delay", link: "/utils/delay" },
      { text: "interval", link: "/utils/interval" },
      { text: "once", link: "/utils/once" },
      { text: "previous", link: "/utils/previous" },
      { text: "reset", link: "/utils/reset" },
      { text: "status", link: "/utils/status" },
    ],
  },
];

const utilsRu: DefaultTheme.SidebarItem[] = [
  {
    text: "Утилиты",
    items: [
      { text: "Обзор", link: "/ru/utils/" },
      { text: "debounce", link: "/ru/utils/debounce" },
      { text: "throttle", link: "/ru/utils/throttle" },
      { text: "delay", link: "/ru/utils/delay" },
      { text: "interval", link: "/ru/utils/interval" },
      { text: "once", link: "/ru/utils/once" },
      { text: "previous", link: "/ru/utils/previous" },
      { text: "reset", link: "/ru/utils/reset" },
      { text: "status", link: "/ru/utils/status" },
    ],
  },
];

const inspectorEn: DefaultTheme.SidebarItem[] = [
  {
    text: "Inspector",
    items: [{ text: "Overview", link: "/inspector/" }],
  },
];

const inspectorRu: DefaultTheme.SidebarItem[] = [
  {
    text: "Инспектор",
    items: [{ text: "Обзор", link: "/ru/inspector/" }],
  },
];

const formsEn: DefaultTheme.SidebarItem[] = [
  {
    text: "Core",
    items: [
      { text: "Overview", link: "/forms/" },
      { text: "Static models", link: "/forms/models" },
      { text: "Field model", link: "/forms/fields" },
      { text: "Form model", link: "/forms/form" },
      { text: "Validation lifecycle", link: "/forms/validation" },
      { text: "Error channels", link: "/forms/errors" },
      { text: "Custom fields", link: "/forms/custom-fields" },
      { text: "Field types", link: "/forms/field-types" },
      { text: "Shape fields", link: "/forms/shape-fields" },
      { text: "Array fields", link: "/forms/array-fields" },
      { text: "Wizard forms", link: "/forms/wizard" },
      { text: "Schema adapters", link: "/forms/adapters" },
    ],
  },
  {
    text: "React",
    items: [
      { text: "Overview", link: "/forms/react/" },
      { text: "useField", link: "/forms/react/use-field" },
      { text: "useForm", link: "/forms/react/use-form" },
      { text: "useWizard", link: "/forms/react/use-wizard" },
    ],
  },
  {
    text: "Effector",
    items: [
      { text: "Overview", link: "/forms/effector/" },
      { text: "Field", link: "/forms/effector/field" },
      { text: "Array field", link: "/forms/effector/array-field" },
      { text: "Shape field", link: "/forms/effector/shape-field" },
      { text: "Custom field", link: "/forms/effector/custom-field" },
      { text: "Recipes", link: "/forms/effector/recipes" },
    ],
  },
];

const formsRu: DefaultTheme.SidebarItem[] = [
  {
    text: "Ядро",
    items: [
      { text: "Обзор", link: "/ru/forms/" },
      { text: "Статические модели", link: "/ru/forms/models" },
      { text: "Модель поля", link: "/ru/forms/fields" },
      { text: "Модель формы", link: "/ru/forms/form" },
      { text: "Жизненный цикл валидации", link: "/ru/forms/validation" },
      { text: "Каналы ошибок", link: "/ru/forms/errors" },
      { text: "Кастомные поля", link: "/ru/forms/custom-fields" },
      { text: "Типы полей", link: "/ru/forms/field-types" },
      { text: "Shape-поля", link: "/ru/forms/shape-fields" },
      { text: "Array-поля", link: "/ru/forms/array-fields" },
      { text: "Визард-формы", link: "/ru/forms/wizard" },
      { text: "Адаптеры схем", link: "/ru/forms/adapters" },
    ],
  },
  {
    text: "React",
    items: [
      { text: "Обзор", link: "/ru/forms/react/" },
      { text: "useField", link: "/ru/forms/react/use-field" },
      { text: "useForm", link: "/ru/forms/react/use-form" },
      { text: "useWizard", link: "/ru/forms/react/use-wizard" },
    ],
  },
  {
    text: "Effector",
    items: [
      { text: "Обзор", link: "/ru/forms/effector/" },
      { text: "Поле", link: "/ru/forms/effector/field" },
      { text: "Array-поле", link: "/ru/forms/effector/array-field" },
      { text: "Shape-поле", link: "/ru/forms/effector/shape-field" },
      { text: "Кастомное поле", link: "/ru/forms/effector/custom-field" },
      { text: "Рецепты", link: "/ru/forms/effector/recipes" },
    ],
  },
];

const routerEn: DefaultTheme.SidebarItem[] = [
  {
    text: "Router",
    items: [
      { text: "Overview", link: "/router/" },
      { text: "Migrating from argon-router", link: "/router/migration-from-argon-router" },
    ],
  },
  {
    text: "Core",
    items: [
      { text: "Overview", link: "/router/core/" },
      { text: "Static models", link: "/router/core/models" },
      { text: "Path templates", link: "/router/core/paths" },
      { text: "Route model", link: "/router/core/routes" },
      { text: "Router and history", link: "/router/core/router" },
      { text: "Navigation", link: "/router/core/navigation" },
      { text: "Query tracking", link: "/router/core/query-tracking" },
      { text: "Virtual & chained routes", link: "/router/core/virtual-routes" },
    ],
  },
  {
    text: "React",
    items: [
      { text: "Overview", link: "/router/react/" },
      { text: "Provider", link: "/router/react/provider" },
      { text: "Route views & outlets", link: "/router/react/views" },
      { text: "Links", link: "/router/react/links" },
      { text: "Hooks", link: "/router/react/hooks" },
    ],
  },
  {
    text: "React Native",
    items: [
      { text: "Overview", link: "/router/react-native/" },
      { text: "Stack navigator", link: "/router/react-native/stack-navigator" },
      { text: "Bottom tabs navigator", link: "/router/react-native/bottom-tabs-navigator" },
    ],
  },
];

const routerRu: DefaultTheme.SidebarItem[] = [
  {
    text: "Роутер",
    items: [
      { text: "Обзор", link: "/ru/router/" },
      { text: "Миграция с argon-router", link: "/ru/router/migration-from-argon-router" },
    ],
  },
  {
    text: "Ядро",
    items: [
      { text: "Обзор", link: "/ru/router/core/" },
      { text: "Статические модели", link: "/ru/router/core/models" },
      { text: "Шаблоны путей", link: "/ru/router/core/paths" },
      { text: "Модель роута", link: "/ru/router/core/routes" },
      { text: "Роутер и history", link: "/ru/router/core/router" },
      { text: "Навигация", link: "/ru/router/core/navigation" },
      { text: "Отслеживание query", link: "/ru/router/core/query-tracking" },
      { text: "Виртуальные и chain-роуты", link: "/ru/router/core/virtual-routes" },
    ],
  },
  {
    text: "React",
    items: [
      { text: "Обзор", link: "/ru/router/react/" },
      { text: "Провайдер", link: "/ru/router/react/provider" },
      { text: "Представления и Outlet", link: "/ru/router/react/views" },
      { text: "Ссылки", link: "/ru/router/react/links" },
      { text: "Хуки", link: "/ru/router/react/hooks" },
    ],
  },
  {
    text: "React Native",
    items: [
      { text: "Обзор", link: "/ru/router/react-native/" },
      { text: "Stack-навигатор", link: "/ru/router/react-native/stack-navigator" },
      { text: "Bottom tabs-навигатор", link: "/ru/router/react-native/bottom-tabs-navigator" },
    ],
  },
];

const reactEn: DefaultTheme.SidebarItem[] = [
  {
    text: "React",
    items: [
      { text: "Overview", link: "/react/" },
      { text: "useUnit", link: "/react/use-unit" },
      { text: "Models and components", link: "/react/models" },
      { text: "Cached models", link: "/react/cache" },
    ],
  },
];

const reactRu: DefaultTheme.SidebarItem[] = [
  {
    text: "React",
    items: [
      { text: "Обзор", link: "/ru/react/" },
      { text: "useUnit", link: "/ru/react/use-unit" },
      { text: "Модели и компоненты", link: "/ru/react/models" },
      { text: "Кешированные модели", link: "/ru/react/cache" },
    ],
  },
];

const uiEn: DefaultTheme.SidebarItem[] = [
  {
    "text": "UI",
    "items": [
      {
        "text": "Overview",
        "link": "/ui/"
      },
      {
        "text": "Setup",
        "link": "/ui/installation"
      }
    ]
  },
  {
    "text": "Tutorial",
    "items": [
      {
        "text": "Introduction",
        "link": "/ui/learn/"
      },
      {
        "text": "1. Your first component",
        "link": "/ui/learn/first-app"
      },
      {
        "text": "2. State",
        "link": "/ui/learn/state-and-props"
      },
      {
        "text": "3. Events",
        "link": "/ui/learn/events"
      },
      {
        "text": "4. Derived values",
        "link": "/ui/learn/derived"
      },
      {
        "text": "5. Props",
        "link": "/ui/learn/props"
      },
      {
        "text": "6. Conditional rendering",
        "link": "/ui/learn/conditions"
      },
      {
        "text": "7. A list of counters",
        "link": "/ui/learn/model-lists"
      }
    ]
  },
  {
    "text": "Guides",
    "collapsed": true,
    "items": [
      {
        "text": "Choose a guide",
        "link": "/ui/guides/"
      },
      {
        "text": "Model ownership",
        "link": "/ui/learn/setup-and-view"
      },
      {
        "text": "Retaining instances",
        "link": "/ui/components"
      },
      {
        "text": "Reactive inputs",
        "link": "/ui/reactivity"
      },
      {
        "text": "Refs and lifecycle",
        "link": "/ui/learn/refs-and-lifetime"
      },
      {
        "text": "How rendering works",
        "link": "/ui/how-it-works"
      },
      {
        "text": "Scopes",
        "link": "/ui/learn/ssr-and-scopes"
      },
      {
        "text": "Vitest",
        "link": "/ui/api/testing"
      },
      {
        "text": "SSR",
        "link": "/ui/ssr"
      },
      {
        "text": "Start",
        "link": "/ui/start"
      },
      {
        "text": "React and Vue",
        "link": "/ui/interop"
      }
    ]
  },
  {
    "text": "Recipes",
    "collapsed": true,
    "items": [
      {
        "text": "Overview",
        "link": "/ui/recipes/"
      },
      {
        "text": "Editor and draft",
        "link": "/ui/recipes/conditional-editor"
      },
      {
        "text": "Editable model list",
        "link": "/ui/recipes/model-list"
      },
      {
        "text": "Search and cancellation",
        "link": "/ui/recipes/async-search"
      },
      {
        "text": "Request SSR",
        "link": "/ui/recipes/ssr"
      },
      {
        "text": "Concurrent tests",
        "link": "/ui/recipes/testing"
      }
    ]
  },
  {
    "text": "API",
    "collapsed": true,
    "items": [
      {
        "text": "Exports",
        "link": "/ui/api/"
      },
      {
        "text": "Rendering and DOM",
        "link": "/ui/api/rendering"
      },
      {
        "text": "Components",
        "link": "/ui/api/components"
      },
      {
        "text": "Refs and events",
        "link": "/ui/api/refs-events"
      },
      {
        "text": "Containers and context",
        "link": "/ui/api/collections-context"
      },
      {
        "text": "Core",
        "link": "/ui/api/core"
      },
      {
        "text": "SSR and Start",
        "link": "/ui/api/server-start"
      },
      {
        "text": "JSX and SIDs",
        "link": "/ui/api/compiler"
      },
      {
        "text": "Adapters",
        "link": "/ui/api/interop"
      },
      {
        "text": "DOM types",
        "link": "/ui/api/types"
      }
    ]
  }
];

const uiRu: DefaultTheme.SidebarItem[] = [
  {
    "text": "UI",
    "items": [
      {
        "text": "Обзор",
        "link": "/ru/ui/"
      },
      {
        "text": "Подготовка",
        "link": "/ru/ui/installation"
      }
    ]
  },
  {
    "text": "Учебник",
    "items": [
      {
        "text": "Введение",
        "link": "/ru/ui/learn/"
      },
      {
        "text": "1. Первый компонент",
        "link": "/ru/ui/learn/first-app"
      },
      {
        "text": "2. Состояние",
        "link": "/ru/ui/learn/state-and-props"
      },
      {
        "text": "3. События",
        "link": "/ru/ui/learn/events"
      },
      {
        "text": "4. Вычисления",
        "link": "/ru/ui/learn/derived"
      },
      {
        "text": "5. Пропсы",
        "link": "/ru/ui/learn/props"
      },
      {
        "text": "6. Условный вывод",
        "link": "/ru/ui/learn/conditions"
      },
      {
        "text": "7. Список счётчиков",
        "link": "/ru/ui/learn/model-lists"
      }
    ]
  },
  {
    "text": "Руководства",
    "collapsed": true,
    "items": [
      {
        "text": "Выбрать руководство",
        "link": "/ru/ui/guides/"
      },
      {
        "text": "Владение моделями",
        "link": "/ru/ui/learn/setup-and-view"
      },
      {
        "text": "Сохранение экземпляров",
        "link": "/ru/ui/components"
      },
      {
        "text": "Реактивные входы",
        "link": "/ru/ui/reactivity"
      },
      {
        "text": "Refs и lifecycle",
        "link": "/ru/ui/learn/refs-and-lifetime"
      },
      {
        "text": "Как работает рендер",
        "link": "/ru/ui/how-it-works"
      },
      {
        "text": "Scope",
        "link": "/ru/ui/learn/ssr-and-scopes"
      },
      {
        "text": "Vitest",
        "link": "/ru/ui/api/testing"
      },
      {
        "text": "SSR",
        "link": "/ru/ui/ssr"
      },
      {
        "text": "Start",
        "link": "/ru/ui/start"
      },
      {
        "text": "React и Vue",
        "link": "/ru/ui/interop"
      }
    ]
  },
  {
    "text": "Рецепты",
    "collapsed": true,
    "items": [
      {
        "text": "Обзор",
        "link": "/ru/ui/recipes/"
      },
      {
        "text": "Редактор и черновик",
        "link": "/ru/ui/recipes/conditional-editor"
      },
      {
        "text": "Редактируемый список",
        "link": "/ru/ui/recipes/model-list"
      },
      {
        "text": "Поиск и отмена",
        "link": "/ru/ui/recipes/async-search"
      },
      {
        "text": "SSR запроса",
        "link": "/ru/ui/recipes/ssr"
      },
      {
        "text": "Параллельные тесты",
        "link": "/ru/ui/recipes/testing"
      }
    ]
  },
  {
    "text": "API",
    "collapsed": true,
    "items": [
      {
        "text": "Экспорты",
        "link": "/ru/ui/api/"
      },
      {
        "text": "Рендер и DOM",
        "link": "/ru/ui/api/rendering"
      },
      {
        "text": "Компоненты",
        "link": "/ru/ui/api/components"
      },
      {
        "text": "Refs и события",
        "link": "/ru/ui/api/refs-events"
      },
      {
        "text": "Контейнеры и контекст",
        "link": "/ru/ui/api/collections-context"
      },
      {
        "text": "Core",
        "link": "/ru/ui/api/core"
      },
      {
        "text": "SSR и Start",
        "link": "/ru/ui/api/server-start"
      },
      {
        "text": "JSX и SID",
        "link": "/ru/ui/api/compiler"
      },
      {
        "text": "Адаптеры",
        "link": "/ru/ui/api/interop"
      },
      {
        "text": "Типы DOM",
        "link": "/ru/ui/api/types"
      }
    ]
  }
];

const vueEn: DefaultTheme.SidebarItem[] = [
  {
    text: "Vue",
    items: [
      { text: "Overview", link: "/vue/" },
      { text: "useUnit", link: "/vue/use-unit" },
      { text: "Models and components", link: "/vue/models" },
      { text: "Cached models", link: "/vue/cache" },
    ],
  },
];

const vueRu: DefaultTheme.SidebarItem[] = [
  {
    text: "Vue",
    items: [
      { text: "Обзор", link: "/ru/vue/" },
      { text: "useUnit", link: "/ru/vue/use-unit" },
      { text: "Модели и компоненты", link: "/ru/vue/models" },
      { text: "Кешированные модели", link: "/ru/vue/cache" },
    ],
  },
];

const storageEn: DefaultTheme.SidebarItem[] = [
  {
    text: "Storage",
    items: [
      { text: "Overview", link: "/storage/" },
      { text: "Static models", link: "/storage/models" },
      { text: "Storage boxes", link: "/storage/boxes" },
      { text: "Persistence", link: "/storage/persist" },
    ],
  },
];

const storageRu: DefaultTheme.SidebarItem[] = [
  {
    text: "Storage",
    items: [
      { text: "Обзор", link: "/ru/storage/" },
      { text: "Статические модели", link: "/ru/storage/models" },
      { text: "Боксы хранилищ", link: "/ru/storage/boxes" },
      { text: "Сохранение", link: "/ru/storage/persist" },
    ],
  },
];

const effectorEn: DefaultTheme.SidebarItem[] = [
  {
    text: "Effector compatibility",
    items: [
      { text: "Overview", link: "/effector/" },
      { text: "Operators", link: "/effector/operators" },
      { text: "Scopes and serialization", link: "/effector/scopes" },
    ],
  },
];

const effectorRu: DefaultTheme.SidebarItem[] = [
  {
    text: "Совместимость с Effector",
    items: [
      { text: "Обзор", link: "/ru/effector/" },
      { text: "Операторы", link: "/ru/effector/operators" },
      { text: "Скоупы и сериализация", link: "/ru/effector/scopes" },
    ],
  },
];

const mutableEn: DefaultTheme.SidebarItem[] = [
  {
    text: "Mutable",
    items: [{ text: "Overview", link: "/mutable/" }],
  },
];

const mutableRu: DefaultTheme.SidebarItem[] = [
  {
    text: "Mutable",
    items: [{ text: "Обзор", link: "/ru/mutable/" }],
  },
];

const netEn: DefaultTheme.SidebarItem[] = [
  {
    text: "Net",
    items: [{ text: "Overview", link: "/net/" }],
  },
  {
    text: "Core",
    items: [
      { text: "Overview", link: "/net/core/" },
      { text: "Static models", link: "/net/core/models" },
      { text: "Query", link: "/net/core/query" },
      { text: "Mutation", link: "/net/core/mutation" },
      { text: "Triggers", link: "/net/core/triggers" },
      { text: "Operators", link: "/net/core/operators" },
      { text: "Adapters", link: "/net/core/adapters" },
      { text: "Defaults", link: "/net/core/defaults" },
    ],
  },
  {
    text: "React",
    items: [
      { text: "Overview", link: "/net/react/" },
      { text: "useQuery", link: "/net/react/use-query" },
      { text: "useMutation", link: "/net/react/use-mutation" },
    ],
  },
  {
    text: "Vue",
    items: [
      { text: "Overview", link: "/net/vue/" },
      { text: "useQuery", link: "/net/vue/use-query" },
      { text: "useMutation", link: "/net/vue/use-mutation" },
    ],
  },
];

const netRu: DefaultTheme.SidebarItem[] = [
  {
    text: "Net",
    items: [{ text: "Обзор", link: "/ru/net/" }],
  },
  {
    text: "Ядро",
    items: [
      { text: "Обзор", link: "/ru/net/core/" },
      { text: "Статические модели", link: "/ru/net/core/models" },
      { text: "Query", link: "/ru/net/core/query" },
      { text: "Mutation", link: "/ru/net/core/mutation" },
      { text: "Триггеры", link: "/ru/net/core/triggers" },
      { text: "Операторы", link: "/ru/net/core/operators" },
      { text: "Адаптеры", link: "/ru/net/core/adapters" },
      { text: "Дефолты", link: "/ru/net/core/defaults" },
    ],
  },
  {
    text: "React",
    items: [
      { text: "Обзор", link: "/ru/net/react/" },
      { text: "useQuery", link: "/ru/net/react/use-query" },
      { text: "useMutation", link: "/ru/net/react/use-mutation" },
    ],
  },
  {
    text: "Vue",
    items: [
      { text: "Обзор", link: "/ru/net/vue/" },
      { text: "useQuery", link: "/ru/net/vue/use-query" },
      { text: "useMutation", link: "/ru/net/vue/use-mutation" },
    ],
  },
];

const recipesEn: DefaultTheme.SidebarItem[] = [
  {
    text: "Recipes",
    items: [
      { text: "Counter", link: "/recipes/counter" },
      { text: "Async search", link: "/recipes/async-search" },
      { text: "React model cache", link: "/recipes/react-model-cache" },
      { text: "Next.js", link: "/recipes/nextjs" },
      { text: "TanStack Query", link: "/recipes/tanstack-query" },
      { text: "React Router", link: "/recipes/react-router" },
      { text: "Testing", link: "/recipes/testing" },
      { text: "Migration notes", link: "/recipes/migration" },
    ],
  },
];

const recipesRu: DefaultTheme.SidebarItem[] = [
  {
    text: "Рецепты",
    items: [
      { text: "Счетчик", link: "/ru/recipes/counter" },
      { text: "Асинхронный поиск", link: "/ru/recipes/async-search" },
      { text: "Кеш моделей в React", link: "/ru/recipes/react-model-cache" },
      { text: "Next.js", link: "/ru/recipes/nextjs" },
      { text: "TanStack Query", link: "/ru/recipes/tanstack-query" },
      { text: "React Router", link: "/ru/recipes/react-router" },
      { text: "Тестирование", link: "/ru/recipes/testing" },
      { text: "Миграция", link: "/ru/recipes/migration" },
    ],
  },
];

const skillsEn: DefaultTheme.SidebarItem[] = [
  {
    text: "AI",
    items: [{ text: "Agent Skills", link: "/skills/" }],
  },
];

const skillsRu: DefaultTheme.SidebarItem[] = [
  {
    text: "AI",
    items: [{ text: "Агентские скиллы", link: "/ru/skills/" }],
  },
];

const virentiaEn: DefaultTheme.SidebarItem[] = [
  ...guideEn,
  ...coreEn,
  ...modelsEn,
  ...utilsEn,
  ...reactEn,
  ...vueEn,
  ...mutableEn,
  ...effectorEn,
  ...inspectorEn,
];
const virentiaRu: DefaultTheme.SidebarItem[] = [
  ...guideRu,
  ...coreRu,
  ...modelsRu,
  ...utilsRu,
  ...reactRu,
  ...vueRu,
  ...mutableRu,
  ...effectorRu,
  ...inspectorRu,
];

export const enSidebar: DefaultTheme.Sidebar = {
  "/guide/": virentiaEn,
  "/core/": virentiaEn,
  "/models/": virentiaEn,
  "/utils/": virentiaEn,
  "/inspector/": virentiaEn,
  "/forms/": formsEn,
  "/router/": routerEn,
  "/react/": virentiaEn,
  "/ui/": uiEn,
  "/vue/": virentiaEn,
  "/storage/": storageEn,
  "/effector/": virentiaEn,
  "/mutable/": virentiaEn,
  "/net/": netEn,
  "/recipes/": recipesEn,
  "/skills/": skillsEn,
};

export const ruSidebar: DefaultTheme.Sidebar = {
  "/ru/guide/": virentiaRu,
  "/ru/core/": virentiaRu,
  "/ru/models/": virentiaRu,
  "/ru/utils/": virentiaRu,
  "/ru/inspector/": virentiaRu,
  "/ru/forms/": formsRu,
  "/ru/router/": routerRu,
  "/ru/react/": virentiaRu,
  "/ru/ui/": uiRu,
  "/ru/vue/": virentiaRu,
  "/ru/storage/": storageRu,
  "/ru/effector/": virentiaRu,
  "/ru/mutable/": virentiaRu,
  "/ru/net/": netRu,
  "/ru/recipes/": recipesRu,
  "/ru/skills/": skillsRu,
};

export const docsSections: DocsSection[] = [
  {
    id: "virentia",
    label: { en: "Core", ru: "Ядро" },
    link: { en: "/guide/getting-started", ru: "/ru/guide/getting-started" },
    match: {
      en: [
        "/",
        "/guide/",
        "/core/",
        "/models/",
        "/utils/",
        "/react/",
        "/vue/",
        "/mutable/",
        "/effector/",
        "/inspector/",
      ],
      ru: [
        "/ru/",
        "/ru/guide/",
        "/ru/core/",
        "/ru/models/",
        "/ru/utils/",
        "/ru/react/",
        "/ru/vue/",
        "/ru/mutable/",
        "/ru/effector/",
        "/ru/inspector/",
      ],
    },
    nav: {
      en: [
        { text: "Guide", link: "/guide/getting-started" },
        { text: "Core", link: "/core/" },
        { text: "Models", link: "/models/" },
        { text: "Utils", link: "/utils/" },
        { text: "React", link: "/react/" },
        { text: "Vue", link: "/vue/" },
        { text: "Mutable", link: "/mutable/" },
        { text: "Effector", link: "/effector/" },
        { text: "Inspector", link: "/inspector/" },
      ],
      ru: [
        { text: "Руководство", link: "/ru/guide/getting-started" },
        { text: "Ядро", link: "/ru/core/" },
        { text: "Модели", link: "/ru/models/" },
        { text: "Утилиты", link: "/ru/utils/" },
        { text: "React", link: "/ru/react/" },
        { text: "Vue", link: "/ru/vue/" },
        { text: "Mutable", link: "/ru/mutable/" },
        { text: "Effector", link: "/ru/effector/" },
        { text: "Инспектор", link: "/ru/inspector/" },
      ],
    },
  },
  {
    id: "ui",
    label: { en: "UI", ru: "UI" },
    link: { en: "/ui/", ru: "/ru/ui/" },
    match: { en: ["/ui/"], ru: ["/ru/ui/"] },
    nav: {
      en: [
        { text: "Overview", link: "/ui/" },
        { text: "Learn", link: "/ui/learn/" },
        { text: "How it works", link: "/ui/how-it-works" },
        { text: "Recipes", link: "/ui/recipes/" },
        { text: "API", link: "/ui/api/" },
      ],
      ru: [
        { text: "Обзор", link: "/ru/ui/" },
        { text: "Обучение", link: "/ru/ui/learn/" },
        { text: "Как это работает", link: "/ru/ui/how-it-works" },
        { text: "Рецепты", link: "/ru/ui/recipes/" },
        { text: "API", link: "/ru/ui/api/" },
      ],
    },
  },
  {
    id: "forms",
    label: { en: "Forms", ru: "Формы" },
    link: { en: "/forms/", ru: "/ru/forms/" },
    match: { en: ["/forms/"], ru: ["/ru/forms/"] },
    nav: {
      en: [
        { text: "Overview", link: "/forms/" },
        { text: "Static models", link: "/forms/models" },
        { text: "Fields", link: "/forms/fields" },
        { text: "Form", link: "/forms/form" },
        { text: "Validation", link: "/forms/validation" },
        { text: "Adapters", link: "/forms/adapters" },
        { text: "React", link: "/forms/react/" },
        { text: "Effector", link: "/forms/effector/" },
      ],
      ru: [
        { text: "Обзор", link: "/ru/forms/" },
        { text: "Статические модели", link: "/ru/forms/models" },
        { text: "Поля", link: "/ru/forms/fields" },
        { text: "Форма", link: "/ru/forms/form" },
        { text: "Валидация", link: "/ru/forms/validation" },
        { text: "Адаптеры", link: "/ru/forms/adapters" },
        { text: "React", link: "/ru/forms/react/" },
        { text: "Effector", link: "/ru/forms/effector/" },
      ],
    },
  },
  {
    id: "router",
    label: { en: "Router", ru: "Роутер" },
    link: { en: "/router/", ru: "/ru/router/" },
    match: { en: ["/router/"], ru: ["/ru/router/"] },
    nav: {
      en: [
        { text: "Overview", link: "/router/" },
        {
          text: "Core",
          items: [
            { text: "Overview", link: "/router/core/" },
            { text: "Static models", link: "/router/core/models" },
            { text: "Path templates", link: "/router/core/paths" },
            { text: "Route model", link: "/router/core/routes" },
            { text: "Router and history", link: "/router/core/router" },
            { text: "Navigation", link: "/router/core/navigation" },
            { text: "Query tracking", link: "/router/core/query-tracking" },
            { text: "Virtual & chained routes", link: "/router/core/virtual-routes" },
          ],
        },
        { text: "React", link: "/router/react/" },
        { text: "React Native", link: "/router/react-native/" },
      ],
      ru: [
        { text: "Обзор", link: "/ru/router/" },
        {
          text: "Ядро",
          items: [
            { text: "Обзор", link: "/ru/router/core/" },
            { text: "Статические модели", link: "/ru/router/core/models" },
            { text: "Шаблоны путей", link: "/ru/router/core/paths" },
            { text: "Модель роута", link: "/ru/router/core/routes" },
            { text: "Роутер и history", link: "/ru/router/core/router" },
            { text: "Навигация", link: "/ru/router/core/navigation" },
            { text: "Отслеживание query", link: "/ru/router/core/query-tracking" },
            { text: "Виртуальные и chain-роуты", link: "/ru/router/core/virtual-routes" },
          ],
        },
        { text: "React", link: "/ru/router/react/" },
        { text: "React Native", link: "/ru/router/react-native/" },
      ],
    },
  },
  {
    id: "storage",
    label: { en: "Storage", ru: "Storage" },
    link: { en: "/storage/", ru: "/ru/storage/" },
    match: { en: ["/storage/"], ru: ["/ru/storage/"] },
    nav: {
      en: [
        { text: "Overview", link: "/storage/" },
        { text: "Static models", link: "/storage/models" },
        { text: "Boxes", link: "/storage/boxes" },
        { text: "Persistence", link: "/storage/persist" },
      ],
      ru: [
        { text: "Обзор", link: "/ru/storage/" },
        { text: "Статические модели", link: "/ru/storage/models" },
        { text: "Боксы", link: "/ru/storage/boxes" },
        { text: "Сохранение", link: "/ru/storage/persist" },
      ],
    },
  },
  {
    id: "net",
    label: { en: "Net", ru: "Net" },
    link: { en: "/net/", ru: "/ru/net/" },
    match: { en: ["/net/"], ru: ["/ru/net/"] },
    nav: {
      en: [
        { text: "Overview", link: "/net/" },
        {
          text: "Core",
          items: [
            { text: "Overview", link: "/net/core/" },
            { text: "Static models", link: "/net/core/models" },
            { text: "Query", link: "/net/core/query" },
            { text: "Mutation", link: "/net/core/mutation" },
            { text: "Triggers", link: "/net/core/triggers" },
            { text: "Operators", link: "/net/core/operators" },
            { text: "Adapters", link: "/net/core/adapters" },
            { text: "Defaults", link: "/net/core/defaults" },
          ],
        },
        { text: "React", link: "/net/react/" },
        { text: "Vue", link: "/net/vue/" },
      ],
      ru: [
        { text: "Обзор", link: "/ru/net/" },
        {
          text: "Ядро",
          items: [
            { text: "Обзор", link: "/ru/net/core/" },
            { text: "Статические модели", link: "/ru/net/core/models" },
            { text: "Query", link: "/ru/net/core/query" },
            { text: "Mutation", link: "/ru/net/core/mutation" },
            { text: "Триггеры", link: "/ru/net/core/triggers" },
            { text: "Операторы", link: "/ru/net/core/operators" },
            { text: "Адаптеры", link: "/ru/net/core/adapters" },
            { text: "Дефолты", link: "/ru/net/core/defaults" },
          ],
        },
        { text: "React", link: "/ru/net/react/" },
        { text: "Vue", link: "/ru/net/vue/" },
      ],
    },
  },
  {
    id: "recipes",
    label: { en: "Recipes", ru: "Рецепты" },
    link: { en: "/recipes/counter", ru: "/ru/recipes/counter" },
    match: { en: ["/recipes/"], ru: ["/ru/recipes/"] },
    nav: {
      en: [
        { text: "Counter", link: "/recipes/counter" },
        { text: "Async search", link: "/recipes/async-search" },
        { text: "React model cache", link: "/recipes/react-model-cache" },
        { text: "Next.js", link: "/recipes/nextjs" },
        { text: "TanStack Query", link: "/recipes/tanstack-query" },
        { text: "React Router", link: "/recipes/react-router" },
        { text: "Testing", link: "/recipes/testing" },
        { text: "Migration", link: "/recipes/migration" },
      ],
      ru: [
        { text: "Счетчик", link: "/ru/recipes/counter" },
        { text: "Асинхронный поиск", link: "/ru/recipes/async-search" },
        { text: "Кеш моделей в React", link: "/ru/recipes/react-model-cache" },
        { text: "Next.js", link: "/ru/recipes/nextjs" },
        { text: "TanStack Query", link: "/ru/recipes/tanstack-query" },
        { text: "React Router", link: "/ru/recipes/react-router" },
        { text: "Тестирование", link: "/ru/recipes/testing" },
        { text: "Миграция", link: "/ru/recipes/migration" },
      ],
    },
  },
  {
    id: "skills",
    label: { en: "Skills", ru: "Скиллы" },
    link: { en: "/skills/", ru: "/ru/skills/" },
    match: { en: ["/skills/"], ru: ["/ru/skills/"] },
    nav: {
      en: [{ text: "Agent Skills", link: "/skills/" }],
      ru: [{ text: "Агентские скиллы", link: "/ru/skills/" }],
    },
  },
];
