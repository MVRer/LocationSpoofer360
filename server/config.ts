import { SERVER_PORT, CLIENT_PORT } from "../shared/constants.js";

export const config = {
  serverPort: Number(process.env.PORT ?? SERVER_PORT),
  clientPort: CLIENT_PORT,
  clientOrigin: `http://localhost:${CLIENT_PORT}`,
  dataDir:
    process.env.DATA_DIR ??
    `${process.env.HOME}/.LocationSpoofer360`,
};
