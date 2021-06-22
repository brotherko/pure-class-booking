import jwtDecode from 'jwt-decode';
import _ from 'lodash';
import {
  err, ok, Result, ResultAsync,
} from 'neverthrow';
import { ApiResponse } from '../../types/pure-api-service/api-response';
import { BookingRequestPayload } from '../../types/pure-api-service/booking-request-payload';
import { BookingResponsePayload } from '../../types/pure-api-service/booking-response-payload';
import { LoginRequestPayload } from '../../types/pure-api-service/login-request-payload';
import {
  PureUser,
  LoginResponsePayload,
} from '../../types/pure-api-service/login-response-payload';
import { ViewLocationRequestParams } from '../../types/pure-api-service/view-location-request-param';
import { ViewLocationResponsePayload } from '../../types/pure-api-service/view-location-response-payload';
import { ViewScheduleRequestParams } from '../../types/pure-api-service/view-schedule-request-param';
import { ViewScheduleResponsePayload } from '../../types/pure-api-service/view-schedule-response-payload';
import { PureJwtPayload } from '../../types/pure-jwt-payload';
import { PURE_API_ENDPOINT } from './constants';
import { getInstance } from './helper';

// export const getHome = async () => {
//   const api = await getInstance();
// }

export const postLogin = async (
  payload: Partial<LoginRequestPayload>,
): Promise<
  Result<
    {
      user: PureUser;
      jwtPayload: PureJwtPayload;
    },
    Error
  >
> => {
  const api = await getInstance();

  const defaultPayload: LoginRequestPayload = {
    language_id: 1,
    region_id: 1,
    jwt: true,
    platform: 'Web',
  };

  const getPostLogin = await ResultAsync.fromPromise(
    api.post<ApiResponse<LoginResponsePayload>>(PURE_API_ENDPOINT.LOGIN, {
      ...defaultPayload,
      ...payload,
    }),
    () => Error('postLogin'),
  );

  if (getPostLogin.isErr()) {
    return err(getPostLogin.error);
  }

  const user = _.get(getPostLogin.value, ['data', 'data', 'user']);
  if (!user) {
    return err(Error('Unable to perform login'));
  }

  const { jwt } = user;
  const jwtPayload = jwtDecode<PureJwtPayload>(jwt);
  if (!jwtPayload) {
    return err(Error('Unable to decode jwt'));
  }
  return ok({
    user,
    jwtPayload,
  });
};

export const postBooking = async (payload: BookingRequestPayload, jwt: string) => {
  const api = await getInstance();
  return api.post<ApiResponse<BookingResponsePayload>>(PURE_API_ENDPOINT.BOOKING, payload, {
    headers: {
      'X-JWT-Token': jwt,
    },
  });
};

export const getClassesData = async (params: ViewScheduleRequestParams) => {
  const api = await getInstance();
  return api.get<ApiResponse<ViewScheduleResponsePayload>>(PURE_API_ENDPOINT.VIEW_SCHEDULE, {
    params,
  });
};

export const getLocationRaw = async (params: ViewLocationRequestParams) => {
  const api = await getInstance();
  return ResultAsync.fromPromise(
    api.get<ApiResponse<ViewLocationResponsePayload>>(PURE_API_ENDPOINT.VIEW_LOCATION, {
      params,
    }),
    () => Error('getLocationRaw'),
  );
};
