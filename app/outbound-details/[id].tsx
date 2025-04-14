import { formatVND } from "@/common/utils";
import { useGetOutboundById } from "@/hooks/useOutbound";
import { useGetUser } from "@/hooks/useUser";
import { format } from "date-fns";
import { useLocalSearchParams } from "expo-router";
import _ from "lodash";
import { ScrollView, View, StyleSheet } from "react-native";
import { ActivityIndicator, Badge, Card, DataTable, Divider, Text, Title } from "react-native-paper";

export default function OutboundDetails() {
  const { id } = useLocalSearchParams();
  const user = useGetUser();
  const token = user?.data?.[0][1];

  const { data: outbound, isLoading } = useGetOutboundById(token || "", Number(id));

  // Calculate total amount
  const totalAmount = _.reduce(outbound?.outboundDetails,
    (sum, item) => sum + item.totalPrice, 0
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        {/* Header Section */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerRow}>
              <Title>Chi tiết phiếu xuất</Title>
              <Badge
                size={30}
                style={{
                  backgroundColor: getStatusColor(outbound?.status)
                }}
              >
                {getStatusText(outbound?.status)}
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
            <Title>Thông tin khách hàng</Title>
            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>Khách hàng:</Text>
              <Text variant="bodyLarge" style={styles.value}>{outbound?.customerName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>Số điện thoại:</Text>
              <Text variant="bodyLarge" style={styles.value}>{outbound?.phoneNumber}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Receiver Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Thông tin người nhận</Title>
            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>Tên người nhận:</Text>
              <Text variant="bodyLarge" style={styles.value}>{outbound?.receiverName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>Số điện thoại:</Text>
              <Text variant="bodyLarge" style={styles.value}>{outbound?.receiverPhone}</Text>
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
                <DataTable.Row key={detail.outboundDetailsId}>
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
      </View>
    </ScrollView>

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
});


const getStatusText = (status?: number): string => {
  switch (status) {
    case 1: return 'Đang chờ';
    case 2: return 'Đang xử lý';
    case 3: return 'Đã hủy';
    case 4: return 'Hoàn thành';
    case 5: return 'Đã trả lại';
    default: return 'Không xác định';
  }
};

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
