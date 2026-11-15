<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useData, withBase } from "vitepress";
import data from "../data/home-performance.json";

type Suite = keyof typeof data.results;
type Result = { suite: Suite; unit: "ms" | "MiB"; rows: { variant: string; value: number }[] };
type Test = { id: string; option: string; measure: string; description: string; note?: string; anchor: string };
type AreaCopy = {
  label: string; comparison: string; title: string; description: string; note: string;
  detail: string; link: string; virentia: string; tests: Test[];
};

const results = data.tests as unknown as Record<string, Result>;
const { lang } = useData();
const russian = computed(() => lang.value.startsWith("ru"));
const doc = (path: string) => withBase(`${russian.value ? "/ru" : ""}${path}`);
const areas = ["mutable", "models", "ui", "core"] as const;
type Area = typeof areas[number];
const active = ref<Area>("mutable");
const choices = ref<Record<Area, number>>({ mutable: 0, models: 0, ui: 0, core: 0 });
const format = (value: number) => new Intl.NumberFormat(russian.value ? "ru-RU" : "en-US",
  { maximumFractionDigits: value >= 100 ? 0 : value >= 10 ? 1 : 2 }).format(value);

const ru = {
  eyebrow: "Производительность",
  title: "Измеряем производительность в разных задачах.",
  description: "От изменения данных до обновления интерфейса. Сравни Virentia с Immer, MobX, Reatom, Effector, Redux, React, Vue, Solid и $mol, посмотри условия и запусти тот же код у себя.",
  tabs: "Области производительности", scenario: "Сценарий замера",
  lower: "Меньше — лучше", units: { ms: "мс", MiB: "МиБ" }, chart: "Результаты сравнения",
  methodology: "Методика и код стендов", data: "Исходные результаты",
  machine: "Ноутбук: Apple M1 Max, 10 ядер",
  medians: {
    node: "Медиана 5 отдельных процессов после прогрева.",
    ui: "Медиана 48 раундов из четырёх прогонов в браузере.",
    "core-comparison": "Медиана замеров из 3 отдельных процессов после прогрева.",
    "ui-comparison": "Медиана 30–60 замеров из трёх прогонов после прогрева, полный GC перед каждой операцией.",
  } as Record<Suite, string>,
  measured: "Замеры от 8 ноября 2026 года.", commit: "Снимок библиотеки",
  worktree: "с незакоммиченными изменениями рабочего дерева",
  names: { "virentia-noindex": "Virentia без индекса", vanilla: "Чистый DOM", "virentia-records": "Virentia, записи",
    "effector-factory": "Effector, фабрика" } as Record<string, string>,
  areas: {
    mutable: { label: "Mutable", comparison: "Immer / Mutative", title: "Повторные записи в большой массив",
      description: "Массив из 50 000 объектов живёт между обновлениями. В каждом обновлении увеличиваем одно поле у выбранных элементов.",
      note: "Virentia draft повторно меняет owned-объекты, а Immer и Mutative создают immutable-результат. Заморозка отключена у обеих библиотек. Здесь нет реактивных подписчиков и полного store runtime.",
      detail: "Как работает mutable", link: "/mutable/", virentia: "Virentia draft",
      tests: [
        { id: "mutable-1000", option: "1 000 элементов", measure: "Время одного обновления", description: "Обновление меняет 1 000 элементов, равномерно распределённых по массиву.", anchor: "mutable" },
        { id: "mutable-5000", option: "5 000 элементов", measure: "Время одного обновления", description: "Обновление меняет 5 000 элементов, равномерно распределённых по массиву.", anchor: "mutable" },
        { id: "mutable-50000", option: "Все 50 000", measure: "Время одного обновления", description: "Обновление меняет все 50 000 элементов массива.", anchor: "mutable" },
      ] },
    models: { label: "Models", comparison: "MobX / Reatom / Effector / Redux", title: "Модели и списки сущностей",
      description: "Создание экземпляров staticModel и операции списка задач: создать, переключить, удалить.",
      note: "Каждая библиотека написана идиоматично: staticModel с событиями, класс MobX, атомы Reatom, фабрика юнитов или нормализованный стор Effector, entity adapter Redux Toolkit. Модели с реактивностью на экземпляр и записи в одном сторе сравниваются отдельно. Virentia считает выполненные задачи по индексу поля; вариант без индекса сканирует список, как остальные.",
      detail: "Как устроен staticModel", link: "/models/kinds", virentia: "Virentia staticModel",
      tests: [
        { id: "models-create", option: "Создание", measure: "Создание 10 000 реактивных экземпляров",
          description: "У каждого экземпляра свои наблюдаемые поля count, title и active, операция увеличения счётчика и производное значение. staticModel разделяет определение графа между экземплярами.",
          note: "Virentia создаёт экземпляры через Model.create в scope, MobX — класс с makeObservable, Reatom — атомы, computed и action на экземпляр. В ядре Effector моделей экземпляров нет: фабрика создаёт стор на поле, событие с .on и стор .map на экземпляр. Записи в одном сторе — отдельный сценарий. Определение модели, вызовы методов и чтение производных значений идут вне таймера.", anchor: "models-reactive" },
        { id: "models-heap", option: "Память", measure: "Heap после создания 10 000 реактивных экземпляров",
          description: "Прирост JS heap после GC при живых экземплярах, до первого чтения производных значений.",
          note: "Включает внутренние структуры и учёт коллекции. Это не RSS и не размер полезных данных одного экземпляра.", anchor: "models-reactive" },
        { id: "models-records-create", option: "Записи: создание", measure: "10 000 записей в одном сторе",
          description: "Коллекция — один стор с простыми записями: одно событие или action добавляет все, производное значение считается при чтении. Своей реактивности у отдельной записи нет.",
          note: "Effector — стор и события с .on, Redux Toolkit — entity adapter, Virentia — store и события в scope тем же способом. Время уходит в основном на сборку самих записей.", anchor: "models-records" },
        { id: "models-records-heap", option: "Записи: память", measure: "Heap после 10 000 записей в одном сторе",
          description: "Прирост JS heap после GC при живых записях.",
          note: "Это не RSS и не размер полезных данных одной записи.", anchor: "models-records" },
        { id: "todos-create", option: "Todos: создать", measure: "Создание 10 000 задач",
          description: "У задачи название и флаг выполнения. На флаг каждой задачи подписан наблюдатель, на число выполненных — общий наблюдатель.", anchor: "todos" },
        { id: "todos-toggle", option: "Todos: по одной", measure: "Переключить каждую 10-ю из 1 000",
          description: "100 отдельных обновлений: каждое переключает одну задачу и доходит до её наблюдателя и общего счётчика.", anchor: "todos" },
        { id: "todos-toggle-all", option: "Todos: все сразу", measure: "Переключить все 10 000 одной операцией",
          description: "Одно действие переключает все задачи. Наблюдатель каждой задачи срабатывает один раз.", anchor: "todos" },
        { id: "todos-remove", option: "Todos: удалить", measure: "Отписаться и удалить 10 000 задач",
          description: "Снимаются все наблюдатели, затем список задач очищается.", anchor: "todos" },
      ] },
    ui: { label: "UI", comparison: "React / Vue / Vue Vapor / Solid / $mol", title: "Таблицы и списки строк",
      description: "Первый рендер, добавление и обновление строк. Production-сборки, одинаковый DOM у всех реализаций.",
      note: "Строка js-framework-benchmark: компонент с состоянием выделения, реактивной меткой и двумя обработчиками. Virentia: модели строк, For и компонент с моделью, JSX собран компилятором шаблонов @virentia/ui/vite. React — memo и useState, Vue — SFC и shallowRef, Vue Vapor — те же SFC в режиме Vapor (3.6.0-rc.13), Solid — For и сигналы, $mol — $mol_jsx_view. Свежий контекст браузера на сценарий.",
      detail: "Реактивные интерфейсы", link: "/ui/", virentia: "Virentia UI",
      tests: [
        { id: "ui-rows-1000", option: "Строки: 1 000", measure: "Mount 1 000 строк",
          description: "Корень с 1 000 строк js-framework-benchmark: 4 ячейки, ссылка и иконка. Mount включает создание состояния строк из массива данных.", anchor: "ui-rows" },
        { id: "ui-rows-10000", option: "Строки: 10 000", measure: "Mount 10 000 строк",
          description: "Те же строки, 10 000 штук.", anchor: "ui-rows" },
        { id: "ui-create-10000", option: "Добавить 10 000", measure: "Создать 10 000 строк в смонтированном списке",
          description: "Приложение уже смонтировано; строки создаются в состоянии списка, и список их отрисовывает. Как create rows в js-framework-benchmark.", anchor: "ui-rows" },
        { id: "ui-update-tenth", option: "Обновить 1/10", measure: "Обновить каждую 10-ю из 10 000 строк",
          description: "Лёгкие строки с состоянием: номер и счётчик. 1 000 счётчиков меняются одним пакетом.",
          note: "Строка <tr><td>id</td><td>{count}</td></tr>: у Virentia — компонент со staticModel на строку, у React — useState и flushSync, у Vue — shallowRef и nextTick, у Solid — сигнал, у $mol — $mol_mem. Время до обновлённого DOM, GC перед каждой операцией, свежий контекст браузера на сценарий.", anchor: "ui-rows" },
        { id: "ui-table-mount", option: "Таблица: первый рендер", measure: "Время до готового DOM",
          description: "1 000 строк-компонентов с локальным состоянием: номер и счётчик. Каждый фреймворк собран своим компилятором, если он есть.",
          note: "Production-сборки с обычным планированием React и Vue. Virentia — компилятор шаблонов, Vue — SFC, Vue Vapor — SFC в режиме Vapor (3.6.0-rc.13), Solid — babel-preset-solid, $mol — прямые вызовы $mol_jsx. Время до фиксации DOM без ожидания кадров и принудительного layout или paint; проверки ячеек вне таймера.", anchor: "ui" },
        { id: "ui-table-update", option: "Таблица: обновление", measure: "Обновление 100 строк × 25 пакетов",
          description: "Каждая десятая из 1 000 строк обновляется в 25 пакетах; показана сумма времени пакетов.",
          note: "Production-сборки с обычным планированием React и Vue. Virentia — компилятор шаблонов, Vue — SFC, Vue Vapor — SFC в режиме Vapor (3.6.0-rc.13), Solid — babel-preset-solid, $mol — прямые вызовы $mol_jsx. Время до фиксации DOM без ожидания кадров и принудительного layout или paint; проверки ячеек вне таймера.", anchor: "ui" },
      ] },
    core: { label: "Core", comparison: "Effector / MobX / Reatom / Redux", title: "Реактивный граф и события",
      description: "Обработка событий, создание графа и распространение изменений через computed.",
      note: "Графовые сценарии идут через общий тонкий адаптер: signal, computed, observe, write, batch. Effector использует map и combine, Redux — reselect и подписчиков в стиле useSelector. Каждое изменение доходит до всех наблюдателей до возврата.",
      detail: "Устройство реактивного ядра", link: "/core/", virentia: "Virentia Core",
      tests: [
        { id: "core-events", option: "События в scope", measure: "10 000 событий → 10 сторов",
          description: "10 000 последовательных событий обновляют по 10 числовых сторов в изолированном scope. Каждый вызов ожидает завершения обработки.",
          note: "Virentia использует scoped и awaited event, Effector — fork и allSettled с 10 on-обработчиками. У MobX и Reatom нет scope: одно действие пишет 10 значений; у Redux — свой стор и один редьюсер на 10 счётчиков. Каждый вызов ожидается через await; создание графа и проверка результата исключены.", anchor: "core" },
        { id: "graph-create", option: "Создать граф", measure: "10 000 × store → computed → подписка",
          description: "Создание 10 000 независимых цепочек: источник, производное значение и наблюдатель.", anchor: "graph" },
        { id: "graph-fanout", option: "1 → 10 000", measure: "10 записей в источник 10 000 computed",
          description: "Один источник, 10 000 производных значений с наблюдателями; источник меняется 10 раз.", anchor: "graph" },
        { id: "graph-chain", option: "Цепочка", measure: "10 записей в цепочку из 500 computed",
          description: "Цепочка глубины 500 с наблюдателем на конце; начало меняется 10 раз.", anchor: "graph" },
        { id: "graph-batch", option: "Батч", measure: "10 000 записей одной транзакцией",
          description: "Все 10 000 источников меняются в одном батче; наблюдатель каждого срабатывает один раз.", anchor: "graph" },
      ] },
  } as Record<Area, AreaCopy>,
};

