import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Preload critical images immediately on app load
import mentorPhoto from "@/assets/mentor-photo.png";
import logoAd from "@/assets/logo-ad.png";

const preloadMentor = new Image();
preloadMentor.src = mentorPhoto;

const preloadLogo = new Image();
preloadLogo.src = logoAd;

createRoot(document.getElementById("root")!).render(<App />);
