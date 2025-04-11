import Background from "@/components/Background";
import Logo from "@/components/Logo";
import { View, StyleSheet } from "react-native";
import { Text, TextInput as Input, Button } from "react-native-paper";
import { yupResolver } from '@hookform/resolvers/yup';
import { object, string, InferType } from 'yup';
import { Controller, useForm } from "react-hook-form";
import theme from "./core/theme";

type LoginScreenProps = {
  navigation: any;
}

const schema = object({
  userName: string().required('Tên người dùng là bắt buộc'),
  password: string().required('Mật khẩu là bắt buộc'),
})

type LoginType = InferType<typeof schema>;

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { handleSubmit, control, formState: { errors } } = useForm<LoginType>({
    mode: 'onChange',
    resolver: yupResolver(schema),
    defaultValues: {
      userName: '',
      password: '',
    }
  })

  const onSubmit = (data: LoginType) => {
    console.log(data)
    // Perform login logic here
  }

  return (
    <Background>
      {/* <BackButton goBack={router.back} /> */}
      <Logo />
      <Text style={{
        fontSize: 21,
        color: theme.colors.primary,
        fontWeight: 'bold',
        paddingVertical: 12,
        textAlign: 'center',
      }}>
        Phần mềm quản lý kho thuốc
      </Text>
      <View>
        <Controller
          control={control}
          name="userName"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Tên người dùng"
              returnKeyType="next"
              value={value}
              onChangeText={onChange}
              error={!!errors.userName}
              errorText={errors.userName?.message}
              autoCapitalize="none"
              textContentType="username"
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Mật khẩu"
              returnKeyType="done"
              value={value}
              onChangeText={onChange}
              error={!!errors.password}
              errorText={errors.password?.message}
              secureTextEntry
            />
          )}
        />
        <Button
          style={buttonStyles.button}
          labelStyle={buttonStyles.text}
          mode="contained"
          onPress={handleSubmit(onSubmit)}
        >
          Login
        </Button>
      </View>
    </Background>
  )
}

const buttonStyles = StyleSheet.create({
  button: {
    width: '100%',
    marginVertical: 10,
    paddingVertical: 2,
    backgroundColor: theme.colors.primary,
  },
  text: {
    fontWeight: 'bold',
    fontSize: 15,
    lineHeight: 26,
  },
})

const loginStyles = StyleSheet.create({
  forgotPassword: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    marginTop: 4,
  },
  forgot: {
    fontSize: 13,
    color: theme.colors.secondary,
  },
  link: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
})

type TextInputProps = {
  label?: string
  errorText?: string
  description?: string
} & React.ComponentProps<typeof Input>

const TextInput = ({ errorText, description, ...props }: TextInputProps) => {
  return (
    <View style={textInputStyles.container}>
      <Input
        style={textInputStyles.input}
        selectionColor={theme.colors.primary}
        underlineColor="transparent"
        mode="outlined"
        {...props}
      />
      {description && !errorText ? (
        <Text style={textInputStyles.description}>{description}</Text>
      ) : null}
      {errorText ? <Text style={textInputStyles.error}>{errorText}</Text> : null}
    </View>
  )
}

const textInputStyles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  input: {
    // backgroundColor: theme.colors.surface,
  },
  description: {
    fontSize: 13,
    color: theme.colors.secondary,
    paddingTop: 8,
  },
  error: {
    fontSize: 13,
    color: theme.colors.error,
    paddingTop: 8,
  },
})