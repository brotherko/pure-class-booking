import React, { useMemo } from 'react';
import { Button, Heading, Box } from 'react-bulma-components';
import { Order, OrderStatus } from '../types/db/order';
import _ from 'lodash';
import { ScheduleItem } from './ScheduleItem';

export const HistorialOrders = ({ orders }: { orders: Order[] }) => {
  const ordersByDate = useMemo(() => {
    const t = _.groupBy(orders, (order) => order.schedule.start_date);
    return t;
  }, [orders]);

  const Action = ({ order }: { order: Order; }) => {
    switch(order.status) {
      case OrderStatus.PENDING: {
        return <Button disabled>Pending</Button>;
      }
      case OrderStatus.SUCCESS: {
        return <Button disabled color="success">Success</Button>;
      }
      case OrderStatus.FAIL: {
        return <Button disabled color="danger">Failed</Button>;
      }
    }
  };
  return <div>
    {ordersByDate && _.keys(ordersByDate).map((date) => {
      const orders = ordersByDate[date];
      return (
        <div key={`order-${date}`}>
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