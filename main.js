import initBrowser from "./src/CreateBrowser.js";
import puppeteer, { TimeoutError } from "puppeteer-core";
import { PageError } from "./src/errors/PageErrors.js";
import { appendFileSync } from "fs";
import { join } from "path";

export async function main({ config, clientes }) {
  let browser, page;
  let index;
  try {
    ({ browser, page } = await initBrowser(puppeteer, config, false));
    await page.goto("https://cav.receita.fazenda.gov.br/ecac/", {
      waitUntil: "networkidle2",
    });
    let certf = await page
      .click("#login-dados-certificado > p:nth-child(2) > input[type=image]", {
        clickCount: 2,
      })
      .catch((e) => "certificado salvo");
    if (certf !== "certificado salvo") {
      await page.waitForNetworkIdle();
      await page.waitForSelector("#cert-digital > a");
      await page.click("#cert-digital > a");
    }
    await page.waitForNetworkIdle();
    await page.click("#btn214 > a");
    await page.waitForNetworkIdle();
    await page.click(
      "#containerServicos214 > div:nth-child(9) > ul > li:nth-child(1) > a"
    );
    for (index = 0; index < clientes.length; index++) {
      console.log(clientes[index].RAZAO);
      await page.waitForSelector("#btnPerfil");
      await page.click("#btnPerfil");
      await page
        .click("#formTitular > input.submit")
        .catch((e) => console.log("sem botao titular"));
      await page.waitForTimeout(2500);
      await page.click("#btnPerfil").catch((e) => "ja esta aberto");
      await page.type("#txtNIPapel2", clientes[index].CNPJ);
      await page.click("#formPJ > input.submit");
      await page.waitForTimeout(5000);
      await page.waitForNetworkIdle();
      const dialog = await page
        .$eval(
          "body > div.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.no-close.ui-resizable",
          (element) => element.style.display?.trim()
        )
        .catch((e) => "sem dialog");
      if (dialog === "block") {
        console.log("dialog aberto");
        await page.evaluate((item) => {
          document.querySelector(
            "body > div.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.no-close.ui-resizable"
          ).style.display = "none";
          document.querySelector("body > div.ui-widget-overlay").style.display =
            "none";
        });
      }
      let error1 = await page
        .$eval("#perfilAcesso > div.erro > p", (item) =>
          item.textContent.trim()
        )
        .catch((e) => "ATENÇÃO:");
      if (error1 != "ATENÇÃO:") {
        throw new PageError(error1);
      }
      await page.waitForNetworkIdle();
      await page.waitForTimeout(5000);
      appendFileSync(
        join(config.pathDownload, "relatorio.csv"),
        `${clientes[index].RAZAO};${clientes[index].CNPJ};OK`
      );
    }
    await browser.close();
    return {
      status: true,
    };
  } catch (error) {
    console.log(error);
    await browser.close();

    if (error instanceof TimeoutError) {
      return {
        status: false,
        repeat: true,
        indice: index,
      };
    }

    if (error instanceof PageError) {
      return {
        status: false,
        repeat: false,
        error: error.message,
        indice: index,
      };
    }

    return {
      status: false,
      repeat: true,
      indice: index,
    };
  }
}
