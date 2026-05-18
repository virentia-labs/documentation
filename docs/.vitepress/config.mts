import { defineConfig } from "vitepress";

const siteDescription = "State manager for applications with complex business logic.";
const ruSiteDescription = "Стейт-менеджер для приложений со сложной бизнес-логикой.";

const enNav = [
  { text: "Guide", link: "/guide/getting-started" },
  { text: "Core", link: "/core/" },
  { text: "Forms", link: "/forms/" },
  { text: "Router", link: "/router/" },
  { text: "React", link: "/react/" },
  { text: "Effector compatibility", link: "/effector/" },
  { text: "API", link: "/api/core" },
  { text: "Recipes", link: "/recipes/counter" },
];

const ruNav = [
  { text: "Руководство", link: "/ru/guide/getting-started" },
  { text: "Ядро", link: "/ru/core/" },
  { text: "Формы", link: "/ru/forms/" },
  { text: "Роутер", link: "/ru/router/" },
  { text: "React", link: "/ru/react/" },
  { text: "Совместимость с Effector", link: "/ru/effector/" },
  { text: "API", link: "/ru/api/core" },
  { text: "Рецепты", link: "/ru/recipes/counter" },
];

const enSidebar = [
  {
    text: "Guide",
    items: [
      { text: "Overview", link: "/" },
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
      { text: "Reactions", link: "/core/reactions" },
      { text: "Transactions", link: "/core/transactions" },
      { text: "Lazy models", link: "/core/lazy-models" },
      { text: "Scopes", link: "/core/scopes" },
      { text: "Owners and cleanup", link: "/core/owners" },
      { text: "Low-level kernel", link: "/core/kernel" },
    ],
  },
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
  {
    text: "React",
    items: [
      { text: "Overview", link: "/react/" },
      { text: "useUnit", link: "/react/use-unit" },
      { text: "Models and components", link: "/react/models" },
      { text: "Cached models", link: "/react/cache" },
    ],
  },
  {
    text: "Effector compatibility",
    items: [
      { text: "Overview", link: "/effector/" },
      { text: "Operators", link: "/effector/operators" },
      { text: "Scopes and serialization", link: "/effector/scopes" },
    ],
  },
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
  {
    text: "API",
    items: [
      { text: "@virentia/core", link: "/api/core" },
      { text: "@virentia/react", link: "/api/react" },
      { text: "@virentia/effector", link: "/api/effector" },
      { text: "@virentia/forms", link: "/api/forms" },
    ],
  },
];

const ruSidebar = [
  {
    text: "Руководство",
    items: [
      { text: "Обзор", link: "/ru/" },
      { text: "Начало работы", link: "/ru/guide/getting-started" },
      { text: "Идеология", link: "/ru/guide/ideology" },
      { text: "Внутреннее устройство", link: "/ru/guide/deep-knowledge" },
    ],
  },
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
  {
    text: "React",
    items: [
      { text: "Обзор", link: "/ru/react/" },
      { text: "useUnit", link: "/ru/react/use-unit" },
      { text: "Модели и компоненты", link: "/ru/react/models" },
      { text: "Кешированные модели", link: "/ru/react/cache" },
    ],
  },
  {
    text: "Совместимость с Effector",
    items: [
      { text: "Обзор", link: "/ru/effector/" },
      { text: "Операторы", link: "/ru/effector/operators" },
      { text: "Скоупы и сериализация", link: "/ru/effector/scopes" },
    ],
  },
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
  {
    text: "API",
    items: [
      { text: "@virentia/core", link: "/ru/api/core" },
      { text: "@virentia/react", link: "/ru/api/react" },
      { text: "@virentia/effector", link: "/ru/api/effector" },
      { text: "@virentia/forms", link: "/ru/api/forms" },
    ],
  },
];

export default defineConfig({
  base: "/virentia/",
  cleanUrls: true,
  description: siteDescription,
  head: [
    ["link", { href: "/virentia/logo.svg", rel: "icon", type: "image/svg+xml" }],
    ["meta", { content: "#8f9aff", name: "theme-color" }],
    ["meta", { content: "Virentia", property: "og:title" }],
    ["meta", { content: siteDescription, property: "og:description" }],
    ["meta", { content: "website", property: "og:type" }],
    ["meta", { content: "https://movpushmov.dev/virentia/logo.svg", property: "og:image" }],
  ],
  title: "Virentia",
  themeConfig: {
    footer: {
      copyright: "Copyright © 2026 movpushmov. MIT License.",
    },
    logo: { alt: "Virentia", src: "/logo.svg" },
    search: {
      provider: "local",
    },
  },
  locales: {
    root: {
      description: siteDescription,
      label: "English",
      lang: "en-US",
      title: "Virentia",
      themeConfig: {
        nav: enNav,
        sidebar: enSidebar,
      },
    },
    ru: {
      description: ruSiteDescription,
      label: "Русский",
      lang: "ru-RU",
      link: "/ru/",
      title: "Virentia",
      themeConfig: {
        nav: ruNav,
        sidebar: ruSidebar,
      },
    },
  },
});
