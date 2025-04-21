import api from "@/api";
import { OUTBOUND_STATUS_TEXT } from "@/common/const";
import { OutboundStatus } from "@/common/enum";
import { formatVND } from "@/common/utils";
import { useGetOutboundById } from "@/hooks/useOutbound";
import { useGetUser } from "@/hooks/useUser";
import { OutboundDetail } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useLocalSearchParams } from "expo-router";
import _ from "lodash";
import { useCallback, useState } from "react";
import { ScrollView, View, StyleSheet, Linking, RefreshControl } from "react-native";
import { ActivityIndicator, Badge, Button, Card, DataTable, Dialog, Divider, IconButton, Modal, Portal, Text, Title } from "react-native-paper";
import { useToast } from "react-native-paper-toast";

export default function OutboundDetails() {
  const { id } = useLocalSearchParams();
  const user = useGetUser();
  const token = user?.data?.token;
  const [approveDialogVisible, setApproveDialogVisible] = useState(false);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [completeDialogVisible, setCompleteDialogVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<OutboundDetail | null>(null);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { show, hide } = useToast();
  const queryClient = useQueryClient();

  const { data: outbound, isLoading, refetch } = useGetOutboundById(token || "", Number(id));

  // Calculate total amount
  const totalAmount = _.reduce(outbound?.outboundDetails,
    (sum, item) => sum + item.totalPrice, 0
  );

  const showProductDetails = (product: OutboundDetail) => {
    setSelectedProduct(product);
    setProductModalVisible(true);
  };

  const handleApprove = async () => {
    try {
      const response = await api.put(`/api/Outbound?id=${outbound?.outboundId}`, {
        status: OutboundStatus.InProgress
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response) {
        setApproveDialogVisible(false);
        queryClient.invalidateQueries({
          queryKey: ['outbound']
        })
        show({
          message: 'Phê duyệt phiếu xuất thành công',
          type: 'success',
        });
      }
    } catch (error: any) {
      console.log('Error approving outbound: ', error);
      show({
        message: error?.response?.data?.message || 'Đã xảy ra lỗi khi phê duyệt phiếu xuất',
        type: 'error',
      })
    }
  }

  const handleComplete = async () => {
    try {
      const response = await api.put(`/api/Outbound?id=${outbound?.outboundId}`, {
        status: OutboundStatus.Completed
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response) {
        setCompleteDialogVisible(false);
        queryClient.invalidateQueries({
          queryKey: ['outbound']
        })
        show({
          message: 'Chuyển trạng thái phiếu xuất thành công',
          type: 'success',
        });
      }
    } catch (error: any) {
      console.log('Error approving outbound: ', error);
      show({
        message: error?.response?.data?.message || 'Đã xảy ra lỗi khi chỉnh sửa phiếu xuất',
        type: 'error',
      })
    }
  }

  const handleCancel = async () => {
    try {
      const response = await api.put(`/api/Outbound?id=${outbound?.outboundId}`, {
        status: OutboundStatus.Cancelled
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response) {
        setCancelDialogVisible(false);
        queryClient.invalidateQueries({
          queryKey: ['outbound']
        })
        show({
          message: 'Hủy phiếu xuất thành công',
          type: 'success',
        });
      }
    } catch (error: any) {
      console.log('Error approving outbound: ', error);
      show({
        message: error?.response?.data?.message || 'Đã xảy ra lỗi khi hủy phiếu xuất',
        type: 'error',
      })
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  return (
    <>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>
          {/* Header Section */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.headerRow}>
                <Title>Chi tiết phiếu xuất</Title>
                <Badge
                  size={32}
                  style={{
                    backgroundColor: getStatusColor(outbound?.status),
                    paddingHorizontal: 8,
                    fontWeight: 'semibold',
                  }}
                >
                  {OUTBOUND_STATUS_TEXT[outbound?.status || 0]}
                </Badge>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Mã phiếu:</Text>
                <Text variant="bodyLarge" style={styles.value}>{outbound?.outboundCode}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Ngày xuất:</Text>
                <Text variant="bodyLarge" style={styles.value}>
                  {format(new Date(outbound?.outboundDate || new Date()), "dd/MM/yyyy HH:mm")}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Tổng tiền:</Text>
                <Text variant="bodyLarge" style={styles.value}>
                  {formatVND(totalAmount)}
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Customer Information */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Title>Thông tin khách hàng</Title>
                {outbound?.phoneNumber && (
                  <IconButton
                    icon="phone"
                    size={20}
                    mode="contained"
                    containerColor="#E3F2FD"
                    iconColor="#1976D2"
                    onPress={() => Linking.openURL(`tel:${outbound.phoneNumber}`)}
                  />
                )}
              </View>
              <Divider style={styles.divider} />

              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Khách hàng:</Text>
                <Text variant="bodyLarge" style={styles.value}>{outbound?.customerName}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Số điện thoại:</Text>
                <Text
                  variant="bodyLarge"
                  style={[styles.value, styles.phoneLink]}
                  onPress={() => Linking.openURL(`tel:${outbound?.phoneNumber}`)}
                >
                  {outbound?.phoneNumber}
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Receiver Information */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Title>Thông tin người nhận</Title>
                {outbound?.receiverPhone && (
                  <IconButton
                    icon="phone"
                    size={20}
                    mode="contained"
                    containerColor="#E3F2FD"
                    iconColor="#1976D2"
                    onPress={() => Linking.openURL(`tel:${outbound.receiverPhone}`)}
                  />
                )}
              </View>
              <Divider style={styles.divider} />

              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Tên người nhận:</Text>
                <Text variant="bodyLarge" style={styles.value}>{outbound?.receiverName}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Số điện thoại:</Text>
                <Text
                  variant="bodyLarge"
                  style={[styles.value, styles.phoneLink]}
                  onPress={() => Linking.openURL(`tel:${outbound?.receiverPhone}`)}
                >
                  {outbound?.receiverPhone}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Địa chỉ:</Text>
                <Text variant="bodyLarge" style={styles.value}>{outbound?.receiverAddress}</Text>
              </View>

              {outbound?.note && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>Ghi chú:</Text>
                  <Text variant="bodyLarge" style={styles.value}>{outbound.note}</Text>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Product Details */}
          <Card style={styles.card}>
            <Card.Content>
              <Title>Chi tiết sản phẩm</Title>
              <Divider style={styles.divider} />

              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Sản phẩm</DataTable.Title>
                  <DataTable.Title numeric>SL</DataTable.Title>
                  <DataTable.Title numeric>Đơn giá</DataTable.Title>
                  <DataTable.Title numeric>Thành tiền</DataTable.Title>
                </DataTable.Header>

                {outbound?.outboundDetails.map((detail) => (
                  <DataTable.Row
                    key={detail.outboundDetailsId}
                    onPress={() => showProductDetails(detail)}
                    style={styles.dataRow}
                  >
                    <DataTable.Cell>
                      <Text variant="bodyMedium">{detail.productName}</Text>
                      <Text variant="bodySmall">{detail.lotNumber} - {detail.unitType}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric>{detail.quantity}</DataTable.Cell>
                    <DataTable.Cell numeric>
                      {formatVND(detail.unitPrice)}
                    </DataTable.Cell>
                    <DataTable.Cell numeric>
                      {formatVND(detail.totalPrice)}
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}

                <DataTable.Row style={styles.totalRow}>
                  <DataTable.Cell><Text variant="bodyLarge">Tổng cộng</Text></DataTable.Cell>
                  <DataTable.Cell numeric>
                    <Text variant="bodyLarge" style={styles.totalAmount}>
                      {formatVND(totalAmount)}
                    </Text>
                  </DataTable.Cell>
                </DataTable.Row>
              </DataTable>
            </Card.Content>
          </Card>
          <Card style={styles.card}>
            <Card.Content>
              <Title>Thao tác</Title>
              <Divider style={styles.divider} />
              <View style={styles.buttonContainer}>
                {outbound?.status === 1 ? (
                  <>
                    <Button
                      mode="contained"
                      onPress={() => setApproveDialogVisible(true)}
                      style={[styles.actionButton, styles.approveButton]}
                      icon="check-circle"
                    >
                      Phê duyệt
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => setCancelDialogVisible(true)}
                      style={[styles.actionButton, styles.cancelButton]}
                      icon="cancel"
                    >
                      Hủy phiếu
                    </Button>
                  </>
                ) : outbound?.status == 2 ? (
                  <>
                    <Button
                      mode="contained"
                      onPress={() => setCompleteDialogVisible(true)}
                      style={[styles.actionButton, styles.approveButton]}
                      icon="check-circle"
                    >
                      Hoàn thành
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => setCancelDialogVisible(true)}
                      style={[styles.actionButton, styles.cancelButton]}
                      icon="cancel"
                    >
                      Hủy phiếu
                    </Button>
                  </>
                ) : (
                  null
                )}
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
      <Portal>
        <Dialog visible={approveDialogVisible} onDismiss={() => setApproveDialogVisible(false)}>
          <Dialog.Title>Xác nhận phê duyệt</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Bạn có chắc chắn muốn phê duyệt phiếu xuất này?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setApproveDialogVisible(false)}>Hủy bỏ</Button>
            <Button
              mode="contained"
              onPress={handleApprove}
              disabled={isLoading}
            >
              Xác nhận
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Portal>
        <Dialog visible={completeDialogVisible} onDismiss={() => setCompleteDialogVisible(false)}>
          <Dialog.Title>Xác nhận hoàn thành</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Bạn có chắc chắn muốn đánh dấu phiếu xuất này đã hoàn thành?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCompleteDialogVisible(false)}>Hủy bỏ</Button>
            <Button
              mode="contained"
              onPress={handleComplete}
              disabled={isLoading}
            >
              Xác nhận
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Cancel Dialog */}
      <Portal>
        <Dialog visible={cancelDialogVisible} onDismiss={() => setCancelDialogVisible(false)}>
          <Dialog.Title>Xác nhận hủy phiếu</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Bạn có chắc chắn muốn hủy phiếu xuất này?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCancelDialogVisible(false)}>Trở lại</Button>
            <Button
              mode="contained"
              onPress={handleCancel}
              buttonColor="#f44336"
            >
              Xác nhận hủy
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

                <View style={styles.detailContainer}>
                  <Text variant="titleSmall" style={styles.productTitle}>
                    {selectedProduct.productName}
                  </Text>

                  <View style={styles.detailRow}>
                    <View style={styles.detailColumn}>
                      <DetailItem label="Mã chi tiết" value={selectedProduct.outboundDetailsId.toString()} />
                      <DetailItem label="Mã lô" value={selectedProduct.lotId.toString()} />
                      <DetailItem label="Số lô" value={selectedProduct.lotNumber} />
                      <DetailItem label="Loại đơn vị" value={selectedProduct.unitType} />
                    </View>

                    <View style={styles.detailColumn}>
                      <DetailItem label="Số lượng" value={selectedProduct.quantity.toString()} />
                      <DetailItem
                        label="Đơn giá"
                        value={formatVND(selectedProduct.unitPrice)}
                      />
                      <DetailItem
                        label="Thành tiền"
                        value={formatVND(selectedProduct.totalPrice)}
                        highlight
                      />
                      <DetailItem
                        label="Hạn sử dụng"
                        value={format(new Date(selectedProduct.expiryDate), "dd/MM/yyyy")}
                      />
                    </View>
                  </View>
                </View>
              </Card.Content>
              <Card.Actions style={styles.modalActions}>
                <Button
                  mode="contained"
                  onPress={() => setProductModalVisible(false)}
                >
                  Đóng
                </Button>
              </Card.Actions>
            </Card>
          )}
        </Modal>
      </Portal>
    </>
  );
}

