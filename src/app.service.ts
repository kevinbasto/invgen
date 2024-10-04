import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as os from "os";
import * as QrCode from 'qrcode';
import { data } from './interfaces/factura';
import { Readable } from 'stream';

const sat = `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx`
@Injectable()
export class AppService {

  browser: puppeteer.Browser;

  constructor() {
    let linuxRegex = /linux/i
    if (!linuxRegex.test(os.type()))
      puppeteer.launch({ headless: true })
        .then((browser) => {
          this.browser = browser
        }).catch((err) => {
          console.log(err);
          throw new InternalServerErrorException("WINDOWS: there was an error launching the puppeteer browser");
        });
    else
      puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
        .then((browser) => {
          this.browser = browser
        }).catch((err) => {
          throw new InternalServerErrorException("LINUX: there was an error launching the puppeteer browser");
        });
  }

  async generateInvoice(data: data): Promise<Readable> {
    data.total = data.total.toFixed(2) as any;

    // Define assets directory
    const assetsDir = path.join(__dirname, '../assets');
    
    // Load image and encode to base64
    const imagePath = `${assetsDir}/mdslogo.png`;
    const imageBuffer = await fs.promises.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Create a data URL with base64 encoding
    const mimeType = 'image/png'; // Update this if using a different image type
    const dataUrl = `data:${mimeType};base64,${base64Image}`;
    
    let letras = this.numeroALetras(Math.floor(data.total));
    if ((data.total - Math.floor(data.total)) != 0) {
        letras = `${letras} ${((data.total - Math.floor(data.total)) * 100).toFixed(0)}/100`;
    }
    letras = letras.toUpperCase();

    const qrcodecontent = `${sat}?id=${data.complemento.uuid}&re=${data.emisor.rfc}&rr=${data.receptor.rfc}`;
    let qrcontent = await QrCode.toDataURL(qrcodecontent);
    
    // Load and compile Handlebars template
    const templateContent = await fs.promises.readFile(`${assetsDir}/factura.hbs`, 'utf8');
    const template = Handlebars.compile(templateContent);
    
    // Generate HTML content with the template
    const htmlContent = template({ ...data, logo: dataUrl, qrcontent, letras });
    
    // Open a new page and set content
    const page = await this.browser.newPage();
    await page.setContent(htmlContent);
    
    // Create the 'invoices' directory if it doesn't exist
    const invoicesDir = path.join(__dirname, '../invoices');
    if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir);
    }
    
    // Generate PDF and store it in the 'invoices' directory
    const pdfPath = path.join(invoicesDir, `invoice_${data.complemento.uuid}.pdf`);
    let pdfBuffer = await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
            top: 30,
            bottom: 10,
            left: 15,
            right: 15
        }
    });

    // Close the page after generating the PDF
    await page.close();
    
    const stream = new Readable(); 
    stream.push(pdfBuffer);
    stream.push(null);

    return stream;
}



  numeroALetras(num: number): string {
    const unidades = [
        '', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 
        'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'
    ];
    
    const decenas = [
        '', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'
    ];
    
    const centenas = [
        '', 'cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 
        'ochocientos', 'novecientos'
    ];

    if (num === 0) return 'cero';
    if (num < 0) return `menos ${this.numeroALetras(Math.abs(num))}`;

    let letras = '';

    // Miles
    if (Math.floor(num / 1000) > 0) {
        if (Math.floor(num / 1000) === 1) {
            letras += 'mil ';
            if(num == 1000){
              letras = `un ${letras}`
            }
        } else {
            letras += `${this.numeroALetras(Math.floor(num / 1000))} mil `;
        }
        num %= 1000;
    }

    // Centenas
    if (Math.floor(num / 100) > 0) {
        if (num === 100) {
            letras += 'cien ';
        } else {
            letras += `${centenas[Math.floor(num / 100)]} `;
        }
        num %= 100;
    }

    // Decenas y unidades
    if (num > 0) {
        if (num < 20) {
            letras += unidades[num];
        } else {
            letras += decenas[Math.floor(num / 10)];
            if (num % 10 > 0) {
                letras += ` y ${unidades[num % 10]}`;
            }
        }
    }

    return letras.trim();
}
}