const en: typeof ru = {
  eyebrow: "Performance", title: "Measure performance across the stack.",
  description: "From changing data to updating the interface. Compare Virentia with Immer, MobX, Reatom, Effector, Redux, React, Vue, Solid, and $mol, inspect the conditions, and run the same code yourself.",
  tabs: "Performance areas", scenario: "Benchmark scenario",
  lower: "Lower is better", units: { ms: "ms", MiB: "MiB" }, chart: "Comparison results",
  methodology: "Methodology and benchmark code", data: "Raw results",
  machine: "Laptop: Apple M1 Max, 10 cores",
  medians: {
    node: "Median of 5 separate, warmed-up processes.",
    ui: "Median of 48 warmed-up browser rounds from four runs.",
    "core-comparison": "Median of measurements from 3 separate, warmed-up processes.",
    "ui-comparison": "Median of 30–60 warmed-up measurements from three runs, full GC before every operation.",
  },
  measured: "Measured on November 8, 2026.", commit: "Library snapshot",
  worktree: "plus uncommitted working-tree changes",
  names: { "virentia-noindex": "Virentia, no index", vanilla: "Vanilla DOM", "virentia-records": "Virentia, records",
    "effector-factory": "Effector, factory" },
  areas: {
    mutable: { label: "Mutable", comparison: "Immer / Mutative", title: "Repeated writes to a large array",
      description: "An array of 50,000 objects lives across updates. Each update increments one field on a selected set of items.",
      note: "Virentia draft reuses owned objects; Immer and Mutative produce immutable results. Freezing is disabled in both libraries. This measures the draft engine without reactive subscribers or the full store runtime.",
      detail: "How mutable works", link: "/mutable/", virentia: "Virentia draft",
      tests: [
        { id: "mutable-1000", option: "1,000 items", measure: "Time per update", description: "Each update changes 1,000 evenly spaced items.", anchor: "mutable" },
        { id: "mutable-5000", option: "5,000 items", measure: "Time per update", description: "Each update changes 5,000 evenly spaced items.", anchor: "mutable" },
        { id: "mutable-50000", option: "All 50,000", measure: "Time per update", description: "Each update changes all 50,000 items.", anchor: "mutable" },
      ] },
    models: { label: "Models", comparison: "MobX / Reatom / Effector / Redux", title: "Models and entity lists",
      description: "Creating staticModel instances and the operations of a todo list: create, toggle, remove.",
      note: "Each library is written idiomatically: staticModel with events, a MobX class, Reatom atoms, an Effector unit factory or normalized store, and a Redux Toolkit entity adapter. Models with per-instance reactivity and records in one store are compared separately. Virentia counts completed todos with a field index; the no-index variant scans the list like the others.",
      detail: "Explore staticModel", link: "/models/kinds", virentia: "Virentia staticModel",
      tests: [
        { id: "models-create", option: "Creation", measure: "Creating 10,000 reactive instances",
          description: "Every instance has its own observable count, title, and active fields, an increment operation, and a derived value. staticModel shares the graph definition across instances.",
          note: "Virentia creates instances with Model.create in a scope, MobX uses a class with makeObservable, and Reatom creates atoms, a computed, and an action per instance. Effector has no instance models in its core: a factory creates a store per field, an event with .on, and a .map store per instance. Records in one store are a separate scenario. Model declaration, method calls, and derived reads are outside the timer.", anchor: "models-reactive" },
        { id: "models-heap", option: "Memory", measure: "Heap after creating 10,000 reactive instances",
          description: "Additional JS heap after GC with live instances, before the first derived read.",
          note: "Includes internal structures and collection bookkeeping. This is neither RSS nor the payload size of one instance.", anchor: "models-reactive" },
        { id: "models-records-create", option: "Records: creation", measure: "10,000 records in one store",
          description: "A collection is one store of plain records: one event or action adds them all, and the derived value is computed when read. A single record has no reactivity of its own.",
          note: "Effector uses a store and events with .on, Redux Toolkit an entity adapter, and Virentia a store and events in a scope the same way. The time goes mostly into building the records.", anchor: "models-records" },
        { id: "models-records-heap", option: "Records: memory", measure: "Heap after 10,000 records in one store",
          description: "Additional JS heap after GC with live records.",
          note: "This is neither RSS nor the payload size of one record.", anchor: "models-records" },
        { id: "todos-create", option: "Todos: create", measure: "Creating 10,000 todos",
          description: "A todo has a title and a done flag. Every todo’s flag has an observer, and one more observer follows the number of completed todos.", anchor: "todos" },
        { id: "todos-toggle", option: "Todos: one by one", measure: "Toggle every 10th of 1,000",
          description: "100 separate updates: each toggles one todo and reaches its observer and the shared counter.", anchor: "todos" },
        { id: "todos-toggle-all", option: "Todos: all at once", measure: "Toggle all 10,000 in one operation",
          description: "One action toggles every todo. Each todo’s observer runs once.", anchor: "todos" },
        { id: "todos-remove", option: "Todos: remove", measure: "Unsubscribe and remove 10,000 todos",
          description: "All observers are removed, then the todo list is cleared.", anchor: "todos" },
      ] },
    ui: { label: "UI", comparison: "React / Vue / Vue Vapor / Solid / $mol", title: "Tables and lists of rows",
      description: "Initial render, adding rows, and updating them. Production builds with the same DOM in every implementation.",
      note: "A js-framework-benchmark row is a component with selection state, a reactive label, and two handlers. Virentia uses row models, For, and a component with a model, with JSX compiled by the @virentia/ui/vite template compiler. React uses memo and useState, Vue uses SFCs and shallowRef, Vue Vapor uses the same SFCs in Vapor mode (3.6.0-rc.13), Solid uses For and signals, and $mol uses $mol_jsx_view. Each scenario runs in a fresh browser context.",
      detail: "Build reactive interfaces", link: "/ui/", virentia: "Virentia UI",
      tests: [
        { id: "ui-rows-1000", option: "Rows: 1,000", measure: "Mount 1,000 rows",
          description: "A root with 1,000 js-framework-benchmark rows: four cells, a link, and an icon. Mount includes creating row state from the data array.", anchor: "ui-rows" },
        { id: "ui-rows-10000", option: "Rows: 10,000", measure: "Mount 10,000 rows",
          description: "The same rows, 10,000 of them.", anchor: "ui-rows" },
        { id: "ui-create-10000", option: "Add 10,000", measure: "Create 10,000 rows in a mounted list",
          description: "The app is already mounted; rows are created in the list state and the list renders them, like js-framework-benchmark’s create rows.", anchor: "ui-rows" },
        { id: "ui-update-tenth", option: "Update 1/10", measure: "Update every 10th of 10,000 rows",
          description: "Light rows with state: an ID and a counter. 1,000 counters change in one batch.",
          note: "A <tr><td>id</td><td>{count}</td></tr> row: a component with a staticModel per row in Virentia, useState with flushSync in React, shallowRef with nextTick in Vue, a signal in Solid, and $mol_mem in $mol. Timing runs until the DOM is updated, with a GC before every operation and a fresh browser context per scenario.", anchor: "ui-rows" },
        { id: "ui-table-mount", option: "Table: initial render", measure: "Time until DOM commit",
          description: "1,000 row components with local state: an ID and a counter. Every framework is built with its compiler, if it has one.",
          note: "Production builds with React’s and Vue’s normal scheduling. Virentia uses its template compiler, Vue SFCs, Vue Vapor the same SFCs in Vapor mode (3.6.0-rc.13), Solid babel-preset-solid, and $mol calls $mol_jsx directly. Timing runs through DOM commit without frame waits or forced layout and paint; cell assertions are outside the timer.", anchor: "ui" },
        { id: "ui-table-update", option: "Table: update", measure: "Update 100 rows × 25 batches",
          description: "Every tenth of 1,000 rows updates in 25 batches; the chart shows their total time.",
          note: "Production builds with React’s and Vue’s normal scheduling. Virentia uses its template compiler, Vue SFCs, Vue Vapor the same SFCs in Vapor mode (3.6.0-rc.13), Solid babel-preset-solid, and $mol calls $mol_jsx directly. Timing runs through DOM commit without frame waits or forced layout and paint; cell assertions are outside the timer.", anchor: "ui" },
      ] },
    core: { label: "Core", comparison: "Effector / MobX / Reatom / Redux", title: "Reactive graph and events",
      description: "Handling events, building a graph, and propagating changes through computed values.",
      note: "Graph scenarios share a thin adapter: signal, computed, observe, write, and batch. Effector uses map and combine; Redux uses reselect and useSelector-style subscribers. Every change reaches all observers before the call returns.",
      detail: "Explore the reactive core", link: "/core/", virentia: "Virentia Core",
      tests: [
        { id: "core-events", option: "Scoped events", measure: "10,000 events → 10 stores",
          description: "10,000 sequential events each update 10 numeric stores in an isolated scope. Every call awaits completion.",
          note: "Virentia uses scoped and an awaited event; Effector uses fork and allSettled with 10 on handlers. MobX and Reatom have no scopes: one action writes 10 values. Redux has its own store with one reducer for the 10 counters. Every call is awaited; graph construction and result assertions are excluded.", anchor: "core" },
        { id: "graph-create", option: "Build a graph", measure: "10,000 × store → computed → subscription",
          description: "Creating 10,000 independent chains: a source, a derived value, and an observer.", anchor: "graph" },
        { id: "graph-fanout", option: "1 → 10,000", measure: "10 writes to a source of 10,000 computed",
          description: "One source, 10,000 derived values with observers; the source changes 10 times.", anchor: "graph" },
        { id: "graph-chain", option: "Chain", measure: "10 writes to a chain of 500 computed",
          description: "A chain 500 levels deep with an observer at the end; its head changes 10 times.", anchor: "graph" },
        { id: "graph-batch", option: "Batch", measure: "10,000 writes in one transaction",
          description: "All 10,000 sources change in one batch; each observer runs once.", anchor: "graph" },
      ] },
  },
};

