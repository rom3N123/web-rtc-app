import { useCallback, useEffect, useRef, useState } from 'react';

const useStateWithCallback = initialState => {
	const [state, setState] = useState(initialState);
	const cbRef = useRef();

	const updateState = useCallback((newState, callback) => {
		cbRef.current = callback;

		setState(prev =>
			typeof newState === 'function' ? newState(prev) : newState
		);
	}, []);

	useEffect(() => {
		if (cbRef.current) {
			cbRef.current(state);
			cbRef.current = null;
		}
	}, [state]);

	return [state, updateState];
};

export default useStateWithCallback;
