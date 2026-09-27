import { createRoot } from "react-dom/client";
import HubClient from "./hub-client";

createRoot(document.getElementById("root")!).render(<HubClient />);
