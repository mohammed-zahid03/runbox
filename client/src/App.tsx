import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import InterviewRoom from "./pages/InterviewRoom";
import VerbalRoom from "./pages/VerbalRoom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/room/:id" element={<InterviewRoom />} />
        <Route path="/room/verbal/:id" element={<VerbalRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;