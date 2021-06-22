import { Router } from 'express';
import { expressJwtAuth } from '../middlewares/jwt-auth';
import { LocationsRoute } from './locationsRoute';
import { loginRoute } from './loginRoute';
import { OrdersRoute } from './ordersRoute';
import { ScheduleRoute } from './schedulesRoute';

const route = Router();

route.post('/login', loginRoute.post);

route.use(/^\/(?!login).*/, expressJwtAuth);

route
  .get('/orders', OrdersRoute.get)
  .post('/orders', OrdersRoute.post)
  .delete('/orders/:id', OrdersRoute.delete);

route.get('/schedules/location/:locationId', ScheduleRoute.getByLocation);

route.get('/locations', LocationsRoute.get);

export default route;
