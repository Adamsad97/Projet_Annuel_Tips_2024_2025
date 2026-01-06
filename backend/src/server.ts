import app from './app';
import { env } from './config/env';

const PORT = env.PORT;
const HOST = env.HOST;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
});
