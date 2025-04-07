/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import * as SftpClient from 'ssh2-sftp-client';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { SftpClientService } from 'nest-sftp';

@Injectable()
export class SftpService {
  /* private readonly sftp: SftpClient; */
  private readonly logger = new Logger(SftpService.name);
  constructor(
    private readonly sftpClient: SftpClientService,
    private readonly configService: ConfigService,
  ) {
    /* this.sftp = new SftpClient(); */
  }

  private getSftpConfig() {
    return {
      host: this.configService.get<string>('SFTP_HOST', 'localhost'),
      port: this.configService.get<number>('SFTP_PORT', 22),
      username: this.configService.get<string>('SFTP_USER'),
      password: this.configService.get<string>('SFTP_PASS'),
      readyTimeout: 300000, // Añadir timeout más largo
      retries: 3, // Intentar reconexión
    };
  }

  /*   private async connect(): Promise<void> {
    const config = this.getSftpConfig();
    this.logger.log(config);
    await this.sftp.connect(config);
  } */

  private async getConnection(): Promise<SftpClient> {
    const sftp = new SftpClient();
    const config = this.getSftpConfig();
    this.logger.log(
      `Connecting to SFTP server at ${config.host}:${config.port}`,
    );
    try {
      await sftp.connect(config);
      return sftp;
    } catch (error) {
      this.logger.error(`Failed to connect to SFTP: ${error}`);
      throw error;
    }
  }

  private async safeDisconnect(sftp: SftpClient): Promise<void> {
    if (sftp) {
      try {
        await sftp.end();
        this.logger.log('SFTP connection closed successfully');
      } catch (error) {
        // Solo lo registramos, no lanzamos el error
        this.logger.error(`Error closing SFTP connection: ${error}`);
      }
    }
  }

  async upload(file: Express.Multer.File, remotePath: string) {
    const sftp = await this.getConnection();
    try {
      // Verificar si el directorio existe, si no, crearlo
      const dirPath = remotePath.endsWith('/') ? remotePath : remotePath + '/';
      const fileName = file.originalname;
      const fullPath = dirPath + fileName;

      // Crear un buffer desde el archivo
      const fileBuffer = file.buffer;

      // Crear un stream desde el buffer
      const stream = Readable.from(fileBuffer);

      // Subir usando streams en lugar de buffer directo
      await sftp.put(stream, fullPath);
      this.logger.log(`File uploaded successfully to ${fullPath}`);
      return {
        success: true,
        path: fullPath,
        size: file.size,
        filename: fileName,
      };
    } catch (error) {
      this.logger.error(`Error uploading file: ${error}`);
      throw new Error(`Failed to upload file to ${remotePath}: ${error}`);
    } finally {
      await this.safeDisconnect(sftp);
    }
  }

  async list(remotePath: string) {
    //let sftp: SftpClient;
    const sftp = await this.getConnection();
    try {
      return await sftp.list(remotePath);
    } catch (error) {
      this.logger.error(`Error listing directory: ${error}`);
      throw new Error(`Failed to list directory ${remotePath}: ${error}`);
    } finally {
      await this.safeDisconnect(sftp);
    }
  }

  async download(remotePath: string, localPath: string) {
    const sftp = await this.getConnection();
    try {
      return await sftp.get(remotePath, localPath);
    } catch (error) {
      this.logger.error(`Error downloading file: ${error}`);
      throw new Error(`Failed to download file ${remotePath}: ${error}`);
    } finally {
      await this.safeDisconnect(sftp);
    }
  }

  async createDirectory(remotePath: string) {
    const sftp = await this.getConnection();
    try {
      // Crear el directorio
      await sftp.mkdir(remotePath, true);

      // Establecer permisos (0755 = usuario puede leer/escribir/ejecutar, otros pueden leer/ejecutar)
      await sftp.chmod(remotePath, 0o755);

      this.logger.log(`Directory ${remotePath} created with permissions 0755`);
      return { success: true, path: remotePath };
    } catch (error) {
      this.logger.error(`Error creating directory: ${error}`);
      throw new Error(`Failed to create directory ${remotePath}: ${error}`);
    } finally {
      await this.safeDisconnect(sftp);
    }
  }

  async listFile(path: string) {
    return await this.sftpClient.list(path);
  }

  async dowloadFile(remotePath: string, localPath: string) {
    return await this.sftpClient.download(remotePath, localPath);
  }

  async uploadFile(file: Express.Multer.File, remotePath: string) {
    try {
      const dirPath = remotePath.endsWith('/') ? remotePath : remotePath + '/';
      const fileName = file.originalname;
      const fullPath = dirPath + fileName;

      // Crear un buffer desde el archivo
      const fileBuffer = file.buffer;

      // Crear un stream desde el buffer
      //const stream = Readable.from(fileBuffer);
      //const contents = Buffer.from('hello', 'utf8');
      //const path = '/home/liberty/ftp-liberty/upload/hello.txt';
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

  async borrarArchivo(remotePath: string) {
    return await this.sftpClient.delete(remotePath);
  }
}
