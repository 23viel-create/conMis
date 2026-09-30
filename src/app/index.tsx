import { KeyboardAvoidingView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TimelineNav } from '../features/calendar';
import { TaskForm } from '../features/tasks/components/TaskForm';
import { TaskList } from '../features/tasks/components/TaskList';
import { useTasksHydrated } from '../features/tasks/store/tasksSlice';
import { useColors } from '../theme/colors';

export default function HomeScreen() {
  const colors = useColors();
  const hydrated = useTasksHydrated();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Saved tasks load in a few milliseconds; rendering before that would
          flash the empty state and could drop a task typed in the meantime. */}
      {hydrated ? (
        // 'padding' on both platforms: with Android edge-to-edge the window no
        // longer resizes for the keyboard, so we have to make room ourselves.
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          {/* The form is the list header, so everything scrolls as one surface
              and we avoid nesting a FlatList inside a ScrollView. */}
          <TaskList
            header={
              <>
                <Text style={[styles.heading, { color: colors.text }]}>Tasks</Text>
                <TimelineNav style={styles.timeline} />
                <TaskForm style={styles.form} />
              </>
            }
          />
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.flex} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  timeline: {
    marginBottom: 16,
  },
  form: {
    marginBottom: 20,
  },
});
