import { LOT_TRANSFER_STATUS_TEXT } from "@/common/const";
import { useGetUser } from "@/hooks/useUser";
import { format } from "date-fns";
import { router } from "expo-router";
import _ from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, View, StyleSheet, RefreshControl } from "react-native";
import { Button, Card, Chip, DataTable, IconButton, Modal, Portal, Searchbar, Text } from "react-native-paper";
import DateTimePicker from '@react-native-community/datetimepicker';
import { LotTransferQueryPaging } from "@/types";
import { useGetLotTransfers } from "@/hooks/useLotTransfer";

export default function LotTransfer() {
  const [page, setPage] = useState<number>(0);
  const [numberOfItemsPerPageList] = useState([5, 10, 20, 50, 100]);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState<'from' | 'to' | null>(null);
  const user = useGetUser();
  const token = user?.data?.token;
  const [refreshing, setRefreshing] = useState(false);
  const [queryParams, setQueryParams] = useState<Omit<LotTransferQueryPaging, "page" | "pageSize">>({
    search: searchQuery,
    dateFrom: dateFrom ? dateFrom.toISOString() : undefined,
    dateTo: dateTo ? dateTo.toISOString() : undefined,
    status: statusFilter?.toString(),
  });
  const { data, isLoading, refetch } = useGetLotTransfers(token || "", {
    ...queryParams,
    page: page + 1,
    pageSize: itemsPerPage,
  });

  useEffect(() => {
    const handler = _.debounce(() => {
      setQueryParams({
        search: searchQuery,
        dateFrom: dateFrom ? dateFrom.toISOString() : undefined,
        dateTo: dateTo ? dateTo.toISOString() : undefined,
        status: statusFilter?.toString() || undefined,
      });
    }, 500);

    handler();

    return () => {
      handler.cancel();
    };
  }, [searchQuery, dateFrom, dateTo, statusFilter]);


  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleItemsPerPageChange = (newPageSize: number) => {
    setItemsPerPage(newPageSize);
    setPage(0);
  };

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, data?.items.length || 0);

  const filteredData = useMemo(() => {
    return _(data?.items)
      .orderBy(it => it.lotTransferStatus, 'asc')
      .value();
  }, [data?.items]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setDateFrom(null);
    setDateTo(null);
    setStatusFilter(null);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch()
    setRefreshing(false);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <Card style={styles.filterCard}>
        <Card.Content>
          {/* Search Input */}
          <Searchbar
            placeholder="Tìm kiếm"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
          />

          {/* Date Filter Row */}
          <View style={styles.dateFilterRow}>
            <Button
              mode="outlined"
              onPress={() => setDatePickerVisible('from')}
              icon="calendar"
              style={styles.dateButton}
            >
              {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'Từ ngày'}
            </Button>

            <Button
              mode="outlined"
              onPress={() => setDatePickerVisible('to')}
              icon="calendar"
              style={styles.dateButton}
            >
              {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'Đến ngày'}
            </Button>

            {(dateFrom || dateTo) && (
              <IconButton
                icon="close-circle"
                size={20}
                onPress={() => {
                  setDateFrom(null);
                  setDateTo(null);
                }}
              />
            )}
          </View>
          {/* Status Filter Chips */}
          <View style={styles.statusFilterContainer}>
            <Text style={styles.filterLabel}>Trạng thái:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {Object.entries(LOT_TRANSFER_STATUS_TEXT).map(([status, label]) => (
                  <Chip
                    key={status}
                    selected={statusFilter === status}
                    onPress={() => setStatusFilter(statusFilter === status ? null : status)}
                    style={[
                      styles.filterChip,
                      statusFilter === status && {
                        backgroundColor: LOT_TRANSFER_STATUS_COLOR[status]
                      }
                    ]}
                    textStyle={statusFilter === status ? { color: 'white' } : {}}
                  >
                    {label}
                  </Chip>
                ))}
              </View>
            </ScrollView>
          </View>
          <View style={styles.additionalFilters}>
            {(searchQuery || dateFrom || dateTo || statusFilter !== null) && (
              <Button
                mode="text"
                onPress={resetFilters}
                icon="filter-remove"
                style={styles.resetButton}
              >
                Xóa bộ lọc
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
      {datePickerVisible && (
        <Portal>
          <Modal
            visible={!!datePickerVisible}
            onDismiss={() => setDatePickerVisible(null)}
            contentContainerStyle={styles.modalContainer}
          >
            <DateTimePicker
              value={datePickerVisible === 'from' ? dateFrom || new Date() : dateTo || new Date()}
              mode="datetime"
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
      <Card style={styles.tableCard}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title style={{ flex: 0.4 }}>ID</DataTable.Title>
            <DataTable.Title style={{ flex: 0.9 }}>Từ kho</DataTable.Title>
            <DataTable.Title style={{ flex: 0.9 }}>Đến kho</DataTable.Title>
            <DataTable.Title style={{ flex: 0.7 }}>Ngày tạo</DataTable.Title>
            <DataTable.Title style={{ flex: 1 }}>Trạng thái</DataTable.Title> {/* Increased from 0.6 to 1 */}
          </DataTable.Header>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
            </View>
          ) : (
            <>
              {_.isEmpty(filteredData) ? (
                <Text style={styles.emptyMessage}>Không có kết quả nào</Text>
              ) : (
                <>
                  {filteredData.map((item) => (
                    <DataTable.Row
                      key={item.lotTransferId}
                      onPress={() => router.push(`/lot-transfer-details/${item.lotTransferId}`)}
                      style={styles.dataRow}
                    >
                      <DataTable.Cell style={{ flex: 0.4 }}>{item.lotTransferId}</DataTable.Cell>
                      <DataTable.Cell style={{ flex: 1 }}>{item.fromWareHouse}</DataTable.Cell>
                      <DataTable.Cell style={{ flex: 1 }}>{item.toWareHouse}</DataTable.Cell>
                      <DataTable.Cell style={{ flex: 1 }}>
                        {format(new Date(item.createdAt), 'dd/MM/yyyy')}
                      </DataTable.Cell>
                      <DataTable.Cell style={{ justifyContent: 'flex-end' }}>
                        <View
                          style={{
                            backgroundColor: LOT_TRANSFER_STATUS_COLOR[item.lotTransferStatus.toLowerCase()],
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 4,
                            alignItems: 'center',
                            minWidth: 80,
                          }}
                        >
                          <Text style={{ color: 'white', fontWeight: '500', fontSize: 12 }}>
                            {LOT_TRANSFER_STATUS_TEXT[item.lotTransferStatus.toLowerCase()]}
                          </Text>
                        </View>
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </>
              )}
            </>
          )}

          <DataTable.Pagination
            page={page}
            numberOfPages={data?.totalPages || 0}
            onPageChange={handlePageChange}
            label={`${from + 1}-${to} của ${data?.totalCount || 0}`}
            numberOfItemsPerPageList={numberOfItemsPerPageList}
            numberOfItemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            selectPageDropdownLabel={'Hàng mỗi trang'}
            showFastPaginationControls
          />
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

const LOT_TRANSFER_STATUS_COLOR: Record<string, string> = {
  "pending": "#FF9800",    // Orange
  "inprogress": "#2196F3", // Blue
  "completed": "#4CAF50",  // Green
  "cancelled": "#F44336"   // Red
};