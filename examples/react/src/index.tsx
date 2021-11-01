import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import TypesafeI18n from "./i18n/i18n-react";

ReactDOM.render(
  <React.StrictMode>
    <TypesafeI18n initialLocale="en">
      <App />
    </TypesafeI18n>
  </React.StrictMode>,
  document.getElementById("root")
);
