import ReactDOM from "react-dom/client";
import React from "react";
import { App } from "./App";

const rootElement = document.getElementById("react-root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
