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
      { text: "Владельцы и очистка", link: "/ru/core/owners" },
      { text: "Низкоуровневое ядро", link: "/ru/core/kernel" },
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
    text: "Forms",
    items: [
      { text: "Overview", link: "/forms/" },
      { text: "Field model", link: "/forms/fields" },
      { text: "Form model", link: "/forms/form" },
      { text: "Validation lifecycle", link: "/forms/validation" },
      { text: "Error channels", link: "/forms/errors" },
      { text: "Custom fields", link: "/forms/custom-fields" },
      { text: "Field types", link: "/forms/field-types" },
      { text: "Shape fields", link: "/forms/shape-fields" },
      { text: "Array fields", link: "/forms/array-fields" },
      { text: "Wizard forms", link: "/forms/wizard" },
      { text: "React", link: "/forms/react" },
      { text: "Schema adapters", link: "/forms/adapters" },
    ],
  },
];

const formsRu: DefaultTheme.SidebarItem[] = [
  {
    text: "Формы",
    items: [
      { text: "Обзор", link: "/ru/forms/" },
      { text: "Модель поля", link: "/ru/forms/fields" },
      { text: "Модель формы", link: "/ru/forms/form" },
      { text: "Жизненный цикл валидации", link: "/ru/forms/validation" },
      { text: "Каналы ошибок", link: "/ru/forms/errors" },
      { text: "Кастомные поля", link: "/ru/forms/custom-fields" },
      { text: "Типы полей", link: "/ru/forms/field-types" },
      { text: "Shape-поля", link: "/ru/forms/shape-fields" },
      { text: "Array-поля", link: "/ru/forms/array-fields" },
      { text: "Визард-формы", link: "/ru/forms/wizard" },
      { text: "React", link: "/ru/forms/react" },
      { text: "Адаптеры схем", link: "/ru/forms/adapters" },
    ],
  },
];

const routerEn: DefaultTheme.SidebarItem[] = [
  {
    text: "Router",
    items: [
      { text: "Overview", link: "/router/" },
      { text: "Path templates", link: "/router/paths" },
      { text: "Route model", link: "/router/routes" },
      { text: "Router and history", link: "/router/router" },
      { text: "Navigation", link: "/router/navigation" },
      { text: "Query tracking", link: "/router/query-tracking" },
      { text: "React rendering", link: "/router/react" },
      { text: "Migrating from argon-router", link: "/router/migration-from-argon-router" },
    ],
  },
];

