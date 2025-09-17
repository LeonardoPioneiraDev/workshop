// src/App.tsx
import { BrowserRouter } from "react-router-dom";
import "./charts/chartConfig";
import { FiltrosProvider } from "./contexts/FiltrosContext";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <FiltrosProvider>
      <BrowserRouter>
        <div className="bg-background min-h-screen w-full">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </FiltrosProvider>
  );
}

export default App;
