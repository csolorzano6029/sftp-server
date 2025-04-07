import { Module } from '@nestjs/common';
import { SftpService } from './sftp.service';
import { SftpController } from './sftp.controller';

@Module({
  providers: [SftpService],
  controllers: [SftpController],
})
export class SftpCoreModule {}
