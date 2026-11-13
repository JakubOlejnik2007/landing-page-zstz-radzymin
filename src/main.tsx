import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import './index.css'
import './styles/normalize.css'

import initializeI18n from "./lang/i18n";

async function bootstrap() {
  const languageConfig = await initializeI18n();

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App languageConfig={languageConfig} />
    </React.StrictMode>
  );
}

bootstrap();