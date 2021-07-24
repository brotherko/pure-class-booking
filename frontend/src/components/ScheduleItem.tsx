import React from "react";
import { DateTime } from "luxon";
import { Media, Content, Tag } from "react-bulma-components";
import { Schedule } from "../types/db/schedule";
import { Second } from "../types/firestore-second";
import { OrderStatus } from "../types/db/order";

export type ScheduleFilter = {
  locationId?: string;
  class?: "Y" | "F";
  date?: DateTime;
  isVaccinated: boolean;
};

const formatTime = (date: Second) => {
  return DateTime.fromSeconds(date._seconds).toFormat("HH:mm");
};
export const ScheduleItem = ({
  status,
  schedule,
  action,
}: {
  status?: OrderStatus;
  schedule: Schedule;
  action: JSX.Element;
}) => {
  return (
    <Media>
      <Media.Item>
        <Content>
          <p>
            {status && (
              <Tag
                mr={3}
                style={{ minWidth: 70 }}
                color={
                  status === OrderStatus.PENDING
                    ? "dark"
                    : status === OrderStatus.SUCCESS
                    ? "success"
                    : "warning"
                }
              >
                {status}
              </Tag>
            )}
            <strong>{schedule.name}</strong>
            <br />
            <small>
              {formatTime(schedule.startDatetime)} -{" "}
              {formatTime(schedule.endDatetime)} ({schedule.duration}m)
            </small>
            <br />
            <small>{schedule.location.shortName}</small>
          </p>
        </Content>
      </Media.Item>
      <Media.Item align="right" style={{ alignSelf: "center" }}>
        {action}
      </Media.Item>
    </Media>
  );
};
