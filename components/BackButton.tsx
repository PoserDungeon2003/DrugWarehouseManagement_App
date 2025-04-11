import { TouchableOpacity, Image, StyleSheet, GestureResponderEvent } from "react-native"
import { getStatusBarHeight } from 'react-native-status-bar-height'

type BackButtonProps = {
  goBack?: (event: GestureResponderEvent) => void
}

export default function BackButton({ goBack }: BackButtonProps) {
  return (
    <TouchableOpacity onPress={goBack} style={styles.container}>
      <Image
        style={styles.image}
        source={require('@/assets/images/icons/arrow_back.png')}
      />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10 + getStatusBarHeight(),
    left: 4,
  },
  image: {
    width: 24,
    height: 24,
  },
})