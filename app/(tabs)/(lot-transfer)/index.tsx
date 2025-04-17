import { LOT_TRANSFER_STATUS_TEXT, OUTBOUND_STATUS_COLOR, OUTBOUND_STATUS_TEXT } from "@/common/const";
import { useGetOutbound } from "@/hooks/useOutbound";
import { useGetUser } from "@/hooks/useUser";
import { format } from "date-fns";
import { router } from "expo-router";
import _ from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, View, StyleSheet, RefreshControl } from "react-native";
import { Badge, Button, Chip, DataTable, IconButton, Modal, Portal, Surface, Text, TextInput } from "react-native-paper";
import DateTimePicker from '@react-native-community/datetimepicker';
import { LotTransferQueryPaging, SearchOutboundRequest } from "@/types";
import { useGetLotTransfers } from "@/hooks/useLotTransfer";
import { useQueryClient } from "@tanstack/react-query";

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
  const token = user?.data?.[0][1];
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const [queryParams, setQueryParams] = useState<Omit<LotTransferQueryPaging, "page" | "pageSize">>({
    search: searchQuery,
    dateFrom: dateFrom ? dateFrom.toISOString() : undefined,
    dateTo: dateTo ? dateTo.toISOString() : undefined,
    status: statusFilter?.toString(),
  });
  const { data, isLoading, isError, error } = useGetLotTransfers(token || "", {
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    queryClient.invalidateQueries({
      queryKey: ['lot-transfer']
    })
    setRefreshing(false);
  }, []);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <Surface style={styles.filterContainer} elevation={1}>
        {/* Search Input */}
        <TextInput
          label="Tìm kiếm"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          left={<TextInput.Icon icon="magnify" />}
          right={searchQuery ? (
            <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} />
          ) : null}
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
        <View style={styles.statusFilterRow}>
          <Text variant="bodySmall">Trạng thái:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipContainer}>
              {Object.entries(LOT_TRANSFER_STATUS_TEXT).map(([status, label]) => (
                <Chip
                  key={status}
                  selected={statusFilter === status}
                  onPress={() => setStatusFilter(statusFilter === status ? null : status)}
                  style={[
                    styles.statusChip,
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
        {/* Reset Filters Button */}
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
      </Surface>
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
                if (event.type === 'set' && selectedDate) {
                  if (datePickerVisible === 'from') {
                    setDateFrom(selectedDate);
                  } else {
                    setDateTo(selectedDate);
                  }
                }
                setDatePickerVisible(null);
              }}
            />
          </Modal>
        </Portal>
      )}

      <DataTable>
        <DataTable.Header>
          <DataTable.Title style={{ flex: 0.4 }}>ID</DataTable.Title>
          <DataTable.Title style={{ flex: 1 }}>Từ kho</DataTable.Title>
          <DataTable.Title style={{ flex: 1 }}>Đến kho</DataTable.Title>
          <DataTable.Title style={{ flex: 0.8 }}>Ngày tạo</DataTable.Title>
          <DataTable.Title style={{ flex: 0.6 }} numeric>Trạng thái</DataTable.Title>
        </DataTable.Header>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        ) : (
          <>
            {_.isEmpty(filteredData) ? (
              <Text style={styles.resultsCounter}>Không có kết quả nào</Text>
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
                    <DataTable.Cell style={{ flex: 0.8 }}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    padding: 12,
    margin: 8,
    borderRadius: 8,
  },
  searchInput: {
    marginBottom: 8,
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dateButton: {
    flex: 1,
    marginRight: 8,
  },
  statusFilterRow: {
    marginVertical: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    paddingVertical: 4,
  },
  statusChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  resetButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  resultsCounter: {
    marginLeft: 12,
    marginTop: 8,
    marginBottom: 4,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  createButton: {
    margin: 8,
    marginBottom: 16,
  },
  dataRow: {
    minHeight: 60,
  },
});

const LOT_TRANSFER_STATUS_COLOR: Record<string, string> = {
  "pending": "#FF9800",    // Orange
  "inprogress": "#2196F3", // Blue
  "completed": "#4CAF50",  // Green
  "cancelled": "#F44336"   // Red
};