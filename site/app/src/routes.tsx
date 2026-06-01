import { lazy, Suspense } from "react";
import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router";

const RootLayout = lazy(() =>
  import("./layouts/RootLayout").then((m) => ({ default: m.RootLayout })),
);
const DocsLayout = lazy(() =>
  import("./layouts/DocsLayout").then((m) => ({ default: m.DocsLayout })),
);
const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const PlaygroundPage = lazy(() =>
  import("./pages/PlaygroundPage").then((m) => ({ default: m.PlaygroundPage })),
);
const DocsPage = lazy(() =>
  import("./pages/DocsPage").then((m) => ({ default: m.DocsPage })),
);
const ComparisonPage = lazy(() =>
  import("./pages/ComparisonPage").then((m) => ({ default: m.ComparisonPage })),
);

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RootLayout>
        <HomePage />
      </RootLayout>
    </Suspense>
  ),
});

const playgroundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/playground",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <RootLayout>
        <PlaygroundPage />
      </RootLayout>
    </Suspense>
  ),
});

const docsIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <DocsLayout>
        <DocsPage />
      </DocsLayout>
    </Suspense>
  ),
});

const docsSlugRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs/$slug",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <DocsLayout>
        <DocsPage />
      </DocsLayout>
    </Suspense>
  ),
});

const comparisonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs/comparison",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <DocsLayout>
        <ComparisonPage />
      </DocsLayout>
    </Suspense>
  ),
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  playgroundRoute,
  docsIndexRoute,
  comparisonRoute,
  docsSlugRoute,
]);
