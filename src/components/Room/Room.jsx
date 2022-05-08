import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import useWebRtc, { LOCAL_VIDEO } from '../../hooks/useWebRtc';
import './Room.css';

const Room = () => {
	const { id: roomId } = useParams();
	const { clients, provideMediaRef } = useWebRtc(roomId);

	const [clientIdOnScreen, setClientIdOnScreen] = useState(LOCAL_VIDEO);

	const changeClientOnTheScreen = clientId => () => {
		setClientIdOnScreen(prev =>
			prev === LOCAL_VIDEO ? clientId : LOCAL_VIDEO
		);
	};

	return (
		<div className='container'>
			{clients.map(clientId => {
				const isLocalVideo = clientId === LOCAL_VIDEO;
				const isShowing = clientIdOnScreen === clientId;

				return (
					<video
						key={clientId}
						className={isShowing ? 'video_local' : 'video_remote'}
						onClick={changeClientOnTheScreen(clientId)}
						autoPlay
						playsInline
						muted={isLocalVideo}
						ref={provideMediaRef(clientId)}
					/>
				);
			})}
		</div>
	);
};

export default Room;
