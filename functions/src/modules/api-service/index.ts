import express, {  } from 'express';
import { https } from 'firebase-functions';
import { loginRoute } from './routes/login';
import { expressErrorHandler } from './middlewares/error-handler';
import { expressJwtAuth } from './middlewares/jwt-auth';
import { OrdersRoute } from './routes/orders';

const app = express()



app.use(express.json());
app.use(/^\/(?!login).*/, expressJwtAuth());

app.post('/login', loginRoute.post);

app
  .get('/orders', OrdersRoute.get)
  .post('/orders', OrdersRoute.post)
  .delete('/orders/:id', (req, res) => {
  })

app.use(expressErrorHandler);

export const apiService = https.onRequest(app);