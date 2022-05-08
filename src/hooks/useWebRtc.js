import { useEffect, useRef } from 'react';
import useStateWithCallback from './useStateWithCallback';
import socket from '../socket';
import ACTIONS from '../socket/actions';
import freeice from 'freeice';

export const LOCAL_VIDEO = 'LOCAL_VIDEO';

const useWebRtc = roomId => {
	const [clients, setClients] = useStateWithCallback([]);

	const peerConnections = useRef({});
	const localMediaStream = useRef(null);
	const peerMediaElements = useRef({
		[LOCAL_VIDEO]: null,
	});

	const provideMediaRef = clientId => videoNode => {
		peerMediaElements.current[clientId] = videoNode;
	};

	const addNewClient = (newClient, cb) => {
		if (!clients.includes(newClient)) {
			setClients(list => [...list, newClient], cb);
		}
	};

	useEffect(() => {
		const handleNewPeer = async ({ peerId, createOffer }) => {
			if (peerId in peerConnections.current) {
				return console.warn('Already connected to peer', peerId);
			}

			peerConnections.current[peerId] = new RTCPeerConnection({
				iceServers: freeice(),
			});

			const pc = peerConnections.current[peerId];

			pc.onicecandidate = event => {
				if (event.candidate) {
					socket.emit(ACTIONS.RELAY_ICE, {
						peerId,
						iceCandidate: event.candidate,
					});
				}
			};

			let tracksNumber = 0;

			pc.ontrack = ({ streams: [remoteStream] }) => {
				tracksNumber++;

				if (tracksNumber === 2) {
					// video && audio
					addNewClient(peerId, () => {
						peerMediaElements.current[peerId].srcObject = remoteStream;
					});
				}
			};

			localMediaStream.current.getTracks().forEach(track => {
				pc.addTrack(track, localMediaStream.current);
			});

			if (createOffer) {
				const offer = await pc.createOffer();

				await pc.setLocalDescription(offer);

				socket.emit(ACTIONS.RELAY_SDP, { peerId, sessionDescription: offer });
			}
		};

		socket.on(ACTIONS.ADD_PEER, handleNewPeer);
	}, []);

	useEffect(() => {
		const setRemoteMedia = async ({
			peerId,
			sessionDescription: remoteDescription,
		}) => {
			const pc = peerConnections.current[peerId];

			await pc.setRemoteDescription(
				new RTCSessionDescription(remoteDescription)
			);

			if (remoteDescription.type === 'offer') {
				const answer = await pc.createAnswer();
				await pc.setLocalDescription(answer);
				socket.emit(ACTIONS.RELAY_SDP, { peerId, sessionDescription: answer });
			}
		};

		socket.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia);
	}, []);

	useEffect(() => {
		socket.on(ACTIONS.ICE_CANDIDATE, ({ peerId, iceCandidate }) => {
			const pc = peerConnections.current[peerId];
			pc.addIceCandidate(new RTCIceCandidate(iceCandidate));
		});
	}, []);

	useEffect(() => {
		socket.on(ACTIONS.REMOVE_PEER, ({ peerId }) => {
			const pc = peerConnections.current[peerId];

			if (pc) {
				pc.close();
			}

			delete peerConnections.current[peerId];
			delete peerMediaElements.current[peerId];

			setClients(list => list.filter(clientId => clientId !== peerId));
		});
	}, []);

	useEffect(() => {
		const startCapture = async () => {
			localMediaStream.current = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: true,
			});

			addNewClient(LOCAL_VIDEO, () => {
				const localVideoElement = peerMediaElements.current[LOCAL_VIDEO];

				if (localVideoElement) {
					localVideoElement.volume = 0;
					localVideoElement.srcObject = localMediaStream.current;
				}
			});
		};

		startCapture()
			.then(() => {
				socket.emit(ACTIONS.JOIN, { room: roomId });
			})
			.catch(e => console.error(`Error with capture user media`, e));

		return () => {
			localMediaStream.current.getTracks().forEach(track => {
				track.stop();
			});

			socket.emit(ACTIONS.LEAVE);
		};
	}, [roomId]);

	return { clients, provideMediaRef };
};

export default useWebRtc;