const routerRu: DefaultTheme.SidebarItem[] = [
  {
    text: "Роутер",
    items: [
      { text: "Обзор", link: "/ru/router/" },
      { text: "Шаблоны путей", link: "/ru/router/paths" },
      { text: "Модель роута", link: "/ru/router/routes" },
      { text: "Роутер и history", link: "/ru/router/router" },
      { text: "Навигация", link: "/ru/router/navigation" },
      { text: "Отслеживание query", link: "/ru/router/query-tracking" },
      { text: "Отрисовка в React", link: "/ru/router/react" },
      { text: "Миграция с argon-router", link: "/ru/router/migration-from-argon-router" },
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

const recipesEn: DefaultTheme.SidebarItem[] = [
  {
    text: "Recipes",
    items: [
      { text: "Counter", link: "/recipes/counter" },
      { text: "Async search", link: "/recipes/async-search" },
      { text: "React model cache", link: "/recipes/react-model-cache" },
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
      { text: "Тестирование", link: "/ru/recipes/testing" },
      { text: "Миграция", link: "/ru/recipes/migration" },
    ],
  },
];

const apiEn: DefaultTheme.SidebarItem[] = [
  {
    text: "API",
    items: [
      { text: "@virentia/core", link: "/api/core" },
      { text: "@virentia/react", link: "/api/react" },
      { text: "@virentia/effector", link: "/api/effector" },
      { text: "@virentia/forms", link: "/api/forms" },
      { text: "@virentia/router", link: "/api/router" },
    ],
  },
];

const apiRu: DefaultTheme.SidebarItem[] = [
  {
    text: "API",
    items: [
      { text: "@virentia/core", link: "/ru/api/core" },
      { text: "@virentia/react", link: "/ru/api/react" },
      { text: "@virentia/effector", link: "/ru/api/effector" },
      { text: "@virentia/forms", link: "/ru/api/forms" },
      { text: "@virentia/router", link: "/ru/api/router" },
    ],
  },
];

const virentiaEn: DefaultTheme.SidebarItem[] = [...guideEn, ...coreEn, ...inspectorEn];
const virentiaRu: DefaultTheme.SidebarItem[] = [...guideRu, ...coreRu, ...inspectorRu];

export const enSidebar: DefaultTheme.Sidebar = {
  "/guide/": virentiaEn,
  "/core/": virentiaEn,
  "/inspector/": virentiaEn,
  "/forms/": formsEn,
  "/router/": routerEn,
  "/react/": reactEn,
  "/effector/": effectorEn,
  "/recipes/": recipesEn,
  "/api/": apiEn,
};

export const ruSidebar: DefaultTheme.Sidebar = {
  "/ru/guide/": virentiaRu,
  "/ru/core/": virentiaRu,
  "/ru/inspector/": virentiaRu,
  "/ru/forms/": formsRu,
  "/ru/router/": routerRu,
  "/ru/react/": reactRu,
  "/ru/effector/": effectorRu,
  "/ru/recipes/": recipesRu,
  "/ru/api/": apiRu,
};

export const docsSections: DocsSection[] = [
  {
    id: "virentia",
    label: { en: "Virentia", ru: "Virentia" },
    link: { en: "/guide/getting-started", ru: "/ru/guide/getting-started" },
    match: {
      en: ["/", "/guide/", "/core/", "/inspector/"],
      ru: ["/ru/", "/ru/guide/", "/ru/core/", "/ru/inspector/"],
    },
    nav: {
      en: [
        {
          text: "Guide",
          items: [
            { text: "Getting started", link: "/guide/getting-started" },
            { text: "Ideology", link: "/guide/ideology" },
            { text: "Internals", link: "/guide/deep-knowledge" },
          ],
        },
        {
          text: "Core",
          items: [
            { text: "Overview", link: "/core/" },
            { text: "Units", link: "/core/units" },
            { text: "Stores", link: "/core/stores" },
            { text: "Events", link: "/core/events" },
            { text: "Effects", link: "/core/effects" },
          ],
        },
        { text: "Inspector", link: "/inspector/" },
        { text: "API", link: "/api/core" },
      ],
      ru: [
        {
          text: "Руководство",
          items: [
            { text: "Начало работы", link: "/ru/guide/getting-started" },
            { text: "Идеология", link: "/ru/guide/ideology" },
            { text: "Внутреннее устройство", link: "/ru/guide/deep-knowledge" },
          ],
        },
        {
          text: "Ядро",
          items: [
            { text: "Обзор", link: "/ru/core/" },
            { text: "Юниты", link: "/ru/core/units" },
            { text: "Сторы", link: "/ru/core/stores" },
            { text: "События", link: "/ru/core/events" },
            { text: "Эффекты", link: "/ru/core/effects" },
          ],
        },
        { text: "Инспектор", link: "/ru/inspector/" },
        { text: "API", link: "/ru/api/core" },
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
        { text: "Fields", link: "/forms/fields" },
        { text: "Form", link: "/forms/form" },
        { text: "Validation", link: "/forms/validation" },
        { text: "React", link: "/forms/react" },
        { text: "API", link: "/api/forms" },
      ],
      ru: [
        { text: "Обзор", link: "/ru/forms/" },
        { text: "Поля", link: "/ru/forms/fields" },
        { text: "Форма", link: "/ru/forms/form" },
        { text: "Валидация", link: "/ru/forms/validation" },
        { text: "React", link: "/ru/forms/react" },
        { text: "API", link: "/ru/api/forms" },
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
        { text: "Paths", link: "/router/paths" },
        { text: "Routes", link: "/router/routes" },
        { text: "Navigation", link: "/router/navigation" },
        { text: "React", link: "/router/react" },
        { text: "API", link: "/api/router" },
      ],
      ru: [
        { text: "Обзор", link: "/ru/router/" },
        { text: "Пути", link: "/ru/router/paths" },
        { text: "Роуты", link: "/ru/router/routes" },
        { text: "Навигация", link: "/ru/router/navigation" },
        { text: "React", link: "/ru/router/react" },
        { text: "API", link: "/ru/api/router" },
      ],
    },
  },
  {
    id: "react",
    label: { en: "React", ru: "React" },
    link: { en: "/react/", ru: "/ru/react/" },
    match: { en: ["/react/"], ru: ["/ru/react/"] },
    nav: {
      en: [
        { text: "Overview", link: "/react/" },
        { text: "useUnit", link: "/react/use-unit" },
        { text: "Models", link: "/react/models" },
        { text: "Cache", link: "/react/cache" },
        { text: "API", link: "/api/react" },
      ],
      ru: [
        { text: "Обзор", link: "/ru/react/" },
        { text: "useUnit", link: "/ru/react/use-unit" },
        { text: "Модели", link: "/ru/react/models" },
        { text: "Кеш", link: "/ru/react/cache" },
        { text: "API", link: "/ru/api/react" },
      ],
    },
  },
  {
    id: "effector",
    label: { en: "Effector compatibility", ru: "Совместимость с Effector" },
    link: { en: "/effector/", ru: "/ru/effector/" },
    match: { en: ["/effector/"], ru: ["/ru/effector/"] },
    nav: {
      en: [
        { text: "Overview", link: "/effector/" },
        { text: "Operators", link: "/effector/operators" },
        { text: "Scopes", link: "/effector/scopes" },
        { text: "API", link: "/api/effector" },
      ],
      ru: [
        { text: "Обзор", link: "/ru/effector/" },
        { text: "Операторы", link: "/ru/effector/operators" },
        { text: "Скоупы", link: "/ru/effector/scopes" },
        { text: "API", link: "/ru/api/effector" },
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
        { text: "Testing", link: "/recipes/testing" },
        { text: "Migration", link: "/recipes/migration" },
      ],
      ru: [
        { text: "Счетчик", link: "/ru/recipes/counter" },
        { text: "Асинхронный поиск", link: "/ru/recipes/async-search" },
        { text: "Тестирование", link: "/ru/recipes/testing" },
        { text: "Миграция", link: "/ru/recipes/migration" },
      ],
    },
  },
  {
    id: "api",
    label: { en: "API", ru: "API" },
    link: { en: "/api/core", ru: "/ru/api/core" },
    match: { en: ["/api/"], ru: ["/ru/api/"] },
    nav: {
      en: apiEn[0].items as SectionNavLink[],
      ru: apiRu[0].items as SectionNavLink[],
    },
  },
];
