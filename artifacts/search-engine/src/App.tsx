import { Route, Switch } from "wouter";
import SearchPage from "@/pages/SearchPage";
import DocsPage from "@/pages/DocsPage";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <Switch>
      <Route path="/" component={SearchPage} />
      <Route path="/docs" component={DocsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
