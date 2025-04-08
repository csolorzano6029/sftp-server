import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SftpClientService } from 'nest-sftp';
import { ConnectConfig } from 'ssh2';
import { FileInfo } from 'ssh2-sftp-client';
import { Upload } from './interfaces';

@Injectable()
export class SftpService {
  private readonly logger = new Logger(SftpService.name);
  constructor(
    private readonly sftpClient: SftpClientService,
    private readonly configService: ConfigService,
  ) {}

  private getConnection(): ConnectConfig {
    return {
      host: this.configService.get<string>('SFTP_HOST'),
      port: this.configService.get<number>('SFTP_PORT'),
      username: this.configService.get<string>('SFTP_USER'),
      password: this.configService.get<string>('SFTP_PASSWORD'),
    };
  }

  async list(path: string): Promise<FileInfo[]> {
    //await this.sftpClient.resetConnection(this.getConnection());
    return await this.sftpClient.list(path);
  }

  async download(
    remotePath: string,
  ): Promise<string | NodeJS.WritableStream | Buffer<ArrayBufferLike>> {
    try {
      //await this.sftpClient.resetConnection(this.getConnection());
      return await this.sftpClient.download(remotePath);
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async upload(file: Express.Multer.File, remotePath: string): Promise<Upload> {
    try {
      //await this.sftpClient.resetConnection(this.getConnection());
      const dirPath = remotePath.endsWith('/') ? remotePath : remotePath + '/';
      const fileName = file.originalname;
      const fullPath = dirPath + fileName;

      // Crear un buffer desde el archivo
      const fileBuffer = file.buffer;

      await this.sftpClient.upload(fileBuffer, fullPath);

      return {
        success: true,
        path: fullPath,
        size: file.size,
        filename: fileName,
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async delete(remotePath: string): Promise<void> {
    try {
      //await this.sftpClient.resetConnection(this.getConnection());
      return await this.sftpClient.delete(remotePath);
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
