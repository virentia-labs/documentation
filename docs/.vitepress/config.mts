import { defineConfig } from "vitepress";
import { enSidebar, ruSidebar } from "./navigation";
import { lightTheme, darkTheme } from "./theme/syntax-themes.mjs";

const siteDescription =
  "The reactive stack for complex business logic — the application lives in the model, not in the UI.";
const ruSiteDescription =
  "Реактивный стек для сложной бизнес-логики: приложение живёт в модели, а не в UI.";

export default defineConfig({
  appearance: "dark",
  base: "/virentia/",
  markdown: { theme: { light: lightTheme, dark: darkTheme } },
  cleanUrls: true,
  description: siteDescription,
  head: [
    ["link", { href: "/virentia/logo.svg", rel: "icon", type: "image/svg+xml" }],
    ["meta", { content: "#08080d", name: "theme-color" }],
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
      options: {
        locales: {
          ru: {
            translations: {
              button: { buttonText: "Поиск", buttonAriaLabel: "Поиск по документации" },
              modal: {
                noResultsText: "Ничего не найдено",
                resetButtonTitle: "Очистить поиск",
                backButtonTitle: "Закрыть поиск",
                displayDetails: "Показать подробности",
                footer: { selectText: "выбрать", navigateText: "перейти", closeText: "закрыть" },
              },
            },
          },
        },
      },
    },
    socialLinks: [{ icon: "github", link: "https://github.com/virentia-labs/virentia" }],
  },
  locales: {
    root: {
      description: siteDescription,
      label: "English",
      lang: "en-US",
      title: "Virentia",
      themeConfig: {
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
        sidebar: ruSidebar,
        outline: { label: "На этой странице" },
        sidebarMenuLabel: "Содержание",
        skipToContentLabel: "Перейти к содержимому",
        returnToTopLabel: "К началу страницы",
        docFooter: { prev: "Предыдущая страница", next: "Следующая страница" },
        langMenuLabel: "Выбрать язык",
        darkModeSwitchLabel: "Цветовая тема",
        lightModeSwitchTitle: "Включить светлую тему",
        darkModeSwitchTitle: "Включить тёмную тему",
      },
    },
  },
});
