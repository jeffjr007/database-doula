import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Preload mentor image immediately on app load
import mentorPhoto from "@/assets/mentor-photo.png";
const preloadImage = new Image();
preloadImage.src = mentorPhoto;

createRoot(document.getElementById("root")!).render(<App />);
