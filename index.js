import { join, resolve } from "path";
import * as fs from "fs";
import { main } from "./main.js";
import { parseXLSXToJson } from "./parseXLSXToJson.js";
const __dirname = resolve();
const config = JSON.parse(
  fs.readFileSync(join(__dirname, "config.json"), { encoding: "utf-8" })
);
config.pathDownload = join(__dirname, "download");
config.pathTitle = join(__dirname, "titulos.txt");
config.pathEntrada = join(__dirname, "entrada");

(async () => {
  let clientes = parseXLSXToJson(config.pathEntrada);

  global.tentativas = 0;
  let indice = 0;
  while (true) {
    const execution = await main({
      clientes,
      config,
    });
    if (!execution.status) {
      if (execution.repeat) {
        if (global.tentativas > 3) {
          clientes = clientes.filter((item, index) => index > execution.indice);
          global.tentativas = 0;
          continue;
        }
        clientes = clientes.filter((item, index) => index >= execution.indice);
        global.tentativas++;
        continue;
      }
      fs.appendFileSync(
        "./erros.csv",
        `
        ${clientes[execution.indice].RAZAO};
        ${clientes[execution.indice].CNPJ};
        ${execution.error}\n
        `
      );
      clientes = clientes.filter((item, index) => index > execution.indice);
      global.tentativas = 0;
      continue;
    }
    break;
  }
})();
