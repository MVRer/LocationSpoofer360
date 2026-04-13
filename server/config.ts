import { SERVER_PORT } from "../shared/constants.js";

export const config = {
  serverPort: Number(process.env.PORT ?? SERVER_PORT),
  dataDir: process.env.DATA_DIR ?? `${process.env.HOME}/.LocationSpoofer360`,
};
