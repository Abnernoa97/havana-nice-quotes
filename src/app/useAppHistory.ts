import { useEffect, useRef, useState } from 'react';
import { createAppNavigator, initialView, readNavigationEntry } from './native-navigation';
import type { AppView } from './native-navigation';

/** React binding for the native browser / Android Back history controller. */
export function useAppHistory(initialActive: string) {
  const [view, setView] = useState<AppView>(
    () => readNavigationEntry(window.history.state)?.view || initialView(initialActive)
  );
  const ref = useRef<ReturnType<typeof createAppNavigator> | null>(null);
  if (!ref.current) ref.current = createAppNavigator(window.history, initialActive, setView);
  const navigation = ref.current;
  useEffect(() => {
    navigation.initialize();
    const onPop = (event: PopStateEvent) => navigation.onPopState(event.state);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [navigation]);
  return { view, routeTo: navigation.transition, goBack: navigation.back };
}
