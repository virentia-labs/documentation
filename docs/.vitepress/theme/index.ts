import DefaultTheme from "vitepress/theme";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";
import CodeRow from "./components/CodeRow.vue";
import NodeFlow from "./components/NodeFlow.vue";
import Layout from "./Layout.vue";
import "./style.css";

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component("CodeRow", CodeRow);
    app.component("NodeFlow", NodeFlow);
  },
};
