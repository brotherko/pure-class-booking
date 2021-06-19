import React from 'react';
import { Block, Button, Container } from 'react-bulma-components';
import { useAuth } from '../hooks/useAuth';
export const Header = () => {
  const { logout } = useAuth();

  return (
    <Container p={1}>
      <Button.Group align="right">
        <Button size="small" onClick={logout}>Signout</Button>
      </Button.Group>
    </Container>
  )
}