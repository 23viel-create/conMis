import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { TaskDetailScreen } from '../../features/tasks/components/TaskDetailScreen';
import { useTasksHydrated } from '../../features/tasks/store/tasksSlice';

export default function TaskRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // A deep link can open this screen before saved tasks load; wait so we
  // don't flash "task not found".
  const hydrated = useTasksHydrated();
  if (!hydrated) return <View style={{ flex: 1 }} />;
  return <TaskDetailScreen taskId={id} />;
}
