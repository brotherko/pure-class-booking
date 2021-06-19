import React, { useEffect, useMemo, useState } from 'react';
import { Form, Container, Media, Content, Box, Hero, Button, Message } from 'react-bulma-components';
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

const { Field, Label } = Form;

const parseDate = (date: string) => {
  return DateTime.fromFormat(date, "yyyy-LL-dd");
};
export const NewOrder = () => {
  const [filter, setFilter] = useState<ScheduleFilter>({});
  const { message, success } = useMessage();

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
    const { data, message } = await postBook({
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

  const startDate = DateTime.now().plus(Duration.fromObject({ days: 0 }));
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
          <span>Bookings</span>
        </Message.Header>
        <Message.Body>
          <HistorialOrders orders={orders} />
        </Message.Body>
      </Message>
    </Container>
  </Hero.Body>;
};