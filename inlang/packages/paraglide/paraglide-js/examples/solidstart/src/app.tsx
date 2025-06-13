import { Route, Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { Match, Suspense, Switch } from 'solid-js';

import "./app.css";

import MainLayout from './ui/layout/main-layout';
import { getLocale } from './paraglide/runtime';
import Home from './routes/[lang]';
import About from './routes/[lang]/about';
import NotFound from './routes/[...404]';

export default function App() {
  return (
    <Router
      root={(props) => (
        <MainLayout>
          <Suspense>{props.children}</Suspense>
        </MainLayout>
      )}
    >
      <Switch fallback={<FileRoutes />}>
        <Match when={getLocale() === "de"}>
          <Route path="/de/" component={Home} />
          <Route path="/de/ueber-uns" component={About} />
          <Route path="*404" component={NotFound} />
        </Match>
      </Switch>
    </Router>
  );
}
