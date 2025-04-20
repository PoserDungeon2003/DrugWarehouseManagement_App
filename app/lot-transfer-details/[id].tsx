import api from "@/api";
import { LOT_TRANSFER_STATUS_TEXT, OUTBOUND_STATUS_COLOR, OUTBOUND_STATUS_TEXT } from "@/common/const";
import { LotTransferStatus } from "@/common/enum";
import { formatVND } from "@/common/utils";
import { useGetLotTransferById } from "@/hooks/useLotTransfer";
import { useGetOutboundById } from "@/hooks/useOutbound";
import { useGetUser } from "@/hooks/useUser";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useLocalSearchParams } from "expo-router";
import _ from "lodash";
import { useState } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { ActivityIndicator, Badge, Button, Card, DataTable, Dialog, Divider, Portal, Text, Title } from "react-native-paper";
import { useToast } from "react-native-paper-toast";

export default function LotTransferDetails() {
  const { id } = useLocalSearchParams();
  const user = useGetUser();
  const token = user?.data?.token;
  const [approveDialogVisible, setApproveDialogVisible] = useState(false);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [completeDialogVisible, setCompleteDialogVisible] = useState(false);
  const { show, hide } = useToast();
  const queryClient = useQueryClient();

  const { data: lotTransfer, isLoading } = useGetLotTransferById(token || "", Number(id));

  const handleApprove = async () => {
    try {
      const response = await api.put(`/api/LotTransfer`, {
        lotTransferId: lotTransfer?.lotTransferId,
        lotTransferStatus: LotTransferStatus.InProgress,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response) {
        setApproveDialogVisible(false);
        queryClient.invalidateQueries({
          queryKey: ['lot-transfer']
        })
        show({
          message: 'Phê duyệt phiếu chuyển kho thành công',
          type: 'success',
        });
      }
    } catch (error: any) {
      console.log('Error approving lot transfer: ', error);
      show({
        message: error?.response?.data?.message || 'Đã xảy ra lỗi khi phê duyệt phiếu chuyển kho',
        type: 'error',
      });
    }
  }

  const handleComplete = async () => {
    try {
      const response = await api.put(`/api/LotTransfer`, {
        lotTransferId: lotTransfer?.lotTransferId,
        lotTransferStatus: LotTransferStatus.Completed
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response) {
        setCompleteDialogVisible(false);
        queryClient.invalidateQueries({
          queryKey: ['lot-transfer']
        })
        show({
          message: 'Hoàn thành phiếu chuyển kho thành công',
          type: 'success',
        });
      }
    } catch (error: any) {
      console.log('Error completing lot transfer: ', error);
      show({
        message: error?.response?.data?.message || 'Đã xảy ra lỗi khi hoàn thành phiếu chuyển kho',
        type: 'error',
      });
    }
  }

  const handleCancel = async () => {
    try {
      const response = await api.put(`/api/LotTransfer`, {
        lotTransferId: lotTransfer?.lotTransferId,
        lotTransferStatus: LotTransferStatus.Cancelled,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response) {
        setCancelDialogVisible(false);
        queryClient.invalidateQueries({
          queryKey: ['lot-transfer']
        })
        show({
          message: 'Hủy phiếu chuyển kho thành công',
          type: 'success',
        });
      }
    } catch (error: any) {
      console.log('Error cancelling lot transfer: ', error);
      show({
        message: error?.response?.data?.message || 'Đã xảy ra lỗi khi hủy phiếu chuyển kho',
        type: 'error',
      });
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  return (
    <>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Header Section */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.headerRow}>
                <Title>Chi tiết phiếu chuyển kho</Title>
                <Badge
                  size={32}
                  style={{
                    backgroundColor: getStatusColor(lotTransfer?.lotTransferStatus.toLowerCase()),
                    paddingHorizontal: 8,
                    fontWeight: 'semibold',
                  }}
                >
                  {LOT_TRANSFER_STATUS_TEXT[lotTransfer?.lotTransferStatus.toLowerCase() || "Không xác định"]}
                </Badge>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Mã phiếu:</Text>
                <Text variant="bodyLarge" style={styles.value}>{lotTransfer?.lotTransferCode}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Ngày tạo:</Text>
                <Text variant="bodyLarge" style={styles.value}>
                  {format(new Date(lotTransfer?.createdAt || new Date()), "dd/MM/yyyy HH:mm")}
                </Text>
              </View>

              {lotTransfer?.updatedAt && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>Cập nhật:</Text>
                  <Text variant="bodyLarge" style={styles.value}>
                    {format(new Date(lotTransfer.updatedAt), "dd/MM/yyyy HH:mm")}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Warehouse Information */}
          <Card style={styles.card}>
            <Card.Content>
              <Title>Thông tin chuyển kho</Title>
              <Divider style={styles.divider} />

              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Từ kho:</Text>
                <Text variant="bodyLarge" style={styles.value}>{lotTransfer?.fromWareHouse}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Đến kho:</Text>
                <Text variant="bodyLarge" style={styles.value}>{lotTransfer?.toWareHouse}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Người tạo:</Text>
                <Text variant="bodyLarge" style={styles.value}>{lotTransfer?.createdBy}</Text>
              </View>
            </Card.Content>
          </Card>

          {/* Product Details */}
          <Card style={styles.card}>
            <Card.Content>
              <Title>Chi tiết sản phẩm chuyển kho</Title>
              <Divider style={styles.divider} />

              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Sản phẩm</DataTable.Title>
                  <DataTable.Title>Số lô</DataTable.Title>
                  <DataTable.Title numeric>Số lượng</DataTable.Title>
                  <DataTable.Title style={{ justifyContent: "flex-end" }}>Hạn dùng</DataTable.Title>
                </DataTable.Header>

                {lotTransfer?.lotTransferDetails.map((detail) => (
                  <DataTable.Row key={detail.lotTransferDetailId}>
                    <DataTable.Cell>
                      <Text variant="bodyMedium">{detail.productName || "Không có tên"}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell>{detail.lotNumber}</DataTable.Cell>
                    <DataTable.Cell numeric>{detail.quantity}</DataTable.Cell>
                    <DataTable.Cell style={{ justifyContent: "flex-end" }}>
                      {detail.expiryDate && detail.expiryDate !== "0001-01-01"
                        ? format(new Date(detail.expiryDate), "dd/MM/yyyy")
                        : "N/A"}
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}

                <DataTable.Row style={styles.totalRow}>
                  <DataTable.Cell><Text variant="bodyLarge">Tổng sản phẩm</Text></DataTable.Cell>
                  <DataTable.Cell numeric>
                    <Text variant="bodyLarge" style={styles.totalAmount}>
                      {lotTransfer?.lotTransferDetails.reduce((acc, item) => acc + item.quantity, 0) || 0}
                    </Text>
                  </DataTable.Cell>
                </DataTable.Row>
              </DataTable>
            </Card.Content>
          </Card>

          {/* Actions Section */}
          <Card style={styles.card}>
            <Card.Content>
              <Title>Thao tác</Title>
              <Divider style={styles.divider} />
              <View style={styles.buttonContainer}>
                {lotTransfer?.lotTransferStatus.toLowerCase() == "pending" ? (
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
                ) : lotTransfer?.lotTransferStatus.toLowerCase() == "inprogress" ? (
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
      {/* Approve Dialog */}
      <Portal>
        <Dialog visible={approveDialogVisible} onDismiss={() => setApproveDialogVisible(false)}>
          <Dialog.Title>Xác nhận phê duyệt</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Bạn có chắc chắn muốn phê duyệt phiếu chuyển kho này?
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

      {/* Complete Dialog */}
      <Portal>
        <Dialog visible={completeDialogVisible} onDismiss={() => setCompleteDialogVisible(false)}>
          <Dialog.Title>Xác nhận hoàn thành</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Bạn có chắc chắn muốn đánh dấu phiếu chuyển kho này đã hoàn thành?
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
              Bạn có chắc chắn muốn hủy phiếu chuyển kho này?
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
    </>
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
});

const getStatusColor = (status?: string): string => {
  switch (status) {
    case 'pending': return 'orange';    // Pending
    case 'inprogress': return '#2196F3';   // InProgress - Blue
    case 'completed': return '#4CAF50';   // Completed - Green
    case 'cancelled': return '#F44336';   // Cancelled - Red
    default: return 'grey';
  }
};
