import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";

// As pages grow (Destinations list, Blog, Admin, etc.) add routes here.
// Once this file gets long, split into src/routes/AppRoutes.jsx.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="*" element={<div className="p-10 text-center">404 - Page not found</div>} />
    </Routes>
  );
}
