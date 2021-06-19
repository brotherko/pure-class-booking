import { DateTime } from 'luxon';
import React, { useEffect, useMemo } from 'react';
import { Media, Content, Button } from 'react-bulma-components';
import { Schedule } from '../types/db/schedule';

export type ScheduleFilter = {
  locationId?: number,
  sector?: "Y" | "F",
  date?: DateTime,
};

export const ScheduleItem = ({ schedule, action }:
  { schedule: Schedule, action: JSX.Element }) => {

  return (
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
            {action}
          </Media.Item>
      </Media>
  )

}