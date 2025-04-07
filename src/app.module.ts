import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SftpCoreModule } from './sftp/sftp.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SftpModule } from 'nest-sftp';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // hace que esté disponible en todos los módulos
    }),
    SftpModule.forRootAsync(
      {
        useFactory: (configService: ConfigService) => ({
          host: configService.get<string>('SFTP_HOST'),
          port: configService.get<number>('SFTP_PORT'),
          username: configService.get<string>('SFTP_USER'),
          password: configService.get<string>('SFTP_PASSWORD'),
        }),
        inject: [ConfigService],
      },
      false,
    ),
    SftpCoreModule,
  ],
  controllers: [AppController],
  providers: [AppService, ConfigService],
})
export class AppModule {}
