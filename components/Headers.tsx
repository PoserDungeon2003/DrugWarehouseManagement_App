import { Text } from 'react-native-paper'
import { StyleSheet } from 'react-native';
import theme from '@/app/core/theme';

type HeadersProps = {
  children: React.ReactNode;
}

export default function Headers({
  children,
}: HeadersProps) {
  return (
    <Text children={children} style={styles.header} />
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 21,
    color: "#269252",
    fontWeight: 'bold',
    paddingVertical: 12,
  },
})