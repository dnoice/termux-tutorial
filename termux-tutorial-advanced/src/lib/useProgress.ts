/*
 * React binding for the local progress store. Re-renders on any change,
 * including edits made in other tabs.
 */
import { useEffect, useState } from 'react';
import { load, subscribe, type ProgressData } from './progress';

export function useProgress(): ProgressData {
	const [data, setData] = useState<ProgressData>(() => load());
	useEffect(() => {
		// Re-read on mount (SSR renders the default, the client hydrates real data).
		setData(load());
		return subscribe(() => setData(load()));
	}, []);
	return data;
}
