import DefaultTheme from "vitepress/theme";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";
import CodeRow from "./components/CodeRow.vue";
import NodeFlow from "./components/NodeFlow.vue";
import UIFlow from "./components/UIFlow.vue";
import UIWalkthrough from "./components/UIWalkthrough.vue";
import Layout from "./Layout.vue";
import "./brand.css";
import "./style.css";
import "./doc.css";

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component("CodeRow", CodeRow);
    app.component("NodeFlow", NodeFlow);
    app.component("UIFlow", UIFlow);
    app.component("UIWalkthrough", UIWalkthrough);
  },
};
