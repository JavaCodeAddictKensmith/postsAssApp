import { useState } from "react";

import "./App.css";
import axios from "axios";

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
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
