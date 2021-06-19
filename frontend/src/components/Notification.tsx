import React, { useEffect } from 'react';
import { Message, Button } from 'react-bulma-components';
import { useMessage } from '../hooks/useMessage';
export const Notification = () => {
  const { message, clearMessage } = useMessage();

  return message && <Message m={10} color={message.color}>
    <Message.Header style={{ position: 'fixed', zIndex: 999, width: '100%' }}>
      {message.text}<Button remove onClick={() => clearMessage()} />
    </Message.Header>
  </Message>;
};