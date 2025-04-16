import { OUTBOUND_STATUS_COLOR, OUTBOUND_STATUS_TEXT } from "@/common/const";
import { OutboundStatus } from "@/common/enum";
import { useGetOutbound } from "@/hooks/useOutbound";
import { useGetUser } from "@/hooks/useUser";
import { format } from "date-fns";
import { router } from "expo-router";
import _ from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, View, StyleSheet } from "react-native";
import { Button, Chip, DataTable, Divider, IconButton, Modal, Portal, Surface, Text, TextInput } from "react-native-paper";
import DateTimePicker from '@react-native-community/datetimepicker';
import { SearchOutboundRequest } from "@/types";
import { useGetCustomers } from "@/hooks/useCustomer";

export default function Outbound() {
  const [page, setPage] = useState<number>(0);
  const [numberOfItemsPerPageList] = useState([5, 10, 20, 50, 100]);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState<'from' | 'to' | null>(null);
  const user = useGetUser();
  const token = user?.data?.[0][1];
  const { data: customerData } = useGetCustomers(token || "", {
    page: 1,
    pageSize: 100,
  })
  const [customerFilter, setCustomerFilter] = useState<number | null>(null);
  const [customersMenuVisible, setCustomersMenuVisible] = useState(false);
  const [queryParams, setQueryParams] = useState<Omit<SearchOutboundRequest, "page" | "pageSize">>({
    search: searchQuery,
    dateFrom: dateFrom ? dateFrom.toISOString() : undefined,
    dateTo: dateTo ? dateTo.toISOString() : undefined,
    status: statusFilter?.toString(),
  });
  const { data, isLoading, isError, error } = useGetOutbound(token || "", {
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
        customerId: customerFilter || undefined,
      });
    }, 500);

    handler();

    return () => {
      handler.cancel();
    };
  }, [searchQuery, dateFrom, dateTo, statusFilter, customerFilter]);


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
      .orderBy(it => it.status, 'asc')
      .value();
  }, [data?.items]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setDateFrom(null);
    setDateTo(null);
    setStatusFilter(null);
    setCustomerFilter(null);
  };

  return (
    <ScrollView>
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
              {Object.entries(OUTBOUND_STATUS_TEXT).map(([status, label]) => (
                <Chip
                  key={status}
                  selected={statusFilter === Number(status)}
                  onPress={() => setStatusFilter(statusFilter === Number(status) ? null : Number(status))}
                  style={[
                    styles.statusChip,
                    statusFilter === Number(status) && {
                      backgroundColor: OUTBOUND_STATUS_COLOR[Number(status)]
                    }
                  ]}
                  textStyle={statusFilter === Number(status) ? { color: 'white' } : {}}
                >
                  {label}
                </Chip>
              ))}
            </View>
          </ScrollView>
        </View>
        <View style={styles.customerFilterRow}>
          <Text variant="bodySmall">Khách hàng:</Text>
          <View style={styles.customerDropdownContainer}>
            <Button
              mode="outlined"
              onPress={() => setCustomersMenuVisible(true)}
              icon="account-circle"
              style={styles.customerButton}
            >
              {customerFilter
                ? customerData?.items.find(c => c.customerId === customerFilter)?.customerName || 'Chọn khách hàng'
                : 'Chọn khách hàng'}
            </Button>
            {customerFilter && (
              <IconButton
                icon="close-circle"
                size={20}
                onPress={() => setCustomerFilter(null)}
              />
            )}
          </View>

          <Portal>
            <Modal
              visible={customersMenuVisible}
              onDismiss={() => setCustomersMenuVisible(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <View style={styles.modalHeader}>
                <Text variant="titleMedium">Chọn khách hàng</Text>
                <IconButton
                  icon="close"
                  size={20}
                  onPress={() => setCustomersMenuVisible(false)}
                />
              </View>

              <Divider />

              <TextInput
                placeholder="Tìm kiếm khách hàng"
                style={styles.customerSearchInput}
                left={<TextInput.Icon icon="magnify" />}
              />

              <ScrollView style={styles.customersList}>
                {customerData?.items?.map((customer) => (
                  <Button
                    key={customer.customerId}
                    mode="text"
                    onPress={() => {
                      setCustomerFilter(customer.customerId);
                      setCustomersMenuVisible(false);
                    }}
                    style={[
                      styles.customerItem,
                      customerFilter === customer.customerId && styles.customerItemSelected
                    ]}
                  >
                    {customer.customerName} ({customer.phoneNumber})
                  </Button>
                ))}
              </ScrollView>
            </Modal>
          </Portal>
        </View>


        {/* Reset Filters Button */}
        {(searchQuery || dateFrom || dateTo || customerFilter || statusFilter !== null) && (
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
          <DataTable.Title style={{ flex: 0.3 }}>ID</DataTable.Title>
          <DataTable.Title style={{ flex: 1, justifyContent: 'flex-start' }}>Người nhận</DataTable.Title>
          <DataTable.Title style={{ flex: 0.5 }}>Ngày tạo</DataTable.Title>
          <DataTable.Title numeric>Trạng thái</DataTable.Title>
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
                {_.map(filteredData, (item, index) => (
                  <DataTable.Row
                    key={index}
                    onPress={() => router.push(`/outbound-details/${item.outboundId}`)}
                    style={styles.dataRow}
                  >
                    <DataTable.Cell style={{ flex: 0.3 }}>{item.outboundId}</DataTable.Cell>
                    <DataTable.Cell style={{ flex: 1, justifyContent: 'flex-start' }}>
                      {item.customerName}
                    </DataTable.Cell>
                    <DataTable.Cell style={{ justifyContent: 'flex-end' }}>
                      {format(new Date(item.outboundDate), 'dd/MM/yyyy')}
                    </DataTable.Cell>
                    <DataTable.Cell style={{ justifyContent: 'flex-end' }}>
                      <View style={{
                        backgroundColor: OUTBOUND_STATUS_COLOR[item.status],
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 4,
                      }}>
                        <Text style={{ color: 'white' }}>{OUTBOUND_STATUS_TEXT[item.status]}</Text>
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
          label={`${from + 1}-${to} của ${data?.totalCount}`}
          numberOfItemsPerPageList={numberOfItemsPerPageList}
          numberOfItemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          selectPageDropdownLabel={'Hàng mỗi trang'}
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
  customerFilterRow: {
    marginVertical: 8,
  },
  customerDropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  customerButton: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  customerSearchInput: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  customersList: {
    maxHeight: 300,
  },
  customerItem: {
    textAlign: 'left',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customerItemSelected: {
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  dataRow: {
    minHeight: 60,
  },
});