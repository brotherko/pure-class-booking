import React, { createContext, useEffect, useState } from 'react';
import { Color } from 'react-bulma-components/src/components';
import { useContextSafe } from './useContextSafe';
export type Message = {
  text: string;
  color?: Color;
};

export type MessageContext = {
  clearMessage: () => void;
  error: (message: string) => void;
  success: (message: string) => void;
  message: Message | null;
}

const MESSAGE_TIMEOUT = 5000;

const messageContext = createContext<MessageContext | null>(null);

export const MessageProvider: React.FC = ({ children }) => {
  const [message, setMessage] = useState<Message|null>(null);

  useEffect(() => {
    if (message !== null) {
      setTimeout(() => {
        setMessage(null);
      }, MESSAGE_TIMEOUT)
    }
  }, [message])
  
  const success = (message) => setMessage({
    color: 'success',
    text: message,
  })
  const error = (message) => setMessage({
    color: 'warning',
    text: message,
  })

  const clearMessage = () => setMessage(null);

  return <messageContext.Provider value={{ message, success, error, clearMessage }}>{children}</messageContext.Provider>
}

export const useMessage = () => useContextSafe(messageContext);