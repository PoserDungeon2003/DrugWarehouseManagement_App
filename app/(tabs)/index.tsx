import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useGetProfile, useGetUser } from '@/hooks/useUser';
import { ActivityIndicator, Avatar, Button, Card, DataTable, IconButton, Surface, Title } from 'react-native-paper';
import { useCallback, useEffect, useState } from 'react';
import { useGetLotTransfers } from '@/hooks/useLotTransfer';
import { useGetOutbound } from '@/hooks/useOutbound';
import { useGetInbounds } from '@/hooks/useInbound';
import { format } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LotTransferStatus } from '@/common/enum';
import theme from '@/theme';
import Loading from '@/components/Loading';

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const user = useGetUser();
  const token = user.data?.token; // Access token
  const { data: profile } = useGetProfile(token || '');
  const { data: inboundData, isLoading: inboundLoading, refetch: refetchInbound } = useGetInbounds(token || "", {
    page: 1,
    pageSize: 100,
    inboundStatus: 'pending',
  });

  const { data: outboundData, isLoading: outboundLoading, refetch: refetchOutbound } = useGetOutbound(token || "", {
    page: 1,
    pageSize: 100,
    status: "pending"
  });

  const { data: transferData, isLoading: transferLoading, refetch: refetchLotTransfer } = useGetLotTransfers(token || "", {
    page: 1,
    pageSize: 100,
    status: LotTransferStatus.Pending.toString(),
  });

  const [recentActivity, setRecentActivity] = useState<Array<{
    id: number;
    type: 'inbound' | 'outbound' | 'transfer';
    code: string;
    date: string;
    status: string;
  }>>([]);

  // Combine and sort recent activities
  useEffect(() => {
    const combined: any[] = [];

    inboundData?.items?.forEach(item => {
      combined.push({
        id: item.inboundId,
        type: 'inbound',
        code: item.inboundCode,
        date: item.inboundDate,
        status: item.status
      });
    });

    outboundData?.items?.forEach(item => {
      combined.push({
        id: item.outboundId,
        type: 'outbound',
        code: item.outboundCode,
        date: item.outboundDate,
        status: item.status
      });
    });

    transferData?.items?.forEach(item => {
      combined.push({
        id: item.lotTransferId,
        type: 'transfer',
        code: item.lotTransferCode,
        date: item.createdAt,
        status: item.lotTransferStatus
      });
    });

    // Sort by date (newest first)
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setRecentActivity(combined.slice(0, 5));
  }, [inboundData, outboundData, transferData]);

  // Count tasks by status
  const pendingInbounds = inboundData?.items.length || 0;
  const pendingOutbounds = outboundData?.items.length || 0;
  const pendingTransfers = transferData?.items.length || 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchInbound();
    await refetchOutbound();
    await refetchLotTransfer();
    setRefreshing(false);
  }, []);

  const pendingTasksCount = pendingInbounds + pendingOutbounds + pendingTransfers;
  if (inboundLoading || outboundLoading || transferLoading) {
    return (
      <Loading />
    );
  }
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Card */}
      <Card style={styles.welcomeCard}>
        <Card.Content style={styles.welcomeContent}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeSubtitle}>Chào mừng trở lại,</Text>
            <Title style={styles.welcomeName}>{profile?.fullName}</Title>
            <Text style={styles.dateText}>
              {format(new Date(), 'EEEE, dd/MM/yyyy')}
            </Text>
          </View>
          <Avatar.Text
            size={60}
            label={profile?.fullName?.split(' ')
              .map(n => n[0])
              .join('')
              .substring(0, 2) || 'U'}
            style={styles.avatar}
          />
        </Card.Content>
      </Card>

      {/* Stats Cards Row */}
      <View style={styles.statsContainer}>
        <Surface style={[styles.statCard, { backgroundColor: '#E3F2FD' }]} elevation={1}>
          <MaterialCommunityIcons name="arrow-down-box" size={32} color="#1976D2" />
          <Text style={styles.statNumber}>{inboundData?.totalCount || 0}</Text>
          <Text style={styles.statLabel}>Nhập kho</Text>
        </Surface>

        <Surface style={[styles.statCard, { backgroundColor: '#FFF8E1' }]} elevation={1}>
          <MaterialCommunityIcons name="arrow-up-box" size={32} color="#FF9800" />
          <Text style={styles.statNumber}>{outboundData?.totalCount || 0}</Text>
          <Text style={styles.statLabel}>Xuất kho</Text>
        </Surface>

        <Surface style={[styles.statCard, { backgroundColor: '#E8F5E9' }]} elevation={1}>
          <MaterialCommunityIcons name="swap-horizontal-bold" size={32} color="#4CAF50" />
          <Text style={styles.statNumber}>{transferData?.totalCount || 0}</Text>
          <Text style={styles.statLabel}>Chuyển kho</Text>
        </Surface>
      </View>

      {/* Tasks Card */}
      <Card style={styles.card}>
        <Card.Title
          title="Công việc đang chờ xử lý"
          titleStyle={styles.cardTitle}
          right={(props) => <IconButton {...props} icon="chevron-right" onPress={() => { }} />}
        />
        <Card.Content>
          <View style={styles.pendingContainer}>
            <View style={styles.pendingItem}>
              <View style={[styles.indicator, { backgroundColor: '#1976D2' }]} />
              <Text>Nhập kho</Text>
              <Text style={styles.countLabel}>{pendingInbounds}</Text>
            </View>
            <View style={styles.pendingItem}>
              <View style={[styles.indicator, { backgroundColor: '#FF9800' }]} />
              <Text>Xuất kho</Text>
              <Text style={styles.countLabel}>{pendingOutbounds}</Text>
            </View>
            <View style={styles.pendingItem}>
              <View style={[styles.indicator, { backgroundColor: '#4CAF50' }]} />
              <Text>Chuyển kho</Text>
              <Text style={styles.countLabel}>{pendingTransfers}</Text>
            </View>
          </View>

          {pendingTasksCount > 0 ? (
            <Text style={styles.tasksSummary}>
              Bạn có <Text style={styles.taskCount}>{pendingTasksCount}</Text> công việc cần xử lý
            </Text>
          ) : (
            <Text style={styles.tasksSummary}>
              Không có công việc nào đang chờ xử lý
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      {/* <Card style={styles.card}>
        <Card.Title title="Thao tác nhanh" titleStyle={styles.cardTitle} />
        <Card.Content style={styles.actionsContainer}>
          <Button
            mode="outlined"
            icon="arrow-down"
            onPress={() => router.push('/(tabs)/inbound/create')}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
          >
            Tạo nhập kho
          </Button>
          <Button
            mode="outlined"
            icon="arrow-up"
            onPress={() => router.push('/(tabs)/(outbound)/create')}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
          >
            Tạo xuất kho
          </Button>
          <Button
            mode="outlined"
            icon="swap-horizontal"
            onPress={() => router.push('/(tabs)/(lot-transfer)/create')}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
          >
            Tạo chuyển kho
          </Button>
        </Card.Content>
      </Card> */}

      {/* Recent Activities */}
      <Card style={styles.card}>
        <Card.Title
          title="Hoạt động gần đây"
          titleStyle={styles.cardTitle}
          right={(props) => <IconButton {...props} icon="chevron-right" onPress={() => { }} />}
        />
        <Card.Content>
          <DataTable>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <DataTable.Row
                  key={`${activity.type}-${activity.id}`}
                  onPress={() => {
                    switch (activity.type) {
                      case 'inbound':
                        router.push(`/inbound-details/${activity.id}`);
                        break;
                      case 'outbound':
                        router.push(`/outbound-details/${activity.id}`);
                        break;
                      case 'transfer':
                        router.push(`/lot-transfer-details/${activity.id}`);
                        break;
                    }
                  }}
                >
                  <DataTable.Cell>
                    <View style={styles.activityIconContainer}>
                      {activity.type === 'inbound' && (
                        <MaterialCommunityIcons name="arrow-down-box" size={24} color="#1976D2" />
                      )}
                      {activity.type === 'outbound' && (
                        <MaterialCommunityIcons name="arrow-up-box" size={24} color="#FF9800" />
                      )}
                      {activity.type === 'transfer' && (
                        <MaterialCommunityIcons name="swap-horizontal-bold" size={24} color="#4CAF50" />
                      )}
                    </View>
                  </DataTable.Cell>
                  <DataTable.Cell>{activity.code}</DataTable.Cell>
                  <DataTable.Cell>
                    <View style={styles.activityStatus}>
                      <View style={[
                        styles.statusDot,
                        {
                          backgroundColor: activity.status.toString().toLowerCase() === 'completed'
                            ? '#4CAF50'
                            : activity.status.toString().toLowerCase() === 'pending'
                              ? '#FFC107'
                              : activity.status.toString().toLowerCase() === 'cancelled'
                                ? '#F44336'
                                : '#2196F3'
                        }
                      ]} />
                      <Text style={styles.statusText}>
                        {activity.status}
                      </Text>
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))
            ) : (
              <Text style={styles.noActivities}>Không có hoạt động gần đây</Text>
            )}
          </DataTable>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  welcomeCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.primary,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  welcomeTextContainer: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  welcomeSubtitle: {
    color: 'black',
    fontSize: 14,
  },
  welcomeName: {
    color: 'black',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateText: {
    color: '#2e78f0',
  },
  avatar: {
    backgroundColor: '#E3F2FD',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 8,
    gap: 4,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pendingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
    padding: 16,
    borderRadius: 8,
  },
  pendingItem: {
    alignItems: 'center',
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  countLabel: {
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 4,
  },
  tasksSummary: {
    textAlign: 'center',
    marginTop: 12,
  },
  taskCount: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionButton: {
    marginVertical: 4,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonContent: {
    height: 44,
  },
  activityIconContainer: {
    marginRight: 8,
  },
  activityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
  },
  noActivities: {
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  }
});