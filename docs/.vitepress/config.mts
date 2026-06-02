import { defineConfig } from "vitepress";
import { enSidebar, ruSidebar } from "./navigation";

const siteDescription = "State manager for applications with complex business logic.";
const ruSiteDescription = "Стейт-менеджер для приложений со сложной бизнес-логикой.";

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
      },
    },
  },
});
