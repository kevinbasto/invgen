import { Body, Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@Body() data){
    console.log(data)
    return this.appService.generateInvoice(data);
  }
}
