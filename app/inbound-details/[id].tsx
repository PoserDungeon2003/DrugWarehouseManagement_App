import api from "@/api";
import { INBOUND_STATUS_TEXT } from "@/common/const";
import { InboundStatus } from "@/common/enum";
import { arrayBufferToBase64, formatVND } from "@/common/utils";
import Loading from "@/components/Loading";
import { useGetInboundById } from "@/hooks/useInbound";
import { useGetUser } from "@/hooks/useUser";
import { Asset, InboundDetail } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import _ from "lodash";
import { useCallback, useState } from "react";
import { ScrollView, View, StyleSheet, Linking, RefreshControl, Platform, Image } from "react-native";
import { ActivityIndicator, Badge, Button, Card, DataTable, Dialog, Divider, IconButton, Modal, Portal, Text } from "react-native-paper";
import { useToast } from "react-native-paper-toast";
import * as FileSystem from 'expo-file-system';

export default function InboundDetails() {
  const { id } = useLocalSearchParams();
  const user = useGetUser();
  const token = user?.data?.token;
  // const [approveDialogVisible, setApproveDialogVisible] = useState(false);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [completeDialogVisible, setCompleteDialogVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InboundDetail | null>(null);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { show } = useToast();
  const queryClient = useQueryClient();

  const { data: inbound, isLoading, refetch } = useGetInboundById(token || "", Number(id));

  // Calculate total amount
  const totalAmount = inbound?.inboundDetails?.reduce(
    (sum, item) => sum + (item.totalPrice || 0), 0
  ) || 0;

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

  const currentStatus = getStatusNumber(inbound?.status);

  // const handleApprove = async () => {
  //   try {
  //     await api.put(`/api/Inbound/status`, {
  //       inboundId: inbound?.inboundId,
  //       inboundStatus: InboundStatus.Completed,
  //     }, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     setApproveDialogVisible(false);

  //     queryClient.invalidateQueries({
  //       queryKey: ['inbound', Number(id)]
  //     });

  //     show({ message: 'Phê duyệt phiếu nhập thành công', type: 'success' });
  //   } catch (error: any) {
  //     console.error('Error approving inbound:', error);
  //     show({
  //       message: error?.response?.data?.message || 'Lỗi khi phê duyệt phiếu nhập',
  //       type: 'error',
  //     });
  //   }
  // };

  const handleComplete = async () => {
    try {
      await api.put(`/api/Inbound/status`, {
        inboundId: inbound?.inboundId,
        inboundStatus: InboundStatus.Completed
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCompleteDialogVisible(false);

      queryClient.invalidateQueries({
        queryKey: ['inbounds']
      });

      show({ message: 'Hoàn thành phiếu nhập thành công', type: 'success' });
    } catch (error: any) {
      console.error('Error completing inbound:', error);
      show({
        message: error?.response?.data?.message || 'Lỗi khi hoàn thành phiếu nhập',
        type: 'error',
      });
    }
  };

  const handleCancel = async () => {
    try {
      await api.put(`/api/Inbound/status`, {
        inboundId: inbound?.inboundId,
        inboundStatus: InboundStatus.Cancelled
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCancelDialogVisible(false);

      queryClient.invalidateQueries({
        queryKey: ['inbounds']
      });

      show({ message: 'Hủy phiếu nhập thành công', type: 'success' });
    } catch (error: any) {
      console.error('Error cancelling inbound:', error);
      show({
        message: error?.response?.data?.message || 'Lỗi khi hủy phiếu nhập',
        type: 'error',
      });
    }
  };

  const openReport = () => {
    if (inbound?.report) {
      // Navigate to a report details screen or show modal
      router.push(`/create-inbound-reports/${id}`);
    }
  };

  const showProductDetails = (product: InboundDetail) => {
    setSelectedProduct(product);
    setProductModalVisible(true);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  const navigateToCreateReport = () => {
    router.push(`/create-inbound-reports/${id}`);
  };

  const getImages = async (assetPath: string): Promise<string | null> => {
    const filename = assetPath.split('/').pop() || '';

    try {
      // Use arraybuffer for Android to avoid blob issues
      const responseType = Platform.OS === 'web' ? 'blob' : 'arraybuffer';

      const response = await api.get(`/api/Asset/inbound-report/${encodeURIComponent(filename)}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: responseType,
      }) as any;

      if (!response || !response.data) {
        console.error('No data in response');
        return null;
      }

      if (Platform.OS === 'web') {
        // For web: create object URL directly from the blob response
        return URL.createObjectURL(response.data);
      } else {
        // For Android: convert ArrayBuffer to base64 directly
        const base64Data = arrayBufferToBase64(response.data);

        // Create a temporary file path
        const tempFilePath = `${FileSystem.cacheDirectory}${filename}`;

        // Write the file to temporary storage
        await FileSystem.writeAsStringAsync(
          tempFilePath,
          base64Data,
          { encoding: FileSystem.EncodingType.Base64 }
        );

        // Return the file URI
        return tempFilePath;
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      return null;
    }
  };

  const previewImage = async (asset: Asset) => {
    setPreviewLoading(true);
    try {
      const imageData = await getImages(asset.fileUrl);
      if (imageData) {
        setSelectedImage(imageData);
        setImageViewerVisible(true);
      } else {
        show({ message: 'Không thể tải ảnh để xem', type: 'error' });
      }
    } catch (error) {
      console.error('Error previewing image:', error);
      show({ message: 'Lỗi khi tải ảnh để xem', type: 'error' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const downloadImage = async (asset: Asset) => {
    try {
      show({ message: 'Đang tải ảnh...', type: 'info' });

      const imageUrl = await getImages(asset.fileUrl);
      if (!imageUrl) {
        show({ message: 'Không thể tải ảnh', type: 'error' });
        return;
      }

      if (Platform.OS === 'web') {
        // For web: Use the blob URL directly
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = asset.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        show({ message: 'Tải ảnh thành công', type: 'success' });
      } else {
        // For native: The image is already saved to temporary storage
        // Just need to share it
        const { Share } = require('react-native');
        await Share.share({
          url: imageUrl,
          message: 'Image from DrugWarehouseManagement'
        });

        show({ message: 'Ảnh đã được chia sẻ', type: 'success' });
      }
    } catch (error) {
      console.error('Error downloading image:', error);
      show({ message: 'Lỗi khi tải ảnh', type: 'error' });
    }
  };

  if (isLoading) {
    return (
      <Loading />
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Basic Information Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerRow}>
              <View>
                <Text variant="titleLarge" style={styles.inboundCode}>
                  {inbound?.inboundCode}
                </Text>
                <Text variant="bodyMedium" style={styles.dateText}>
                  {format(inbound?.inboundDate || new Date(), "dd/MM/yyyy HH:mm:ss")}
                </Text>
              </View>
              <Badge
                size={28}
                style={{
                  backgroundColor: getStatusColor(currentStatus),
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 12,
                  paddingHorizontal: 8,
                }}
              >
                {INBOUND_STATUS_TEXT[currentStatus]}
              </Badge>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.infoGrid}>
              <View style={styles.infoColumn}>
                <InfoItem label="Kho nhập" value={inbound?.warehouseName} />
                <InfoItem label="Người tạo" value={inbound?.createBy} />
              </View>

              <View style={styles.infoColumn}>
                {inbound?.report && (
                  <View style={styles.reportBadge}>
                    <Badge
                      size={24}
                      style={{ backgroundColor: '#FF9800' }}
                    >!</Badge>
                    <Button
                      onPress={openReport}
                      compact
                      style={{ marginLeft: 4 }}
                    >
                      Xem báo cáo sự cố
                    </Button>
                  </View>
                )}
                {inbound?.providerOrderCode && (
                  <InfoItem
                    label="Mã đơn hàng"
                    value={inbound.providerOrderCode}
                  />
                )}
              </View>
            </View>

            {inbound?.note && (
              <>
                <Divider style={[styles.divider, { marginTop: 8 }]} />
                <Text variant="bodyMedium" style={styles.noteLabel}>Ghi chú:</Text>
                <Text style={styles.noteText}>{inbound.note}</Text>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Provider Information Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium">Thông tin nhà cung cấp</Text>
              <IconButton
                icon="phone"
                size={20}
                mode="contained"
                containerColor="#E3F2FD"
                iconColor="#1976D2"
                onPress={() => Linking.openURL(`tel:${inbound?.providerDetails?.phoneNumber}`)}
              />
            </View>

            <Divider style={styles.divider} />

            <Text variant="titleSmall" style={styles.providerName}>
              {inbound?.providerDetails?.providerName}
            </Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoColumn}>
                <InfoItem
                  label="Số điện thoại"
                  value={inbound?.providerDetails?.phoneNumber}
                />
                <InfoItem
                  label="Email"
                  value={inbound?.providerDetails?.email}
                />
                <InfoItem
                  label="Mã số thuế"
                  value={inbound?.providerDetails?.taxCode}
                />
              </View>

              <View style={styles.infoColumn}>
                <InfoItem
                  label="Số chứng từ"
                  value={inbound?.providerDetails?.documentNumber}
                />
                <InfoItem
                  label="Ngày chứng từ"
                  value={inbound?.providerDetails?.documentIssueDate ?
                    format(new Date(inbound.providerDetails.documentIssueDate), "dd/MM/yyyy") : ""
                  }
                />
              </View>
            </View>

            <Text variant="bodyMedium" style={styles.addressLabel}>Địa chỉ:</Text>
            <Text style={styles.addressText}>{inbound?.providerDetails?.address}</Text>
          </Card.Content>
        </Card>

        {/* Products Table Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Chi tiết sản phẩm</Text>
            <Divider style={styles.divider} />

            {!inbound?.inboundDetails || inbound.inboundDetails.length === 0 ? (
              <Text style={styles.emptyText}>Không có sản phẩm nào</Text>
            ) : (
              <>
                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title style={{ flex: 2 }}>Sản phẩm</DataTable.Title>
                    <DataTable.Title style={{ flex: 0.8 }}>Lô</DataTable.Title>
                    <DataTable.Title numeric style={{ flex: 0.5 }}>SL</DataTable.Title>
                    <DataTable.Title numeric style={{ flex: 1 }}>Đơn giá</DataTable.Title>
                    <DataTable.Title numeric style={{ flex: 1 }}>Tổng</DataTable.Title>
                  </DataTable.Header>

                  {inbound.inboundDetails.map((item, index) => (
                    <DataTable.Row
                      key={index}
                      onPress={() => showProductDetails(item)}
                      style={styles.dataRow}
                    >
                      <DataTable.Cell style={{ flex: 2 }}>
                        <Text
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.productName}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={{ flex: 0.8 }}>{item.lotNumber}</DataTable.Cell>
                      <DataTable.Cell numeric style={{ flex: 0.5 }}>{item.quantity}</DataTable.Cell>
                      <DataTable.Cell numeric style={{ flex: 1.3 }}>{formatVND(item.unitPrice)}</DataTable.Cell>
                      <DataTable.Cell numeric style={{ flex: 1 }}>{formatVND(item.totalPrice)}</DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable>

                <View style={styles.totalContainer}>
                  <Text variant="titleMedium">Tổng cộng:</Text>
                  <Text variant="titleMedium" style={styles.totalAmount}>
                    {formatVND(totalAmount)}
                  </Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Report Section (if exists) */}
        {inbound?.report && (
          <Card style={[styles.card, { backgroundColor: '#FFF8E1' }]}>
            <Card.Content>
              <View style={styles.reportHeader}>
                <Text variant="titleMedium">Báo cáo sự cố</Text>
                <Badge
                  size={24}
                  style={{
                    backgroundColor: inbound.report.status.toLowerCase() === 'pending' ?
                      '#FF9800' : '#4CAF50',
                    color: 'white'
                  }}
                >
                  {inbound.report.status.toLowerCase() === 'pending' ?
                    'Đang chờ xử lý' : 'Đã xử lý'}
                </Badge>
              </View>

              <Divider style={styles.divider} />

              <Text style={styles.reportLabel}>Mô tả sự cố:</Text>
              <Text style={styles.reportText}>
                {inbound.report.problemDescription}
              </Text>

              <Text style={styles.reportDate}>
                Báo cáo ngày: {format(new Date(inbound.report.reportDate), "dd/MM/yyyy HH:mm:ss")}
              </Text>

              {inbound.report.assets && inbound.report.assets.length > 0 && (
                <View style={styles.attachmentsContainer}>
                  <Text style={styles.attachmentsLabel}>Tệp đính kèm:</Text>
                  <View style={styles.attachmentsList}>
                    {inbound.report.assets.map((asset, index) => (
                      <View key={index} style={styles.attachmentItem}>
                        <Button
                          icon={asset.contentType?.startsWith('image/') ? "file-image" : "file-document"}
                          mode="outlined"
                          style={styles.attachmentButton}
                          contentStyle={styles.attachmentButtonContent}
                          labelStyle={styles.attachmentButtonLabel}
                          onPress={() => previewImage(asset)}
                        >
                          {asset.fileName.length > 15
                            ? asset.fileName.substring(0, 12) + '...'
                            : asset.fileName}
                        </Button>

                        {asset.contentType?.startsWith('image/') && (
                          <View style={styles.buttonGroup}>
                            <IconButton
                              icon="eye"
                              size={18}
                              mode="contained"
                              containerColor="#E8F5E9"
                              iconColor="#388E3C"
                              style={styles.actionButton}
                              onPress={() => previewImage(asset)}
                              loading={previewLoading}
                              disabled={previewLoading}
                            />

                            <IconButton
                              icon="download"
                              size={18}
                              mode="contained"
                              containerColor="#E3F2FD"
                              iconColor="#1976D2"
                              style={styles.actionButton}
                              onPress={() => downloadImage(asset)}
                            />
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

      </ScrollView>
      {currentStatus === InboundStatus.Pending && (
        <View style={styles.bottomActionBar}>
          <Button
            mode="contained"
            icon="close-circle"
            onPress={() => setCancelDialogVisible(true)}
            style={styles.cancelButtonBottom}
            contentStyle={styles.actionButtonContent}
          >
            Hủy phiếu
          </Button>
          <Button
            mode="contained"
            icon="check-circle"
            onPress={() => setCompleteDialogVisible(true)}
            style={styles.completeButtonBottom}
            contentStyle={styles.actionButtonContent}
          >
            Hoàn thành
          </Button>
          {!inbound?.report && (
            <Button
              mode="contained"
              icon="alert-circle-outline"
              onPress={navigateToCreateReport}
              style={styles.reportButtonBottom}
              contentStyle={styles.actionButtonContent}
            >
              Báo cáo sự cố
            </Button>
          )}
        </View>
      )}

      {/* Approval Dialog */}
      {/* <Portal>
        <Dialog visible={approveDialogVisible} onDismiss={() => setApproveDialogVisible(false)}>
          <Dialog.Title>Phê duyệt phiếu nhập</Dialog.Title>
          <Dialog.Content>
            <Text>Bạn có chắc chắn muốn phê duyệt phiếu nhập này?</Text>
            <Text style={{ marginTop: 8, fontStyle: 'italic' }}>
              Khi phê duyệt, phiếu sẽ chuyển sang trạng thái "Đang xử lý".
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setApproveDialogVisible(false)}>Hủy</Button>
            <Button mode="contained" onPress={handleApprove}>Xác nhận</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal> */}

      {/* Complete Dialog */}
      <Portal>
        <Dialog visible={completeDialogVisible} onDismiss={() => setCompleteDialogVisible(false)}>
          <Dialog.Title>Hoàn thành phiếu nhập</Dialog.Title>
          <Dialog.Content>
            <Text>Bạn có chắc chắn muốn hoàn thành phiếu nhập này?</Text>
            <Text style={{ marginTop: 8, fontStyle: 'italic' }}>
              Khi hoàn thành, sản phẩm sẽ được thêm vào kho và không thể chỉnh sửa phiếu.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCompleteDialogVisible(false)}>Hủy</Button>
            <Button mode="contained" onPress={handleComplete}>Xác nhận</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Cancel Dialog */}
      <Portal>
        <Dialog visible={cancelDialogVisible} onDismiss={() => setCancelDialogVisible(false)}>
          <Dialog.Title>Hủy phiếu nhập</Dialog.Title>
          <Dialog.Content>
            <Text>Bạn có chắc chắn muốn hủy phiếu nhập này?</Text>
            <Text style={{ marginTop: 8, fontStyle: 'italic', color: '#D32F2F' }}>
              Hành động này không thể hoàn tác.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCancelDialogVisible(false)}>Quay lại</Button>
            <Button
              mode="contained"
              buttonColor="#D32F2F"
              textColor="white"
              onPress={handleCancel}
            >
              Hủy phiếu
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Modal
          visible={productModalVisible}
          onDismiss={() => setProductModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedProduct && (
            <Card>
              <Card.Content>
                <View style={styles.modalHeader}>
                  <Text variant="titleMedium">Chi tiết sản phẩm</Text>
                  <IconButton
                    icon="close"
                    size={20}
                    onPress={() => setProductModalVisible(false)}
                  />
                </View>

                <Divider style={styles.divider} />

                <Text variant="titleSmall" style={styles.productTitle}>
                  {selectedProduct.productName}
                </Text>

                <View style={styles.productInfoGrid}>
                  <View style={styles.productInfoColumn}>
                    <ProductInfoItem
                      label="Mã sản phẩm"
                      value={selectedProduct.productId?.toString() || "—"}
                    />
                    <ProductInfoItem
                      label="Số lô"
                      value={selectedProduct.lotNumber}
                    />
                    <ProductInfoItem
                      label="Số lượng"
                      value={selectedProduct.quantity.toString()}
                    />
                    {selectedProduct.openingStock !== null && selectedProduct.openingStock !== undefined && (
                      <ProductInfoItem
                        label="Tồn kho ban đầu"
                        value={selectedProduct.openingStock.toString()}
                      />
                    )}
                  </View>

                  <View style={styles.productInfoColumn}>
                    {selectedProduct.manufacturingDate && (
                      <ProductInfoItem
                        label="Ngày sản xuất"
                        value={format(new Date(selectedProduct.manufacturingDate), "dd/MM/yyyy")}
                      />
                    )}
                    {selectedProduct.expiryDate && (
                      <ProductInfoItem
                        label="Hạn sử dụng"
                        value={format(new Date(selectedProduct.expiryDate), "dd/MM/yyyy")}
                      />
                    )}
                    <ProductInfoItem
                      label="Đơn giá"
                      value={formatVND(selectedProduct.unitPrice)}
                    />
                    <ProductInfoItem
                      label="Thành tiền"
                      value={formatVND(selectedProduct.totalPrice)}
                      highlight
                    />
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={imageViewerVisible}
          onDismiss={() => setImageViewerVisible(false)}
          contentContainerStyle={styles.imageViewerModal}
        >
          {selectedImage && (
            <View style={styles.imageViewerContainer}>
              <IconButton
                icon="close"
                size={24}
                style={styles.closeImageButton}
                onPress={() => setImageViewerVisible(false)}
              />
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullImage}
                resizeMode="contain"
              />
              {Platform.OS === 'web' && (
                <Button
                  icon="download"
                  mode="contained"
                  style={styles.downloadButtonInViewer}
                  onPress={() => {
                    const link = document.createElement('a');
                    link.href = selectedImage;
                    link.download = 'image.jpg'; // You could get the filename from state
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  Tải ảnh
                </Button>
              )}
            </View>
          )}
        </Modal>
      </Portal>
    </>
  );
}

function ProductInfoItem({
  label,
  value,
  highlight = false
}: {
  label: string,
  value: string,
  highlight?: boolean
}) {
  return (
    <View style={styles.productInfoItem}>
      <Text variant="bodySmall" style={styles.productInfoLabel}>{label}</Text>
      <Text
        variant="bodyMedium"
        style={[
          styles.productInfoValue,
          highlight && styles.highlightedValue
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

// Helper component for consistent info display
function InfoItem({ label, value }: { label: string, value?: string | null }) {
  if (!value) return null;

  return (
    <View style={styles.infoItem}>
      <Text variant="bodySmall" style={styles.infoLabel}>{label}</Text>
      <Text variant="bodyMedium" style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function getStatusColor(status: InboundStatus): string {
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  card: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inboundCode: {
    fontWeight: 'bold',
  },
  dateText: {
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginVertical: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoColumn: {
    flex: 1,
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    color: '#666',
  },
  infoValue: {
    fontWeight: '500',
  },
  noteLabel: {
    color: '#666',
    marginBottom: 4,
  },
  noteText: {
    fontStyle: 'italic',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerName: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  addressLabel: {
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  addressText: {
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
    color: '#666',
  },
  dateRow: {
    minHeight: 70, // Ensure rows are tall enough for wrapped text
    paddingVertical: 8,
  },
  mfgDate: {
    fontSize: 12,
    color: '#1976D2',
  },
  expDate: {
    fontSize: 12,
    color: '#FF9800',
  },
  openingStock: {
    fontSize: 10,
    color: '#757575',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#006064',
    marginLeft: 8,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportLabel: {
    fontWeight: '500',
    marginBottom: 8,
  },
  reportText: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  reportDate: {
    fontStyle: 'italic',
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  attachmentsContainer: {
    marginTop: 12,
  },
  attachmentsLabel: {
    fontWeight: '500',
    marginBottom: 8,
  },
  attachmentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attachmentButton: {
    marginBottom: 8,
    maxWidth: '100%', // Limit button width
  },
  reportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productName: {
    flexShrink: 1,
    marginRight: 4,
  },
  modalContainer: {
    padding: 16,
    marginHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  productInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productInfoColumn: {
    flex: 1,
  },
  productInfoItem: {
    marginBottom: 12,
  },
  productInfoLabel: {
    color: '#666',
    marginBottom: 2,
  },
  productInfoValue: {
    fontWeight: '500',
  },
  highlightedValue: {
    color: '#006064',
    fontWeight: 'bold',
  },
  dataRow: {
    minHeight: 50,
    paddingVertical: 4,
  },
  actionContainer: {
    alignItems: 'flex-end',
  },
  reportButton: {
    marginTop: 8,
    backgroundColor: '#FF9800',
  },
  reportButtonLabel: {
    fontSize: 12,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8,
  },
  cancelButtonBottom: {
    backgroundColor: '#F44336',
    flex: 1,
    marginHorizontal: 4,
  },
  completeButtonBottom: {
    backgroundColor: '#4CAF50',
    flex: 1,
    marginHorizontal: 4,
  },
  reportButtonBottom: {
    backgroundColor: '#FF9800',
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonContent: {
    height: 45,
  },
  attachmentItem: {
    flexDirection: 'column',
    marginBottom: 12,
    marginRight: 8,
    width: 150,
  },
  attachmentButtonContent: {
    paddingHorizontal: 8,
  },
  attachmentButtonLabel: {
    fontSize: 11,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    margin: 2,
  },
  imageViewerModal: {
    margin: 0,
    padding: 0,
    flex: 1,
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  closeImageButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    zIndex: 10,
  },
  downloadButtonInViewer: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#1976D2',
    zIndex: 10,
  }
});