const copy = computed(() => russian.value ? ru : en);
const area = computed(() => copy.value.areas[active.value]);
const test = computed(() => area.value.tests[choices.value[active.value]]);
const metric = computed(() => {
  const result = results[test.value.id];
  const names: Record<string, string> = { virentia: area.value.virentia, immer: "Immer", mutative: "Mutative", mobx: "MobX",
    reatom: "Reatom", effector: "Effector", redux: "Redux", react: "React", vue: "Vue", "vue-vapor": "Vue Vapor", solid: "Solid", mol: "$mol",
    ...copy.value.names };
  // Fastest (smallest) first.
  const rows = result.rows.map(row => ({ ...row, name: names[row.variant] ?? row.variant }))
    .sort((left, right) => left.value - right.value);
  return { rows, max: Math.max(...rows.map(row => row.value)), unit: copy.value.units[result.unit], suite: result.suite };
});
const environment = computed(() => {
  const runtime = metric.value.suite === "node" || metric.value.suite === "core-comparison"
    ? `Node ${data.environment.node}` : data.environment.browser;
  return `${copy.value.machine} · ${runtime}`;
});

async function onTabKey(event: KeyboardEvent, current: Area) {
  const index = areas.indexOf(current);
  const next = event.key === "Home" ? 0 : event.key === "End" ? areas.length - 1
    : ["ArrowRight", "ArrowDown"].includes(event.key) ? (index + 1) % areas.length
    : ["ArrowLeft", "ArrowUp"].includes(event.key) ? (index + areas.length - 1) % areas.length : -1;
  if (next < 0) return;
  event.preventDefault(); active.value = areas[next];
  await nextTick(); document.getElementById(`vh-perf-tab-${active.value}`)?.focus();
}
</script>

