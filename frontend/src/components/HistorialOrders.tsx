import React, { useEffect, useMemo } from 'react';
import { Media, Content, Button, Heading, Container, Box } from 'react-bulma-components';
import { useGet } from 'restful-react';
import { Order, OrderStatus } from '../types/db/order';
import _ from 'lodash';
import { ScheduleItem } from './ScheduleItem';

export const HistorialOrders = () => {
  const { data: orders } = useGet<Order[]>({
    path: 'orders',
    resolve: data => data.data
  });

  const ordersByDate = useMemo(() => {
    const t = _.groupBy(orders, (order) => order.schedule.start_date);
    console.log(t);
    return t;
  }, [orders]);

  const Action = ({ order }: { order: Order; }) => {
    if (order.status === OrderStatus.PENDING) {
      return <Button disabled>Pending</Button>;
    }
  };
  return <div>
    {ordersByDate && _.keys(ordersByDate).map((date) => {
      const orders = ordersByDate[date];
      return (
        <div>
          <Heading size={6} mb={3} ml={2}>{date}</Heading>
          <Box mb={4}>
            {orders && orders.map((order) => {
              const action = <Action order={order} />;
              const schedule = order.schedule;
              return <ScheduleItem schedule={schedule} action={action} />;
            })}
          </Box>
        </div>
      );
    })}
  </div>;
};