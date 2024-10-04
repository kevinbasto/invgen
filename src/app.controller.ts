import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  async getHello(@Body() data, @Res() res: Response){
    let invoice = await this.appService.generateInvoice(data);
    res.setHeader("content-type", "application/pdf");
    res.setHeader("content-disposition", "attachment; filename=invoice.pdf")
    invoice.pipe(res);
  }
}