<template>
  <section id="performance" class="vh-performance" aria-labelledby="vh-performance-title">
    <div class="vh-section-heading">
      <div><p class="vh-eyebrow">{{ copy.eyebrow }}</p><h2 id="vh-performance-title">{{ copy.title }}</h2></div>
      <p>{{ copy.description }}</p>
    </div>

    <div class="vh-perf-tabs" role="tablist" :aria-label="copy.tabs">
      <button v-for="item in areas" :id="`vh-perf-tab-${item}`" :key="item" type="button" role="tab"
        :aria-selected="active === item" :aria-controls="`vh-perf-panel-${item}`" :tabindex="active === item ? 0 : -1"
        @click="active = item" @keydown="onTabKey($event, item)">
        <span>{{ copy.areas[item].label }}</span><small>{{ copy.areas[item].comparison }}</small>
      </button>
    </div>

    <div v-for="item in areas" v-show="active === item" :id="`vh-perf-panel-${item}`" :key="item"
      class="vh-perf-panel" role="tabpanel" :aria-labelledby="`vh-perf-tab-${item}`" tabindex="0">
      <template v-if="active === item">
        <div class="vh-perf-context">
          <h3>{{ area.title }}</h3><p class="vh-perf-description">{{ area.description }}</p>
          <div class="vh-perf-options" role="group" :aria-label="copy.scenario">
            <button v-for="(option, index) in area.tests" :key="option.id" type="button" :aria-pressed="choices[active] === index" @click="choices[active] = index">{{ option.option }}</button>
          </div>
          <p class="vh-perf-test">{{ test.description }}</p>
          <a class="vh-text-link" :href="doc(area.link)">{{ area.detail }}<span aria-hidden="true">↗</span></a>
        </div>

        <figure class="vh-perf-chart" :aria-label="copy.chart">
          <figcaption><span>{{ test.measure }}</span><small>{{ metric.unit }} · {{ copy.lower }}</small></figcaption>
          <div v-for="row in metric.rows" :key="row.variant" class="vh-perf-row" :class="{ 'is-virentia': row.variant.startsWith('virentia') }">
            <div class="vh-perf-label"><span>{{ row.name }}</span><strong>{{ format(row.value) }} <small>{{ metric.unit }}</small></strong></div>
            <div class="vh-perf-track" aria-hidden="true"><div :style="{ width: `${row.value / metric.max * 100}%` }"></div></div>
          </div>
          <p class="vh-perf-environment">{{ environment }}<br />{{ copy.medians[metric.suite] }}</p>
        </figure>

        <div class="vh-perf-details">
          <p>{{ test.note ?? area.note }}</p>
          <div class="vh-perf-links">
            <a class="vh-text-link" :href="`${doc('/performance')}#${test.anchor}`">{{ copy.methodology }}<span aria-hidden="true">↗</span></a>
            <a class="vh-perf-source" :href="withBase(data.results[metric.suite])">{{ copy.data }}<span aria-hidden="true">↓</span></a>
          </div>
        </div>
      </template>
    </div>
    <p class="vh-perf-footnote">{{ copy.measured }} {{ copy.commit }} <code>{{ data.commit.slice(0, 7) }}</code>{{ data.worktree ? ` ${copy.worktree}` : "" }}.</p>
  </section>
