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

type Props = SelectComponentsProps & {
  startDate: DateTime;
  endDate: DateTime;
}

export const DateSelect = ({ startDate, endDate, ...rest }: Props) => {
  const interval = Interval.fromDateTimes(
    startDate,
    endDate.plus({ days: 1 }) // fromDateTime not include end day
  ) 
  const options = Array.from(mapDay(interval)).map((date) => ({
    label: date.toFormat('cccc yyyy-LL-dd'),
    value: date,
  }))

  return (
    <Select options={options} {...rest} />
  )

}