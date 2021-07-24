import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const [filter, setFilter] = useState<ScheduleFilter>({} as ScheduleFilter);
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

  const { data: schedules, loading: scheduleLoading, refetch } = useGet<Schedule[]>({
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

  const updateFilter = (next: Partial<ScheduleFilter>) => setFilter(prev => ({
    ...prev,
    ...next
  }))

  const locationSelectRef = useRef<any>();
  const dateSelectRef = useRef<any>();

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
    const filtered = schedules.filter((schedule) => parseDate(schedule.date).equals(filter.date) 
      && (filter.isVaccinated ? schedule.isVaccinated : true)
    );
    return filtered
  }, [filter.date, filter.isVaccinated, schedules]);

  useEffect(() => {
    if (filter.locationId) {
      refetch();
      dateSelectRef.current.select.clearValue();
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
              <Select options={classOptions} onChange={next => {
                updateFilter({
                  class: next.value,
                })
                locationSelectRef.current.select.clearValue();
            }} />
            </Field>
            <Field>
              <Label>Location</Label>
              <Select
                ref={locationSelectRef}
                options={locationsOptions}
                onChange={next => {
                  updateFilter({
                    locationId: (next && next.value) || undefined,
                  })
                  refetch();
                  dateSelectRef.current.select.clearValue();
                }}
                isLoading={locationLoading}
              />
            </Field>
            <Field>
              <Label>Date</Label>
              <DateSelect
                ref={dateSelectRef}
                startDate={startDate}
                endDate={endDate}
                onChange={(next => updateFilter({
                  date: (next && next.value) || undefined
                }))}
                isLoading={scheduleLoading}
                isDisabled={scheduleLoading || filter.locationId === undefined}
              />
            </Field>
            <Field textAlign="right">
              <Form.Checkbox onChange={(next) => updateFilter({
                isVaccinated: next.target.checked
              })}>
              Show only vaccinated classes
              </Form.Checkbox>
            </Field>

            <Box>
              <Content>
                {filteredSchedules && filteredSchedules.length > 0 ? filteredSchedules.map((schedule) => {
                  const canBook = orders.every(
                    (order) => order.schedule.id !== schedule.id
                  );
                  const action = canBook && (
                    <ActionButton onClick={() => book(schedule.id)}>
                      Book
                    </ActionButton>
                  );
                  return <ScheduleItem key={schedule.id} schedule={schedule} action={action} />;
                }) : <span>No classes available</span>}
              </Content>
          </Box>
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