function DetailItem({
  label,
  value,
  highlight = false
}: {
  label: string,
  value: string,
  highlight?: boolean
}) {
  return (
    <View style={styles.detailItem}>
      <Text variant="bodySmall" style={styles.detailLabel}>{label}:</Text>
      <Text
        variant="bodyMedium"
        style={[styles.detailValue, highlight && styles.highlightedValue]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: '35%',
    color: '#666',
  },
  value: {
    flex: 1,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#006064',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  actionButton: {
    minWidth: 120,
    margin: 8,
  },
  approveButton: {
    backgroundColor: '#4CAF50', // Green
  },
  cancelButton: {
    backgroundColor: '#F44336', // Red
  },
  modalContainer: {
    padding: 20,
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 5,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataRow: {
    minHeight: 50,
  },
  productTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 16,
  },
  detailContainer: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    color: '#666',
    fontSize: 12,
  },
  detailValue: {
    fontWeight: '500',
    marginTop: 2,
  },
  highlightedValue: {
    color: '#006064',
    fontWeight: 'bold',
  },
  modalActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phoneLink: {
    color: '#1976D2',
    textDecorationLine: 'underline',
  },
});

const getStatusColor = (status?: number): string => {
  switch (status) {
    case 1: return 'orange';
    case 2: return 'blue';
    case 3: return 'red';
    case 4: return 'green';
    case 5: return 'purple';
    default: return 'grey';
  }
};
