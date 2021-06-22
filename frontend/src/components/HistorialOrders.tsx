import React, { useMemo } from 'react';
import { Button, Heading, Box } from 'react-bulma-components';
import { Order, OrderStatus } from '../types/db/order';
import _ from 'lodash';
import { ScheduleItem } from './ScheduleItem';
import { ActionButton } from './ActionButton';
import { useMutate } from 'restful-react';
import { ApiResponse } from '../types/api-response';
import { useMessage } from '../hooks/useMessage';

export const HistorialOrders = ({ orders, deleteOrderAction }: { orders: Order[], deleteOrderAction: (id: string) => void }) => {

  const ordersByDate = useMemo(() => {
    const t = _.groupBy(orders, (order) => order.schedule.start_date);
    return t;
  }, [orders]);

  const Action = ({ order }: { order: Order; }) => {
    switch(order.status) {
      case OrderStatus.PENDING: {
        return <ActionButton onClick={() => deleteOrderAction(order.id)}>DELETE</ActionButton>;
      }
      case OrderStatus.SUCCESS: {
        return <ActionButton disabled color="success">Success</ActionButton>;
      }
      case OrderStatus.FAIL: {
        return <ActionButton disabled color="danger">Failed</ActionButton>;
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