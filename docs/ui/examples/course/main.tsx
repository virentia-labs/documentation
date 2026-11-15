/** @jsxImportSource @virentia/ui */
import { render, scope } from "@virentia/ui";
import { Board } from "./Board";

const appScope = scope();
const container = document.getElementById("app")!;
render(() => <Board counters={[
  { label: "Coffee", count: 2 },
  { label: "Tea", count: 5 },
]} />, container, { scope: appScope });
