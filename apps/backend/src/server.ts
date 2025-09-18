import { app } from "./app";
import { env } from "./config/env";

const port = env.PORT;
console.log("Loaded CORS origins:", env.CORS_ORIGIN);

app.listen(port, () => {
  console.log(`?? API ready on http://localhost:${port}`);
});