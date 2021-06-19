import React, { FormEvent, useEffect, useRef } from 'react';
import { Hero, Container, Form, Button } from 'react-bulma-components';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const { Input, Label, Field } = Form;

export const Login = () => {
  const { user, login, isLoading } = useAuth();
  const { replace } = useHistory();

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
    <Hero.Body alignItems="center">
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
    </Hero.Body>
  );
};