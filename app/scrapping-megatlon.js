
const puppeteer = require('puppeteer');

require('dotenv').config()

//function select first available 
async function firstOptAvailable(page, id) {
  const select = await page.$(`#${id}`);
  await page.evaluate(select => {
    for (let option of select.options) {
      if (!option.disabled) {
        option.selected = true;
      }
    }
  }, select);
  const value = await page.evaluate(select => select.value, select);
  console.log(value);
}

//funcion selecciona combo con xpaths 
async function fillSelectWithXPathDia(page, xpathcombo, xpathvalue) {
  var combo = await page.waitForXPath(xpathcombo, { timeout: 120000 })
  var id_combo = await combo.getProperty("id")
  var id = id_combo._remoteObject.value
  var value = combo ? await page.waitForXPath(xpathvalue, { timeout: 120000 }) : "no data"
  var disabled = await value.getProperty('disabled')


  if (disabled._remoteObject.value === true) {
    var value = await page.waitForXPath('//*[@id="horarios"]/option[12]')
    const disabled = await value.getProperty('disabled')
  }
  if (value !== "no data") {
    var valueCombo = await value.getProperty("value")
    await page.select(`select#${id_combo._remoteObject.value}`, valueCombo._remoteObject.value)
  }
  return disabled._remoteObject.value
}

async function fillSelectWithXPathSucursal(page, xpathcombo, xpathvalue) {

  var combo = await page.waitForXPath(xpathcombo, { timeout: 120000 })
  var id_combo = await combo.getProperty("id")
  var id = id_combo._remoteObject.value
  var value = combo ? await page.waitForXPath(xpathvalue, { timeout: 120000 }) : "no data"
  var disabled = await value.getProperty('disabled')
  if (value !== "no data") {
    var valueCombo = await value.getProperty("value")
    await page.click(`select#${id_combo._remoteObject.value}`, 'Megatlon Belgrano')
    await page.type(`select#${id_combo._remoteObject.value}`, 'Megatlon Belgrano')
  }
  console.log(id_combo._remoteObject.value, valueCombo._remoteObject.value)
  return disabled._remoteObject.value //sirve para mostrar si la opcion no esta disponible, esto es porque quiero una opcion especifica

}

//scrapping 
const scrapping = async function scrappingMegatlon() {
  await puppeteer.launch({
    ignoreDefaultArgs: ['--disable-extensions'],
    headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox',
      '--window-size=1920,1080',
      '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"']
  })
    .then(async browser => {
      
      const page = await browser.newPage();
      const args = "https://megatlon.com/clases-online";
      console.log("corriendo en" + args)
      const datos = {
        dni: process.env.DNI,
        name: process.env.NAME,
        tel: process.env.TEL,
        email: process.env.EMAIL
      }

      const datosReserva = {
        dia: '//*[@id="dia"]/option[2]',
        horario: '//*[@id="horarios"]/option[12]',
        sucursal: '//*[@id="sucursal"]/option[9]',
        profe: "Norman"
      }
      // pagina 1
      await page.goto(args);
      await page.type('input#identityNumber', datos.dni)
      await page.keyboard.press('Enter');
      await page.waitForNavigation();

      // pagina 2
      await page.type('input#nombreApellido', datos.name)
      await page.type('input#telefono', datos.tel)
      await page.type('input#email', datos.email)
      await page.keyboard.press('Enter');
      await page.waitForNavigation();

      // pagina 3
      await page.type('input#profe_sugerido', datosReserva.profe)
      await page.waitForFunction(() => document.querySelector("#dia").length > 0);
      await fillSelectWithXPathDia(page, '//*[@id="dia"]', datosReserva.dia)
      await page.waitForFunction(() => document.querySelector("#sucursal").length > 0);
      const disabledSucursal = await fillSelectWithXPathSucursal(page, '//*[@id="sucursal"]', datosReserva.sucursal)

      await page.waitForFunction(() => document.querySelector("#horarios").length > 0);
      const disabledHs = await fillSelectWithXPathDia(page, '//*[@id="horarios"]', datosReserva.horario)
      if (disabledSucursal || disabledHs) {
        console.log("algo fallo no hay horarios o sucursal disponible", "sucursal:", disabledSucursal, "horario:", disabledHs)
        browser.close()
      } else {
        await page.evaluate(() => {
          document.querySelector('button[type="submit"]').click();
        });
        browser.close()
        console.log("funciono todo salio ok")
      }


    }).catch(function (error) {
      console.error(error);
    });

}




module.exports = { scrapping }