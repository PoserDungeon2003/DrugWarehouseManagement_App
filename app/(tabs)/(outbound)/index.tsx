import { OUTBOUND_STATUS_COLOR, OUTBOUND_STATUS_TEXT } from "@/common/const";
import { OutboundStatus } from "@/common/enum";
import { useGetOutbound } from "@/hooks/useOutbound";
import { useGetUser } from "@/hooks/useUser";
import { format } from "date-fns";
import { router } from "expo-router";
import _ from "lodash";
import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { DataTable, Text } from "react-native-paper";

export default function Outbound() {
  const [page, setPage] = useState<number>(0);
  const [numberOfItemsPerPageList] = useState([2, 3, 4, 10]);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const user = useGetUser();
  const token = user?.data?.[0][1];
  const { data, isLoading, isError, error } = useGetOutbound(token || "", {
    page: page + 1,
    pageSize: itemsPerPage,
  });

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
      .value();
  }, [data?.items]);

  if (isLoading) {
    return (
      <View>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    )
  }

  return (
    <ScrollView>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title style={{ flex: 0.3 }}>ID</DataTable.Title>
          <DataTable.Title style={{ flex: 1, justifyContent: 'flex-start' }}>Ngày tạo đơn</DataTable.Title>
          <DataTable.Title numeric>Trạng thái</DataTable.Title>
        </DataTable.Header>

        {_.map(filteredData, (item, index) => (
          <DataTable.Row key={index} onPress={() => router.push(`/outbound-details/${item.outboundId}`)}>
            <DataTable.Cell style={{ flex: 0.3 }}>{item.outboundId}</DataTable.Cell>
            <DataTable.Cell style={{ flex: 1, justifyContent: 'flex-start' }}>
              {format(new Date(item.outboundDate), "dd/MM/yyyy HH:mm:ss")}
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

        <DataTable.Pagination
          page={page}
          numberOfPages={data?.totalPages || 0}
          onPageChange={handlePageChange}
          label={`${from + 1}-${to} of ${data?.totalPages}`}
          numberOfItemsPerPageList={numberOfItemsPerPageList}
          numberOfItemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          selectPageDropdownLabel={'Rows per page'}
        />
      </DataTable>
    </ScrollView>
  );
}