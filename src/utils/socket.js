import { io } from 'socket.io-client';

const URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

export const socket = io(URL, {
  transports: ['websocket', 'polling'],
  autoConnect: false,
});

export function connectSocket() {
  if (!socket.connected) socket.connect();
}
