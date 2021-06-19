import { DateTime } from 'luxon';
import React, { useEffect, useMemo } from 'react';
import { Media, Content, Button } from 'react-bulma-components';
import { useGet } from 'restful-react';
import { Schedule } from '../../../functions/src/services/db/types/schedule';

export type ScheduleFilter = {
  locationId?: number,
  sector?: "Y" | "F",
  date?: DateTime,
};

export const ScheduleList = ({ schedules, action }:
  { schedules: Schedule[], action: (schedule: Schedule) => JSX.Element }) => {

  return (
    <div>
    {schedules && schedules.map((schedule) => (
      <Media key={schedule.id}>
        <Media.Item>
          <Content>
            <p>
              <strong>{schedule.class_type.name}</strong><br />
              <small>{schedule.start_time} - {schedule.end_time} ({schedule.duration_min}m)</small>
            </p>
          </Content>
        </Media.Item>
          <Media.Item align="right">
            {action(schedule)}
          </Media.Item>
      </Media>
    ))}
  </div>
  )

}