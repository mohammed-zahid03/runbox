import { io } from "socket.io-client";

// Connect to the Backend URL (Port 5000)
export const socket = io("http://localhost:5000");