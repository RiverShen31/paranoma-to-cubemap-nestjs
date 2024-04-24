// src/file-upload/file-upload.controller.ts

import { Controller, Post, UseInterceptors, UploadedFile, Res, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express'; // Adjust the path as necessary
import { FileUploadService } from './file-upload.service';

@Controller('file-upload')
export class FileUploadController {
    constructor(private fileUploadService: FileUploadService) {}  // Injection

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './assets',
            filename: (req, file, callback) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                callback(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        try {
            await this.fileUploadService.processImage(file.path);  // Ensure this method is available
            return res.status(HttpStatus.CREATED).json({
                message: 'File uploaded and processed successfully',
                data: {
                    originalName: file.originalname,
                    filename: file.filename,
                    path: file.path,
                }
            });
        } catch (error) {
            console.error('Error processing image:', error);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Error processing image',
                error: error.message
            });
        }
    }
}
