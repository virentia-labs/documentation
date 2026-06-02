<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useData, useRoute, withBase } from "vitepress";
import {
  docsSections,
  type LocaleKey,
  type SectionNavItem,
  type SectionNavLink,
} from "../../navigation";

const props = withDefaults(
  defineProps<{
    mode?: "bar" | "screen";
  }>(),
  {
    mode: "bar",
  },
);

const route = useRoute();
const { site } = useData();
const closeScreen = inject<() => void>("close-screen", () => {});
const root = ref<HTMLElement | null>(null);
const openMenu = ref<string | null>(null);

const currentPath = computed(() => stripBase(route.path, site.value.base));
const locale = computed<LocaleKey>(() => (currentPath.value.startsWith("/ru/") ? "ru" : "en"));
const currentSection = computed(
  () =>
    docsSections.find((section) =>
      section.match[locale.value].some((match) => matchesSection(currentPath.value, match)),
    ) ?? docsSections[0],
);
const sectionLinks = computed(() =>
  docsSections.map((section) => ({
    id: section.id,
    text: section.label[locale.value],
    link: section.link[locale.value],
    active: section.id === currentSection.value.id,
  })),
);
const currentNav = computed(() => currentSection.value.nav[locale.value]);
const labels = computed(() =>
  locale.value === "ru"
    ? {
        current: "Текущий раздел",
        section: "Раздел",
        sections: "Разделы",
      }
    : {
        current: "Current section",
        section: "Section",
        sections: "Sections",
      },
);

function isLink(item: SectionNavItem): item is SectionNavLink {
  return "link" in item;
}

function isActive(link: string): boolean {
  const path = trimTrailingSlash(currentPath.value);
  const target = trimTrailingSlash(link);

  return path === target;
}

function hasActiveItem(item: SectionNavItem): boolean {
  return isLink(item) ? isActive(item.link) : item.items.some((link) => isActive(link.link));
}

function toggleMenu(id: string): void {
  openMenu.value = openMenu.value === id ? null : id;
}

function closeMenus(): void {
  openMenu.value = null;
}

function navigate(): void {
  closeMenus();

  if (props.mode === "screen") {
    closeScreen();
  }
}

function onDocumentClick(event: MouseEvent): void {
  if (!root.value?.contains(event.target as Node)) {
    closeMenus();
  }
}

function onDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    closeMenus();
  }
}

function href(link: string): string {
  return withBase(link);
}

function matchesSection(path: string, match: string): boolean {
  if (match === "/" || match === "/ru/") {
    return path === match;
  }

  return path === match || path.startsWith(match);
}

function stripBase(path: string, base: string): string {
  if (base !== "/" && path.startsWith(base)) {
    return path.slice(base.length - 1) || "/";
  }

  return path;
}

function trimTrailingSlash(path: string): string {
  return path.length > 1 ? path.replace(/\/$/, "") : path;
}

watch(
  () => route.path,
  () => closeMenus(),
);

onMounted(() => {
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onDocumentKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
  document.removeEventListener("keydown", onDocumentKeydown);
});
</script>

<template>
  <nav
    ref="root"
    class="section-nav"
    :class="`section-nav--${mode}`"
    aria-label="Documentation navigation"
  >
    <template v-if="mode === 'bar'">
      <div class="section-nav__switcher" :class="{ 'is-open': openMenu === 'sections' }">
        <button
          class="section-nav__switcher-button"
          type="button"
          :aria-expanded="openMenu === 'sections'"
          aria-haspopup="menu"
          @click.stop="toggleMenu('sections')"
        >
          <span>{{ labels.section }}</span>
          <strong>{{ currentSection.label[locale] }}</strong>
        </button>
        <div v-if="openMenu === 'sections'" class="section-nav__menu" role="menu">
          <a
            v-for="section in sectionLinks"
            :key="section.id"
            class="section-nav__menu-link"
            :class="{ 'is-active': section.active }"
            :href="href(section.link)"
            :aria-current="section.active ? 'page' : undefined"
            role="menuitem"
            @click="navigate"
          >
            {{ section.text }}
          </a>
        </div>
      </div>

      <div class="section-nav__items">
        <template v-for="(item, index) in currentNav" :key="JSON.stringify(item)">
          <a
            v-if="isLink(item)"
            class="section-nav__link"
            :class="{ 'is-active': isActive(item.link) }"
            :href="href(item.link)"
            :aria-current="isActive(item.link) ? 'page' : undefined"
            @click="navigate"
          >
            {{ item.text }}
          </a>
          <div
            v-else
            class="section-nav__group"
            :class="{
              'is-active': hasActiveItem(item),
              'is-open': openMenu === `group-${index}`,
            }"
          >
            <button
              class="section-nav__group-button"
              type="button"
              :aria-expanded="openMenu === `group-${index}`"
              aria-haspopup="menu"
              @click.stop="toggleMenu(`group-${index}`)"
            >
              {{ item.text }}
            </button>
            <div v-if="openMenu === `group-${index}`" class="section-nav__menu" role="menu">
              <a
                v-for="link in item.items"
                :key="link.link"
                class="section-nav__menu-link"
                :class="{ 'is-active': isActive(link.link) }"
                :href="href(link.link)"
                :aria-current="isActive(link.link) ? 'page' : undefined"
                role="menuitem"
                @click="navigate"
              >
                {{ link.text }}
              </a>
            </div>
          </div>
        </template>
      </div>
    </template>

    <template v-else>
      <p class="section-nav__screen-label">{{ labels.sections }}</p>
      <div class="section-nav__screen-sections">
        <a
          v-for="section in sectionLinks"
          :key="section.id"
          class="section-nav__screen-link"
          :class="{ 'is-active': section.active }"
          :href="href(section.link)"
          :aria-current="section.active ? 'page' : undefined"
          @click="navigate"
        >
          {{ section.text }}
        </a>
      </div>

      <p class="section-nav__screen-label">{{ labels.current }}</p>
      <div class="section-nav__screen-current">
        <template v-for="item in currentNav" :key="JSON.stringify(item)">
          <a
            v-if="isLink(item)"
            class="section-nav__screen-link"
            :class="{ 'is-active': isActive(item.link) }"
            :href="href(item.link)"
            :aria-current="isActive(item.link) ? 'page' : undefined"
            @click="navigate"
          >
            {{ item.text }}
          </a>
          <div v-else class="section-nav__screen-group">
            <span>{{ item.text }}</span>
            <a
              v-for="link in item.items"
              :key="link.link"
              class="section-nav__screen-link"
              :class="{ 'is-active': isActive(link.link) }"
              :href="href(link.link)"
              :aria-current="isActive(link.link) ? 'page' : undefined"
              @click="navigate"
            >
              {{ link.text }}
            </a>
          </div>
        </template>
      </div>
    </template>
  </nav>
</template>
