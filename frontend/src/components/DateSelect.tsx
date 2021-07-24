import { DateTime, Interval } from 'luxon';
import React, { forwardRef } from 'react';
import Select from 'react-select';
import { SelectComponentsProps } from 'react-select/src/Select';

function* mapDay(interval) {
  try {
    let cursor = interval.start.startOf("day");
    while (cursor < interval.end) {
      yield cursor;
      cursor = cursor.plus({ days: 1 });
    }
  } catch (e) {
    return [];
  }
}

type Props = SelectComponentsProps & {
  startDate: DateTime;
  endDate: DateTime;
}

export const DateSelect = forwardRef<any, any>(({ startDate, endDate, ...rest }: Props, ref) => {
  const interval = Interval.fromDateTimes(
    startDate,
    endDate.plus({ days: 1 }) // fromDateTime not include end day
  ) 
  const options = Array.from(mapDay(interval)).map((date) => ({
    label: date.toFormat('cccc yyyy-LL-dd'),
    value: date,
  }))

  return (
    <Select ref={ref} options={options} {...rest} />
  )

});