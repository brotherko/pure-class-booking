import { DateTime, Interval } from 'luxon';
import React, {  } from 'react';
import Select from 'react-select';
import { SelectComponentsProps } from 'react-select/src/Select';

function* mapDay(interval) {
  let cursor = interval.start.startOf("day");
  while (cursor < interval.end) {
    yield cursor;
    cursor = cursor.plus({ days: 1 });
  }
}

export const DateSelect = ({ startDate, endDate, ...rest }: SelectComponentsProps & { startDate: DateTime, endDate: DateTime }) => {
  const interval = Interval.fromDateTimes(startDate, endDate)
  const options = Array.from(mapDay(interval)).map((date) => ({
    label: date.toFormat('yyyy-LL-dd cccc'),
    value: date,
  }))

  return (
    <Select options={options} {...rest} />
  )

}