import React from 'react';
import { Box, Container, Heading, Media, Section, Image, Content } from 'react-bulma-components';
import { useGet } from 'restful-react';

export const Order = () => {
  const { data: orders, loading } = useGet({
    path: 'orders'
  })
  return <Container>
    <Section>
      <Heading>
        Upcoming
      </Heading>
    </Section>
    <Section>
      <Box>
        <Media>
          <Media.Item align="left">
            <Image src="https://via.placeholder.com/150" size={64} />
          </Media.Item>
          <Media.Item align="center">
            <Content>
              <strong>test</strong>
              <small>hi</small>
            </Content>
          </Media.Item>
        </Media>
      </Box>
    </Section>

  </Container>
}