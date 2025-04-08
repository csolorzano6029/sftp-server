/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Query,
  Res,
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

  @Get('/download')
  async download(@Query('remotePath') remotePath: string, @Res() res: any) {
    const buffer = await this.sftpService.download(remotePath);

    if (Buffer.isBuffer(buffer)) {
      const filename = remotePath.split('/').pop() || 'file.txt';

      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      });

      return res.send(buffer);
    }
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

    return await this.sftpService.upload(file, remotePath);
  }
}
