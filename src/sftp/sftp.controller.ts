import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SftpService } from './sftp.service';

@Controller('/sftp')
export class SftpController {
  constructor(private readonly sftpService: SftpService) {}

  @Get('/list')
  async list(@Query('path') path: string) {
    return await this.sftpService.list(path);
  }

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file')) // Interceptor para manejar la carga de archivos
  async upload(
    @Query('remotePath') remotePath: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error(
        'No file path found. Please ensure the file is uploaded correctly.',
      );
    }
    const result = await this.sftpService.upload(file, remotePath);
    return { message: `File uploaded to ${remotePath}`, result };
  }

  @Post('/path')
  async createDir(@Body('path') path: string) {
    if (!path) {
      return { error: 'Missing path in body' };
    }

    return this.sftpService.createDirectory(path);
  }
}
