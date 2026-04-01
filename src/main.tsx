import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Load saved theme
const savedTheme = localStorage.getItem("railsync_theme");
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(<App />);
