import "./App.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Posts from "./pages/Posts";

const queryClient = new QueryClient();
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Posts />
    </QueryClientProvider>
  );
}

export default App;
