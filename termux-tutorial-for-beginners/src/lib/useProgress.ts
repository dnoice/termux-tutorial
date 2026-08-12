/*
 * React binding for the local progress store. Re-renders on any change,
 * including edits made in other tabs.
 */
import { useEffect, useState } from 'react';
import { load, subscribe, type ProgressData } from './progress';

export function useProgress(): ProgressData {
	const [data, setData] = useState<ProgressData>(() => load());
	useEffect(() => {
		// NOT an SSR-to-hydration repair: every consumer of this hook is mounted
		// `client:only="react"` (LessonComplete/ProgressDashboard in content,
		// ProfileBadge in overrides/Sidebar.astro), so none of them ever renders
		// on the server and the useState initialiser above already ran in the
		// browser, against the same localStorage. This re-read is therefore
		// redundant in the normal case — it can only ever return something
		// different if the store was written between that first render and this
		// effect, which nothing here does on mount.
		setData(load());
		return subscribe(() => setData(load()));
	}, []);
	return data;
}
