import React, { FormEvent, useEffect, useRef } from 'react';
import { Hero, Container, Content, Form, Heading, Button, Block } from 'react-bulma-components';
import { useHistory } from 'react-router-dom';
import { useGet, useMutate } from 'restful-react';
import { AuthContext, useAuth } from '../hooks/useAuth';
import { useMessage } from '../hooks/useMessage';

const { Input, Label, Field } = Form;

export const Login = () => {
  const { user, login, logout, isLoading } = useAuth();
  const { replace } = useHistory();


  const formRef = useRef<{username: any, password: any}>({
    username: null,
    password: null
  });

  const usernameRef = useRef<any>(null);
  const passwordRef = useRef<any>(null)

  const loginHandler = (e: FormEvent) => {
    e.preventDefault();
    if (usernameRef && usernameRef.current) {
      login(usernameRef.current.value, passwordRef.current.value);
    }
  }

  useEffect(() => {
    if (user) {
      replace('/')
    }
  }, [replace, user])

  return (
    <Container>
      <form onSubmit={loginHandler}>
        <Field>
          <Label>Username</Label>
          <Input domRef={usernameRef} />
        </Field>
        <Field>
          <Label>Password</Label>
          <Input domRef={passwordRef} type="password" />
        </Field>
        <Button color="primary" fullwidth loading={isLoading} onClick={loginHandler} submit>Sign In</Button>
      </form>
    </Container>
  );
};