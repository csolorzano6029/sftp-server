import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SftpModule } from './sftp/sftp.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // hace que esté disponible en todos los módulos
    }),
    SftpModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
