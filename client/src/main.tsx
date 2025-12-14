import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { pushNotificationService } from "./lib/pushNotifications";

// Initialize push notifications
pushNotificationService.initialize().catch(console.error);

createRoot(document.getElementById("root")!).render(<App />);
