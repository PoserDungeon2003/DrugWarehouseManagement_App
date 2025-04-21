import { useGetInboundById } from "@/hooks/useInbound";
import { useGetUser } from "@/hooks/useUser";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View, Image, StyleSheet } from "react-native";
import { ActivityIndicator, Button, Card, Divider, HelperText, IconButton, Text, TextInput, Title } from "react-native-paper";
import { useToast } from "react-native-paper-toast";
import * as ImagePicker from 'expo-image-picker';
import api from "@/api";
import { INBOUND_STATUS_TEXT } from "@/common/const";
import { InboundStatus } from "@/common/enum";
import { Controller, useForm } from "react-hook-form";
import { InferType, object, string } from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

type ImageAsset = {
  uri: string;
  name: string;
  type: string;
  size?: number;
};

let schema = object({
  problemDescription: string().required("Mô tả sự cố là bắt buộc").trim().max(1000, 'Mô tả không được vượt quá 1000 ký tự'),
})

type InboundReportForm = InferType<typeof schema>;

export default function CreateInboundReport() {
  const { id } = useLocalSearchParams();
  const inboundId = Number(id);
  const router = useRouter();
  const user = useGetUser();
  const token = user?.data?.token;
  const { show } = useToast();
  const queryClient = useQueryClient();

  const { data: inbound, isLoading } = useGetInboundById(token || '', inboundId);
  // Form state
  const { formState: { isSubmitting, errors }, setError, getValues, control, watch, setValue, handleSubmit } = useForm<InboundReportForm>({
    mode: 'onChange',
    resolver: yupResolver(schema),
    defaultValues: {
      problemDescription: inbound?.report?.problemDescription || '',
    }
  })
  const [images, setImages] = useState<ImageAsset[]>([]);
  const problemDescription = watch('problemDescription', '');

  // Request camera/media library permissions on component mount
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
        show({
          message: 'Cần cấp quyền truy cập vào camera và thư viện ảnh',
          type: 'warning'
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (inbound?.report) {
      setValue('problemDescription', inbound?.report?.problemDescription || '');
    }
  }, [inbound?.report]);

  // Pick image from camera
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const newImage: ImageAsset = {
          uri: asset.uri,
          name: `photo_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: asset.fileSize,
        };

        setImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      show({ message: 'Không thể chụp ảnh. Vui lòng thử lại', type: 'error' });
    }
  };

  // Pick image from library
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5 - images.length,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages: ImageAsset[] = result.assets.map(asset => ({
          uri: asset.uri,
          name: `photo_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`,
          type: 'image/jpeg',
          size: asset.fileSize,
        }));

        setImages(prev => {
          const combined = [...prev, ...newImages];
          return combined.slice(0, 5); // Limit to 5 images
        });
      }
    } catch (error) {
      console.error('Error picking images:', error);
      show({ message: 'Không thể chọn ảnh. Vui lòng thử lại', type: 'error' });
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Submit report
  const onSubmit = async (data: InboundReportForm) => {
    if (inbound?.report) {
      try {
        const formData = new FormData();
        formData.append('InboundReportId', inbound?.report?.inboundReportId.toString());
        formData.append('ProblemDescription', data.problemDescription);

        // Append images if any
        if (images.length > 0) {
          images.forEach(image => {
            formData.append('Images', {
              uri: Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri,
              type: image.type || 'image/jpeg',
              name: image.name || `image-${Date.now()}.jpg`,
            } as any);
          });
        }

        // Send the request
        const response = await api.put('/api/InboundReport', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }) as any;

        if (response?.code == 200) {
          // Success handling
          show({ message: 'Báo cáo sự cố đã được gửi thành công', type: 'success' });

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({
            queryKey: ['inbounds']
          });

          // Navigate back to inbound details
          router.replace(`/inbound-details/${inboundId}`);
        }
        else {
          show({
            message: response?.data?.message || 'Đã xảy ra lỗi khi gửi báo cáo',
            type: 'error'
          });
        }
      } catch (error: any) {
        console.error('Error submitting report:', error);
        setError('root', {
          message: error.response?.data?.message || 'Đã xảy ra lỗi khi gửi báo cáo'
        });

        show({
          message: error.response?.data?.message || 'Đã xảy ra lỗi khi gửi báo cáo',
          type: 'error'
        });
      }

    }
    else {
      try {
        const formData = new FormData();
        formData.append('InboundId', inboundId.toString());
        formData.append('ProblemDescription', data.problemDescription);

        // Append images if any
        if (images.length > 0) {
          images.forEach(image => {
            formData.append('Images', {
              uri: Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri,
              type: image.type || 'image/jpeg',
              name: image.name || `image-${Date.now()}.jpg`,
            } as any);
          });
        }

        // Send the request
        const response = await api.postWithFormData('/api/InboundReport', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }) as any;

        if (response?.code == 200) {
          // Success handling
          show({ message: 'Báo cáo sự cố đã được gửi thành công', type: 'success' });

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({
            queryKey: ['inbounds']
          });

          // Navigate back to inbound details
          router.replace(`/inbound-details/${inboundId}`);
        }
        else {
          show({
            message: response?.data?.message || 'Đã xảy ra lỗi khi gửi báo cáo',
            type: 'error'
          });
        }
      } catch (error: any) {
        console.error('Error submitting report:', error);
        setError('root', {
          message: error.response?.data?.message || 'Đã xảy ra lỗi khi gửi báo cáo'
        });

        show({
          message: error.response?.data?.message || 'Đã xảy ra lỗi khi gửi báo cáo',
          type: 'error'
        });
      }

    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 16 }}>Đang tải thông tin...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Báo cáo sự cố</Title>
            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>Mã phiếu:</Text>
              <Text style={styles.value}>{inbound?.inboundCode}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Trạng thái:</Text>
              <Text style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(getStatusNumber(inbound?.status)) }
              ]}>
                {INBOUND_STATUS_TEXT[getStatusNumber(inbound?.status)]}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Nhà cung cấp:</Text>
              <Text style={styles.value}>{inbound?.providerDetails?.providerName}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Report Form */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Chi tiết sự cố</Text>
            <Divider style={styles.divider} />

            {/* Problem Description */}
            <Controller
              control={control}
              name="problemDescription"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Mô tả sự cố *"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  mode="outlined"
                  multiline
                  numberOfLines={5}
                  style={styles.textInput}
                  maxLength={1000}
                  error={!!errors.problemDescription}
                  disabled={isSubmitting}
                />
              )}
            />

            {errors.problemDescription ? (
              <HelperText type="error" visible={!!errors.problemDescription}>
                {errors.problemDescription.message}
              </HelperText>
            ) : (
              <Text style={styles.charCount}>
                {problemDescription.length}/1000 ký tự
              </Text>
            )}

            {/* Image Upload */}
            <Text style={styles.sectionTitle}>Hình ảnh đính kèm</Text>
            <Text style={styles.sectionSubtitle}>
              Tối đa 5 hình ảnh, mỗi hình tối đa 5MB
            </Text>

            <View style={styles.imageButtons}>
              <Button
                mode="outlined"
                icon="camera"
                onPress={takePhoto}
                disabled={images.length >= 5 || isSubmitting}
                style={styles.uploadButton}
              >
                Chụp ảnh
              </Button>

              <Button
                mode="outlined"
                icon="image"
                onPress={pickImage}
                disabled={images.length >= 5 || isSubmitting}
                style={styles.uploadButton}
              >
                Chọn ảnh
              </Button>
            </View>

            {/* Image Previews */}
            {images.length > 0 && (
              <View style={styles.imagePreviewContainer}>
                {images.map((image, index) => (
                  <View key={index} style={styles.imagePreview}>
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.previewImage}
                    />
                    <IconButton
                      icon="close-circle"
                      size={24}
                      style={styles.removeImageButton}
                      iconColor="#f44336"
                      onPress={() => removeImage(index)}
                      disabled={isSubmitting}
                    />
                  </View>
                ))}
              </View>
            )}

            {/* General Error Message */}
            {errors.root && (
              <Text style={styles.errorText}>{errors.root.message}</Text>
            )}

            {/* Submit Button */}
            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => router.back()}
                disabled={isSubmitting}
                style={styles.cancelButton}
              >
                Hủy
              </Button>

              <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={styles.submitButton}
              >
                Gửi báo cáo
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Convert string status to number for proper handling
const getStatusNumber = (status?: string): InboundStatus => {
  if (!status) return InboundStatus.Pending;

  switch (status.toLowerCase()) {
    case 'pending': return InboundStatus.Pending;
    case 'inprogress': return InboundStatus.InProgress;
    case 'completed': return InboundStatus.Completed;
    case 'cancelled': return InboundStatus.Cancelled;
    default: return InboundStatus.Pending;
  }
};

const getStatusColor = (status: InboundStatus): string => {
  switch (status) {
    case InboundStatus.Pending:
      return '#FF9800';
    case InboundStatus.InProgress:
      return '#2196F3';
    case InboundStatus.Completed:
      return '#4CAF50';
    case InboundStatus.Cancelled:
      return '#F44336';
    default:
      return '#757575';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  divider: {
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    width: '30%',
    color: '#666',
  },
  value: {
    flex: 1,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    color: 'white',
    fontWeight: '500',
  },
  textInput: {
    marginTop: 8,
    backgroundColor: 'white',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    fontWeight: '500',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  imageButtons: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  uploadButton: {
    marginRight: 12,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 8,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 4,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 0,
    padding: 0,
  },
  errorText: {
    color: '#f44336',
    marginTop: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  cancelButton: {
    marginRight: 12,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});