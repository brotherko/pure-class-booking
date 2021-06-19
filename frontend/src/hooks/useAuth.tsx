import React, { useState, useEffect, useContext, createContext, PropsWithChildren } from "react";
import { useCookies } from 'react-cookie';
import { useMutate } from 'restful-react';
import { User } from '../../../functions/src/types/user';
import { ApiResponse } from '../../../functions/src/modules/api-service/types/api-response';
import { useContextSafe } from './useContextSafe';
import { useMessage } from './useMessage';

export type AuthContext = {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const authContext = createContext<AuthContext | null>(null);

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User|null>(null);
  const [cookies, setCookie] = useCookies(['user']);
  const { success } = useMessage();

  const { mutate: postLogin, loading } = useMutate<ApiResponse<User>>({
    verb: "POST",
    path: "login",
  })

  const login = async (username: string, password: string) => {
    try{
      const { data, message } = await postLogin({ username, password });
      setCookie('user', data);
      setUser(data);
      success(message);
    } catch(e) {
    }
  }

  const loginFromCookie = async () => {
    const { user } = cookies;
    if (user) {
      setUser(user);
    }
  }

  useEffect(() => {
    loginFromCookie()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const logout = () => setUser(null);

  return (
    <authContext.Provider value={{ user, login, logout, isLoading: loading } as AuthContext}>{children}</authContext.Provider>
  )
}

export const useAuth = () => useContextSafe(authContext);