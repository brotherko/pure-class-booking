import * as functions from 'firebase-functions';

export const taskHttpResponse = (task: () => void) => async (
  req: functions.https.Request, //
  res: functions.Response<any>,
) => {
  try {
    await task();
    res.send('OK!');
  } catch (e) {
    res.send(e.message);
  }
};
