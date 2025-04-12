import Background from "@/components/Background";
import Logo from "@/components/Logo";
import { View, StyleSheet } from "react-native";
import { Text, TextInput as Input, Button } from "react-native-paper";
import { yupResolver } from '@hookform/resolvers/yup';
import { object, string, InferType } from 'yup';
import { Controller, useForm } from "react-hook-form";
import { LoginResponse } from "@/types";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import api from "@/api";
import theme from "@/theme";

type LoginScreenProps = {
  navigation: any;
}

const schema = object({
  username: string().required('Tên người dùng là bắt buộc'),
  password: string().required('Mật khẩu là bắt buộc'),
})

type LoginType = InferType<typeof schema>;

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { handleSubmit, control, setError, formState: { errors, isLoading } } = useForm<LoginType>({
    mode: 'onChange',
    resolver: yupResolver(schema),
    defaultValues: {
      username: '',
      password: '',
    }
  })

  const onSubmit = async (data: LoginType) => {
    try {
      const { token, refreshToken, role } = await api.post('/api/Account/login', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      }) as LoginResponse
      if (token) {
        await AsyncStorage.multiSet([
          ['token', token],
          ['refreshToken', refreshToken],
          ['role', role],
        ])

        router.push('/')
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError('root', {
        message: error?.response?.data?.message || 'Đăng nhập không thành công',
      })
    }
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
          name="username"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Tên người dùng"
              returnKeyType="next"
              value={value}
              onChangeText={onChange}
              error={!!errors.username}
              errorText={errors.username?.message}
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
        <Text>
          {errors.root && (
            <Text style={loginStyles.error}>{errors.root.message}</Text>
          )}
        </Text>
        <Button
          style={buttonStyles.button}
          labelStyle={buttonStyles.text}
          mode="contained"
          loading={isLoading}
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
  error: {
    fontSize: 13,
    color: theme.colors.error,
    paddingTop: 8,
    fontWeight: 'bold',
  }
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
        outlineColor={theme.colors.primary}
        activeOutlineColor={theme.colors.primary}
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