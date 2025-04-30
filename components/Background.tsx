import { ImageBackground, KeyboardAvoidingView, StyleSheet } from "react-native";

export default function Background({ children }: { children: React.ReactNode }) {
  return (
    // <ImageBackground
    //   source={{
    //     uri: require('../assets/images/backgrounds/background_dot.png'),
    //   }}
    //   resizeMode="repeat"
    //   style={styles.background}
    // >

    // </ImageBackground>
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      {children}
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    // backgroundColor: theme.colors.surface,
  },
  container: {
    flex: 1,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
})