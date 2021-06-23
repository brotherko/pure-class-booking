import React, { useEffect, useMemo, useState } from 'react';
import { Form, Container, Content, Box, Hero, Button, Message } from 'react-bulma-components';
import { useGet, useMutate } from 'restful-react';
import { LocationSelect } from './LocationSelect';
import { DateSelect } from './DateSelect';
import { DateTime, Duration } from 'luxon';
import { useMessage } from '../hooks/useMessage';
import { ScheduleFilter, ScheduleItem } from './ScheduleItem';
import { HistorialOrders } from './HistorialOrders';
import { Order } from '../types/db/order';
import { Schedule } from '../types/db/schedule';
import { ApiResponse } from '../types/api-response';
import { Header } from './Header';
import { isDev } from '../utils/is-dev';

const { Field, Label } = Form;

const parseDate = (date: string) => {
  return DateTime.fromFormat(date, "yyyy-LL-dd");
};
export const NewOrder = () => {
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
  }
  const { data: orders, refetch: refetchOrders } = useGet<Order[]>({
    path: 'orders',
    resolve: data => data.data
  });

  const { data: schedules, refetch } = useGet<Schedule[]>({
    path: `schedules/location/${filter ? filter.locationId : ''}`,
    lazy: true,
    resolve: data => data.data
  });

  const { mutate: postBook } = useMutate<ApiResponse<Order>>({
    verb: "POST",
    path: "orders",
    resolve: data => data,
  });

  const book = async (classId: number) => {
    const { message } = await postBook({
      classId: classId.toString()
    });
    refetchOrders();
    success(message);
  };

  const onDateChange = (v: { value: DateTime; }) => {
    setFilter((old) => ({
      ...old,
      date: v.value
    }));
  };

  const onLocationChange = (v: { value: number; }) => {
    setFilter((old) => ({
      ...old,
      locationId: v.value
    }));
  };

  const now = DateTime.now();
  const daysAdj = isDev() ? 0 : (now.hour >= 9) ? 3 : 2;
  const startDate = now.plus(Duration.fromObject({ days: daysAdj}));
  const endDate = useMemo(() => {
    if (!startDate || !schedules || schedules.length === 0) {
      return startDate;
    }
    return DateTime.max.apply(null, schedules.map((schedule) => DateTime.fromFormat(schedule.start_date, "yyyy-LL-dd")));
  }, [schedules, startDate]);

  const filteredSchedules = useMemo(() => {
    if (!schedules || !filter.date) {
      return undefined;
    }
    return schedules.filter((schedule) => parseDate(schedule.start_date).equals(filter.date));
  }, [filter.date, schedules]);



  useEffect(() => {
    if (filter.locationId) {
      refetch();
    }
  }, [filter.locationId, refetch]);


  return <Hero.Body alignItems="baseline">
    <Container>
      <Header />
      <Message>
        <Message.Header>
          <span>Search</span>
        </Message.Header>
        <Message.Body>
          <Field>
            <Label>Location</Label>
            <LocationSelect onChange={onLocationChange} />
          </Field>
          <Field>
            <Label>Date</Label>
            <DateSelect startDate={startDate} endDate={endDate} onChange={onDateChange} isDisabled={filter.locationId === undefined} />
          </Field>

          {filteredSchedules && filteredSchedules.length > 0&&
            <Box>
              <Content>
                {filteredSchedules.map((schedule) => {
                  const action = <Button color="primary" onClick={() => book(schedule.id)}>Book</Button>;
                  return <ScheduleItem schedule={schedule} action={action} />;
                })}
              </Content>
            </Box>
          }
        </Message.Body>
      </Message>

      <Message>
        <Message.Header>
          <span>Bookings (Latest 10 results)</span>
        </Message.Header>
        <Message.Body>
          <HistorialOrders orders={orders} deleteOrderAction={deleteOrderAction} />
        </Message.Body>
      </Message>
    </Container>
  </Hero.Body>;
};