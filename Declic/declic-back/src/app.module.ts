import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {MongooseModule} from '@nestjs/mongoose';


@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://RG:declic321@declic-cluster.anhbwfe.mongodb.net/?retryWrites=true&w=majority&appName=Declic-cluster')
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
