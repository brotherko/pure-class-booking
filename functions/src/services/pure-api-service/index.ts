import jwtDecode from 'jwt-decode';
import _ from 'lodash';
import { err, ok, Result } from 'neverthrow';
import { JwtPayload } from '../../types/pure-jwt-payload';
import { PureUserCredential } from '../../types/pure-user-credential';
import logger from '../../utils/logger';
import { PURE_API_ENDPOINT } from './constants';
import { getInstance } from './helper';
import { ApiResponse } from './interfaces/api-response';
import { BookingRequestPayload } from './interfaces/booking-request-payload';
import { BookingResponsePayload } from './interfaces/booking-response-payload';
import { LoginRequestPayload } from './interfaces/login-request-payload';
import { LoginResponsePayload } from './interfaces/login-response-payload';
import { ViewScheduleRequestParams } from './interfaces/view-schedule-request-param';
import { ViewScheduleResponsePayload } from './interfaces/view-schedule-response-payload';

// export const getHome = async () => {
//   const api = await getInstance();
// }

const postLogin = async (payload: LoginRequestPayload) => {
  const api = await getInstance();
  return api.post<ApiResponse<LoginResponsePayload>>(
    PURE_API_ENDPOINT.LOGIN,
    payload,
  );
}

export const postBooking = async (payload: BookingRequestPayload, jwt: string) => {
  const api = await getInstance();
  return api.post<ApiResponse<BookingResponsePayload>>(
    PURE_API_ENDPOINT.BOOKING,
    payload,
    {
      headers: {
        'X-JWT-Token': jwt
      }
    }
  )
}

export const getClassesData = async (params: ViewScheduleRequestParams) => {
  const api = await getInstance();
  return api.get<ApiResponse<ViewScheduleResponsePayload>>(
    PURE_API_ENDPOINT.VIEW_SCHEDULE, { 
      params,
    },
  )
}

export const getPureJwt = async ({ username, password }: PureUserCredential): Promise<Result<[string, JwtPayload], Error>> => {
  const reqPayload: LoginRequestPayload = {
    language_id: 1,
    region_id: 1,
    jwt: true,
    platform: 'Web',
    username,
    password,
  };

  const data = await postLogin(reqPayload);
  const jwt = _.get(data, ['data', 'data', 'user', 'jwt']);

  if (!jwt) {
    return err(Error('JWT not found in the response'));
  }

  const jwtPayload = jwtDecode<JwtPayload>(jwt);
  if (!jwtPayload) {
    return err(Error('Unable to decode jwt'));
  }

  logger.debug(`retrieve JWT: ${jwt}`);

  return ok([jwt, jwtPayload]);
};
