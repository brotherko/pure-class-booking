import React, { useState } from 'react';
import { Form, Container } from 'react-bulma-components';
import Select from 'react-select';
import { LocationSelect } from './LocationSelect';

const { Field, Label } = Form;

export const NewOrder = () => {
  return <Container>
    <form>
      <Field>
        <Label>Location</Label>
        <LocationSelect />
      </Field>
      <Field>
        <Label>Date</Label>
      </Field>

    </form>

  </Container>
}