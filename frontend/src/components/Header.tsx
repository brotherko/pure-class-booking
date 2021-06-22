import React from 'react';
import { Box, Button, Columns, Container } from 'react-bulma-components';
import { useAuth } from '../hooks/useAuth';
export const Header = () => {
  const { logout } = useAuth();

  return (
    <Container>
      <Columns justifyContent='space-between' mb={2}>
        <Columns.Column size={4}>
        </Columns.Column>
        <Columns.Column size={4} textAlign='right'>
          <Button onClick={logout}>Signout</Button>
        </Columns.Column>
      </Columns>
    </Container>
  )
}