import express from 'express';
import { https } from 'firebase-functions';
import cors from 'cors';
import { expressErrorHandler } from './middlewares/error-handler';
import route from './routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', route);
app.use(expressErrorHandler);

export const apiService = https.onRequest(app);
