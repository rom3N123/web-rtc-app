import { io } from 'socket.io-client';

const options = {
	transforts: ['websocket'],
};

const socket = io('http://localhost:9999', options);

export default socket;
