import React, { useEffect, useState } from 'react';
import socket from '../socket';
import ACTIONS from '../socket/actions';
import { useNavigate } from 'react-router-dom';
import { v4 } from 'uuid';

const Main = () => {
	const navigate = useNavigate();
	const [rooms, setRooms] = useState([]);

	useEffect(() => {
		socket.on(ACTIONS.SHARE_ROOMS, ({ rooms = [] }) => {
			setRooms(rooms);
		});
	}, []);

	const onCreateRoom = () => {
		navigate(`/room/${v4()}`);
	};

	const joinRoom = id => () => {
		navigate(`/room/${id}`);
	};

	return (
		<div>
			<h1>Avaiable rooms</h1>

			<ul>
				{rooms.map(roomId => (
					<li key={roomId}>
						<span>{roomId}</span>
						<button onClick={joinRoom(roomId)}>Join room</button>
					</li>
				))}
			</ul>

			<button onClick={onCreateRoom}>Create new room!</button>
		</div>
	);
};

export default Main;