</template>

<style scoped>
.vh-performance { max-width: 1280px; margin: 0 auto; padding: 28px 64px 100px; scroll-margin-top: 110px; }
.vh-performance .vh-section-heading { align-items: flex-start; }
.vh-performance .vh-section-heading > p { max-width: 410px; padding-top: 7px; }
.vh-performance h2 { max-width: 550px; }
.vh-perf-tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-bottom: 1px solid #b296d947; }
.vh-perf-tabs button { position: relative; min-width: 0; min-height: 86px; padding: 14px 20px 20px; font-size: 1rem; text-align: left; cursor: pointer; }
.vh-perf-tabs button:first-child { padding-left: 0; }
.vh-perf-tabs button::after { position: absolute; right: 0; bottom: -1px; left: 0; height: 2px; background: transparent; content: ""; }
.vh-perf-tabs button[aria-selected="true"]::after { background: #c3a2ed; }
.vh-perf-tabs span { display: block; color: #ddd3e8; font-size: 1.125rem; font-weight: 500; line-height: 1.5; }
.vh-perf-tabs small { display: block; margin-top: 4px; color: var(--vh-subtle); font-size: .875rem; line-height: 1.6; }
.vh-perf-tabs [aria-selected="true"] span { color: #d9bcfa; }
.vh-perf-tabs button:hover span { color: #f5eafa; }
.vh-perf-panel { display: grid; grid-template-columns: 1fr 1fr; gap: 38px 72px; padding: 42px 0 0; }
.vh-perf-panel:focus-visible { outline: 2px solid var(--vh-accent); outline-offset: 8px; }
.vh-perf-context { min-width: 0; }
.vh-perf-context h3 { margin: 0; color: #eae4f1; font-size: 1.625rem; font-weight: 450; line-height: 1.4; letter-spacing: -.6px; }
.vh-perf-description { margin: 17px 0 23px; color: var(--vh-muted); font-size: 1rem; line-height: 1.8; }
.vh-perf-options { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.vh-perf-options button { min-height: 44px; padding: 9px 13px; border: 1px solid #8f789b55; border-radius: 5px; color: #c5b8d0; font-size: .875rem; line-height: 1.6; cursor: pointer; }
.vh-perf-options button[aria-pressed="true"] { border-color: #bc9bf7; background: #b98ee51a; color: #e2ccfa; }
.vh-perf-options button:hover { border-color: #bd9bdf; color: #f3e7fc; }
.vh-perf-test { margin: 0 0 20px; color: #c9bdd5; font-size: .9375rem; line-height: 1.75; }
.vh-perf-chart { min-width: 0; margin: 0; padding-top: 3px; }
.vh-perf-chart figcaption { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px 20px; margin-bottom: 25px; color: #d4c8df; font-size: .9375rem; line-height: 1.6; }
.vh-perf-chart figcaption small { color: var(--vh-subtle); font-size: .875rem; }
.vh-perf-row { margin-bottom: 23px; }
.vh-perf-label { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 5px 18px; color: #c5b9d0; font-size: .9375rem; line-height: 1.7; }
.vh-perf-label strong { color: #e0d5e9; font-size: 1rem; font-weight: 500; font-variant-numeric: tabular-nums; white-space: nowrap; }
.vh-perf-label small { color: inherit; font-size: .875rem; }
.vh-perf-track { height: 10px; overflow: hidden; margin-top: 9px; border-radius: 2px; background: #211a2a; }
.vh-perf-track > div { height: 100%; background: #8b7b9e; }
.vh-perf-row.is-virentia .vh-perf-track > div { background: linear-gradient(90deg, #a87ce0, #d1b1f2); }
.vh-perf-row.is-virentia .vh-perf-label, .vh-perf-row.is-virentia strong { color: #ddc1f8; }
.vh-perf-environment { margin: 25px 0 0; color: var(--vh-subtle); font-size: .875rem; line-height: 1.8; }
.vh-perf-details { display: grid; grid-template-columns: 1fr auto; grid-column: 1 / -1; align-items: start; gap: 50px; padding-top: 24px; border-top: 1px solid var(--vh-line); }
.vh-perf-details > p { max-width: 740px; margin: 0; color: var(--vh-muted); font-size: .9375rem; line-height: 1.8; }
.vh-perf-links { display: flex; align-items: flex-start; flex-direction: column; gap: 8px; }
.vh-perf-source { display: inline-flex; gap: 12px; align-items: center; min-height: 32px; color: #b6a7c4; font-size: .875rem; line-height: 1.6; }
.vh-perf-source:hover { color: #e5d1fa; }
.vh-perf-footnote { margin: 27px 0 0; color: var(--vh-subtle); font-size: .875rem; line-height: 1.8; }
.vh-perf-footnote code { color: #ceb7e2; font-family: var(--vp-font-family-mono); font-size: .875rem; }
@media (max-width: 1199px) {
  .vh-performance { padding-inline: 40px; }
  .vh-perf-panel { column-gap: 40px; }
  .vh-perf-details { gap: 32px; }
}
@media (max-width: 959px) {
  .vh-performance .vh-section-heading { flex-direction: column; gap: 22px; }
  .vh-performance .vh-section-heading > p { max-width: 650px; padding: 0; }
  .vh-perf-panel { column-gap: 28px; }
  .vh-perf-details { grid-template-columns: 1fr; gap: 17px; }
  .vh-perf-links { flex-direction: row; flex-wrap: wrap; gap: 8px 26px; }
}
@media (max-width: 767px) {
  .vh-performance { padding: 0 28px 80px; }
  .vh-perf-tabs { grid-template-columns: repeat(2, minmax(0, 1fr)); border: 0; gap: 0 18px; }
  .vh-perf-tabs button, .vh-perf-tabs button:first-child { min-height: 82px; padding: 15px 0; border-bottom: 1px solid #b296d947; }
  .vh-perf-panel { grid-template-columns: 1fr; gap: 29px; padding-top: 30px; }
  .vh-perf-context h3 { font-size: 1.5rem; }
  .vh-perf-details { grid-column: 1; padding-top: 22px; }
}
@media (max-width: 410px) { .vh-performance { padding-inline: 24px; } }
</style>
