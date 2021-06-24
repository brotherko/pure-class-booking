import React, { useEffect, useMemo, useState } from "react";
import {
  Form,
  Container,
  Content,
  Box,
  Hero,
  Message,
} from "react-bulma-components";
import { Location } from "../types/db/location";
import Select from "react-select";
import { useGet, useMutate } from "restful-react";
import { DateSelect } from "./DateSelect";
import { DateTime, Duration } from "luxon";
import { useMessage } from "../hooks/useMessage";
import { ScheduleFilter, ScheduleItem } from "./ScheduleItem";
import { HistorialOrders } from "./HistorialOrders";
import { Order } from "../types/db/order";
import { Schedule } from "../types/db/schedule";
import { Header } from "./Header";
import { isDev } from "../utils/is-dev";
import { ApiResponse } from "../types/api-response";
import { ActionButton } from "./ActionButton";

const { Field, Label } = Form;

const parseDate = (date: string) => {
  return DateTime.fromFormat(date, "yyyy-LL-dd");
};

export const NewOrder = () => {
  const { data: locations, loading: locationLoading } = useGet<Location[]>({
    path: "locations",
    resolve: (data) => {
      return data.data;
    },
  });
  const [filter, setFilter] = useState<ScheduleFilter>({});
  const { success } = useMessage();

  const { mutate: deleteOrder } = useMutate<ApiResponse<Order>>({
    verb: "DELETE",
    path: `/orders`,
  });

  const deleteOrderAction = async (id: string) => {
    const { message } = await deleteOrder(id);
    refetchOrders();
    success(message);
  };
  const { data: orders, refetch: refetchOrders } = useGet<Order[]>({
    path: "orders",
    resolve: (data) => data.data,
  });

  const { data: schedules, refetch } = useGet<Schedule[]>({
    path: `schedules/location/${filter ? filter.locationId : ""}`,
    lazy: true,
    resolve: (data) => data.data,
  });

  const { mutate: postBook } = useMutate<ApiResponse<Order>>({
    verb: "POST",
    path: "orders",
    resolve: (data) => data,
  });

  const book = async (classId: string) => {
    const { message } = await postBook({
      classId: classId.toString(),
    });
    refetchOrders();
    success(message);
  };

  const onClassChange = (v: { value: "F" | "Y" }) => {
    setFilter((old) => ({
      ...old,
      class: v.value,
    }));
  };

  const onDateChange = (v: { value: DateTime }) => {
    setFilter((old) => ({
      ...old,
      date: v.value,
    }));
  };

  const onLocationChange = (v: { value: string }) => {
    setFilter((old) => ({
      ...old,
      locationId: v.value,
    }));
  };

  const now = DateTime.now();
  const daysAdj = isDev() ? 0 : now.hour >= 9 ? 3 : 2;
  const startDate = now.plus(Duration.fromObject({ days: daysAdj }));
  const endDate = useMemo(() => {
    if (!startDate || !schedules || schedules.length === 0) {
      return startDate;
    }
    return DateTime.max.apply(
      null,
      schedules.map((schedule) =>
        DateTime.fromFormat(schedule.date, "yyyy-LL-dd")
      )
    );
  }, [schedules, startDate]);

  const locationsOptions = useMemo(() => {
    if (!locations || !filter.class) {
      return undefined;
    }
    return locations
      .filter((location) => location.sector === filter.class)
      .map((location) => ({
        label: location.name,
        value: location.id,
      }));
  }, [filter.class, locations]);
  const filteredSchedules = useMemo(() => {
    if (!schedules || !filter.date) {
      return undefined;
    }
    return schedules.filter((schedule) =>
      parseDate(schedule.date).equals(filter.date)
    );
  }, [filter.date, schedules]);

  useEffect(() => {
    if (filter.locationId) {
      refetch();
    }
  }, [filter.locationId, refetch]);

  const classOptions: { label: string; value: "F" | "Y" }[] = [
    { label: "Pure Fitness", value: "F" },
    { label: "Pure Yoga", value: "Y" },
  ];

  return (
    <Hero.Body alignItems="baseline">
      <Container>
        <Header />
        <Message>
          <Message.Header>
            <span>Search</span>
          </Message.Header>
          <Message.Body>
            <Field>
              <Label>Service</Label>
              <Select options={classOptions} onChange={onClassChange} />
            </Field>
            <Field>
              <Label>Location</Label>
              <Select
                options={locationsOptions}
                onChange={onLocationChange}
                isLoading={locationLoading}
              />
            </Field>
            <Field>
              <Label>Date</Label>
              <DateSelect
                startDate={startDate}
                endDate={endDate}
                onChange={onDateChange}
                isDisabled={filter.locationId === undefined}
              />
            </Field>

            {filteredSchedules && filteredSchedules.length > 0 && (
              <Box>
                <Content>
                  {filteredSchedules.map((schedule) => {
                    const canBook = orders.every(
                      (order) => order.schedule.id !== schedule.id
                    );
                    const action = canBook && (
                      <ActionButton onClick={() => book(schedule.id)}>
                        Book
                      </ActionButton>
                    );
                    return <ScheduleItem schedule={schedule} action={action} />;
                  })}
                </Content>
              </Box>
            )}
          </Message.Body>
        </Message>

        <Message>
          <Message.Header>
            <span>Bookings (Latest 10 results)</span>
          </Message.Header>
          <Message.Body>
            <HistorialOrders
              orders={orders}
              deleteOrderAction={deleteOrderAction}
            />
          </Message.Body>
        </Message>
      </Container>
    </Hero.Body>
  );
};
