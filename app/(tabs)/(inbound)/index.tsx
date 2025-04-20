import { INBOUND_STATUS_COLOR, INBOUND_STATUS_TEXT } from "@/common/const";
import { InboundStatus } from "@/common/enum";
import { useGetUser } from "@/hooks/useUser";
import { format } from "date-fns";
import { router } from "expo-router";
import _ from "lodash";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View, StyleSheet, RefreshControl } from "react-native";
import { Button, Card, Chip, DataTable, IconButton, Modal, Portal, Searchbar, Text } from "react-native-paper";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useGetInbounds } from "@/hooks/useInbound";

export function parseInboundStatus(status: string): InboundStatus {
  switch (status.toLowerCase()) {
    case 'pending': return InboundStatus.Pending;
    case 'inprogress': return InboundStatus.InProgress;
    case 'completed': return InboundStatus.Completed;
    case 'cancelled': return InboundStatus.Cancelled;
    default: return InboundStatus.Pending;
  }
}

export default function Outbound() {
  const [page, setPage] = useState<number>(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [numberOfItemsPerPageList] = useState([5, 10, 20, 50]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<InboundStatus | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState<'from' | 'to' | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showReportPending, setShowReportPending] = useState(false);

  const user = useGetUser();
  const token = user?.data?.token;

  // Query parameters state with debouncing
  const [queryParams, setQueryParams] = useState({
    search: '',
    dateFrom: undefined as string | undefined,
    dateTo: undefined as string | undefined,
    inboundStatus: undefined as InboundStatus | undefined,
    isReportPendingExist: false,
  });

  // Create debounced function for query params
  const debouncedSetQueryParams = useCallback(
    _.debounce((params) => {
      setQueryParams(params);
    }, 500),
    []
  );

  // Update query params when filters change
  useEffect(() => {
    const newParams = {
      search: searchQuery,
      dateFrom: dateFrom ? dateFrom.toISOString() : undefined,
      dateTo: dateTo ? dateTo.toISOString() : undefined,
      inboundStatus: statusFilter || undefined,
      isReportPendingExist: showReportPending,
    };

    debouncedSetQueryParams(newParams);

    return () => {
      debouncedSetQueryParams.cancel();
    };
  }, [searchQuery, dateFrom, dateTo, statusFilter, showReportPending]);

  // Fetch data with the query params
  const { data, isLoading, refetch } = useGetInbounds(token || "", {
    ...queryParams,
    page: page + 1,
    pageSize: itemsPerPage,
  });

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleItemsPerPageChange = (newPageSize: number) => {
    setItemsPerPage(newPageSize);
    setPage(0);
  };

  // Calculate pagination values
  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, data?.totalCount || 0);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setDateFrom(null);
    setDateTo(null);
    setStatusFilter(null);
    setShowReportPending(false);
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Filter section */}
      <Card style={styles.filterCard}>
        <Card.Content>
          {/* Search input */}
          <Searchbar
            placeholder="Tìm kiếm theo mã phiếu"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />

          {/* Date filters */}
          <View style={styles.dateFilterRow}>
            <Button
              mode="outlined"
              icon="calendar"
              onPress={() => setDatePickerVisible('from')}
              style={styles.dateButton}
            >
              {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'Từ ngày'}
            </Button>
            <Button
              mode="outlined"
              icon="calendar"
              onPress={() => setDatePickerVisible('to')}
              style={styles.dateButton}
            >
              {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'Đến ngày'}
            </Button>
            {(dateFrom || dateTo) && (
              <IconButton
                icon="close-circle"
                size={24}
                onPress={() => {
                  setDateFrom(null);
                  setDateTo(null);
                }}
              />
            )}
          </View>

          {/* Status filter chips */}
          <View style={styles.statusFilterContainer}>
            <Text style={styles.filterLabel}>Trạng thái:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {Object.entries(INBOUND_STATUS_TEXT).map(([key, value]) => (
                  <Chip
                    key={key}
                    selected={statusFilter === Number(key)}
                    onPress={() => setStatusFilter(statusFilter === Number(key) ? null : Number(key))}
                    style={[
                      styles.filterChip,
                      statusFilter === Number(key) && {
                        backgroundColor: INBOUND_STATUS_COLOR[Number(key) as InboundStatus]
                      }
                    ]}
                    textStyle={statusFilter === Number(key) ? { color: 'white' } : {}}
                  >
                    {value}
                  </Chip>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Additional filters */}
          <View style={styles.additionalFilters}>
            <Chip
              selected={showReportPending}
              onPress={() => setShowReportPending(!showReportPending)}
              style={showReportPending ? styles.activeChip : styles.chip}
              icon="alert"
            >
              Có báo cáo sự cố
            </Chip>

            {/* Reset filters */}
            {(searchQuery || dateFrom || dateTo || statusFilter !== null || showReportPending) && (
              <Button
                mode="text"
                icon="filter-remove"
                onPress={resetFilters}
                style={styles.resetButton}
              >
                Xóa bộ lọc
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Date picker modal */}
      {datePickerVisible && (
        <Portal>
          <Modal
            visible={!!datePickerVisible}
            onDismiss={() => setDatePickerVisible(null)}
            contentContainerStyle={styles.modalContainer}
          >
            <DateTimePicker
              value={datePickerVisible === 'from' ? dateFrom || new Date() : dateTo || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setDatePickerVisible(null);
                if (
                  (event && event.type === 'set' && selectedDate) ||
                  (event?.type === 'set' && selectedDate)
                ) {
                  if (datePickerVisible === 'from') {
                    setDateFrom(selectedDate);
                  } else {
                    setDateTo(selectedDate);
                  }
                }
              }}
            />
          </Modal>
        </Portal>
      )}

      {/* Data table */}
      <Card style={styles.tableCard}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title style={{ flex: 0.4 }}>ID</DataTable.Title>
            <DataTable.Title style={{ flex: 1, justifyContent: 'flex-start' }}>Ngày nhập</DataTable.Title>
            <DataTable.Title style={{ flex: 0.8 }}>Kho</DataTable.Title>
            <DataTable.Title style={{ justifyContent: 'flex-end' }}>Trạng thái</DataTable.Title>
          </DataTable.Header>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
            </View>
          ) : (
            <>
              {data?.items.length === 0 ? (
                <Text style={styles.emptyMessage}>Không có dữ liệu</Text>
              ) : (
                data?.items.map((item) => {
                  const statusEnum = parseInboundStatus(item.status);
                  return (
                    <DataTable.Row
                      key={item.inboundId}
                      onPress={() => router.push(`/inbound-details/${item.inboundId}`)}
                      style={styles.dataRow}
                    >
                      <DataTable.Cell style={{ flex: 0.4 }}>{item.inboundId}</DataTable.Cell>
                      <DataTable.Cell style={{ flex: 1, justifyContent: 'flex-start' }}>
                        {item.inboundDate}
                      </DataTable.Cell>
                      <DataTable.Cell style={{ flex: 0.8 }}>{item.warehouseName}</DataTable.Cell>
                      <DataTable.Cell style={{ justifyContent: 'flex-end' }}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: INBOUND_STATUS_COLOR[statusEnum] }
                        ]}>
                          <Text style={styles.statusText}>
                            {INBOUND_STATUS_TEXT[statusEnum]}
                          </Text>
                        </View>
                      </DataTable.Cell>
                    </DataTable.Row>
                  );
                })
              )}

              {/* Pagination */}
              <DataTable.Pagination
                page={page}
                numberOfPages={data?.totalPages || 0}
                onPageChange={handlePageChange}
                label={`${from + 1}-${to} của ${data?.totalCount || 0}`}
                numberOfItemsPerPageList={numberOfItemsPerPageList}
                numberOfItemsPerPage={itemsPerPage}
                onItemsPerPageChange={handleItemsPerPageChange}
                selectPageDropdownLabel={"Hàng mỗi trang"}
                showFastPaginationControls
              />
            </>
          )}
        </DataTable>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
  },
  filterCard: {
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 12,
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    marginRight: 8,
  },
  statusFilterContainer: {
    marginBottom: 12,
  },
  filterLabel: {
    marginBottom: 8,
    fontWeight: '500',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  activeChip: {
    backgroundColor: '#2196F3',
    marginRight: 8,
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  additionalFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  resetButton: {
    marginLeft: 'auto',
  },
  tableCard: {
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  dataRow: {
    height: 60,
  },
  statusBadge: {
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  statusText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 5,
  },
});