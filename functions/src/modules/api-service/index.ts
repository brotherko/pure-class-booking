import express, {  } from 'express';
import { https } from 'firebase-functions';
import { loginRoute } from './routes/loginRoute';
import { expressErrorHandler } from './middlewares/error-handler';
import { expressJwtAuth } from './middlewares/jwt-auth';
import { OrdersRoute } from './routes/ordersRoute';
import { ScheduleRoute } from './routes/schedulesRoute';
import { LocationsRoute } from './routes/locationsRoute';
import cors from 'cors';

const app = express()

app.use(cors())
app.use(express.json());
app.use(/^\/(?!login).*/, expressJwtAuth());

app.post('/login', loginRoute.post);

app
  .get('/orders', OrdersRoute.get)
  .post('/orders', OrdersRoute.post)
  .delete('/orders/:id', OrdersRoute.delete)

app
  .get('/schedules/location/:locationId', ScheduleRoute.getByLocation)

app
  .get('/locations', LocationsRoute.get)

app.use(expressErrorHandler);

export const apiService = https.onRequest(app);