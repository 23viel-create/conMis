import { View } from 'react-native';
import { ReflectionDashboard } from '../../features/reflection/components/ReflectionDashboard';
import { useTasksHydrated } from '../../features/tasks/store/tasksSlice';

export default function ReflectionRoute() {
  // Don't compute stats from an empty store while saved tasks load.
  const hydrated = useTasksHydrated();
  if (!hydrated) return <View style={{ flex: 1 }} />;
  return <ReflectionDashboard />;
}
