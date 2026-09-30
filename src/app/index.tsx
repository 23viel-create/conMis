import { KeyboardAvoidingView, Platform, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TaskForm } from '../features/tasks/components/TaskForm';
import { TaskList } from '../features/tasks/components/TaskList';
import { useColors } from '../theme/colors';

export default function HomeScreen() {
  const colors = useColors();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* The form is the list header, so everything scrolls as one surface
            and we avoid nesting a FlatList inside a ScrollView. */}
        <TaskList
          header={
            <>
              <Text style={[styles.heading, { color: colors.text }]}>Tasks</Text>
              <TaskForm style={styles.form} />
            </>
          }
        />
      </KeyboardAvoidingView>
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
  form: {
    marginBottom: 20,
  },
});
