
const sharp = require('sharp');
import { Injectable } from '@nestjs/common';
import { ensureDirectoryExists } from 'src/utils/file.util';
import { ImageData } from 'src/utils/domain';
import { renderFace } from 'src/utils/renderFace';
import * as path from 'path'; // Import Node.js path module.

@Injectable()
export class FileUploadService {
    async processImage(filePath: string): Promise<void> {
        ensureDirectoryExists('./out/');
        const imageName = path.basename(filePath); // Gets the filename correctly without any path

        // Use path.join to ensure correct path construction
        const imagePath = path.join(__dirname, '..', 'assets', imageName);

        const { data, info } = await sharp(imagePath)
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const originalImage = new ImageData(info.width, info.height, data);
        const faces = ['pz', 'nz', 'px', 'nx', 'py', 'ny'];
        faces.forEach(face => {
            this.convertFace(originalImage, imageName, face);
        });
    }

    private async convertFace(originalImage: ImageData, imageName: string, faceName: string): Promise<void> {
        const face: ImageData = await renderFace(originalImage, faceName, Math.PI);
        await sharp(face.data, {
            raw: {
                width: face.width,
                height: face.height,
                channels: 3  // Assuming no transparency in panos
            },
        }).toFile(path.join(__dirname, '..', 'out', `${imageName}@${faceName}.jpg`));
    }
}
