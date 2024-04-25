
const sharp = require('sharp');
import { Injectable } from '@nestjs/common';
import { ImageData } from 'src/utils/domain';
import { renderFace } from 'src/utils/renderFace';
import * as path from 'path';
import * as fs from 'fs';
import { ensureDirectoryExists } from 'src/utils/file.util';

@Injectable()
export class FileUploadService {
    async processImage(filePath: string): Promise<string> {
        ensureDirectoryExists('./out/');
        const imageName = path.basename(filePath);
        const imagePath = path.join(__dirname, '..', 'assets', imageName);
        
        if (!fs.existsSync(imagePath)) {
            throw new Error(`File not found: ${imagePath}`);
        }

        const { data, info } = await sharp(imagePath)
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const originalImage = new ImageData(info.width, info.height, data);
        const faces = ['pz', 'nz', 'px', 'nx', 'py', 'ny'];
        const baseDirPath = path.join(__dirname, '..', 'out', imageName);

        for (const face of faces) {
            await this.convertFace(originalImage, imageName, face);
        }
        return baseDirPath;
    }

    private async convertFace(originalImage: ImageData, imageName: string, faceName: string): Promise<void> {
        const face = await renderFace(originalImage, faceName, Math.PI);
        const baseDirPath = path.join(__dirname, '..', 'out', imageName, faceName);
    
        const dirs = {
            '0': 1, // existing 1x1 grid (just the image itself)
            '1': 2, // existing 2x2 grid
            '2': 3, // for 3x3 grid
            '3': 5  // for 5x5 grid
        };
    
        Object.entries(dirs).forEach(async ([dirName, gridSize]) => {
            const dirPath = path.join(baseDirPath, dirName);
            fs.mkdirSync(dirPath, { recursive: true });
    
            const filePath = path.join(dirPath, `${faceName}.jpg`);
            if (gridSize === 1) {
                // For 1x1 grid, just copy the original processed image
                await sharp(face.data, {
                    raw: {
                        width: face.width,
                        height: face.height,
                        channels: 3
                    },
                }).toFile(filePath);
            } else {
                // For other grids, use the createGridImage method
                await this.createGridImage(face.data, face.width, face.height, dirPath, gridSize);
            }
        });
    }
    
    
    private async createGridImage(imageBuffer: Buffer, imageWidth: number, imageHeight: number, outputDirPath: string, gridSize: number): Promise<void> {
        const tileWidth = Math.floor(imageWidth / gridSize);
        const tileHeight = Math.floor(imageHeight / gridSize);
    
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const tileName = `${i}${j}.jpg`;
                const tilePath = path.join(outputDirPath, tileName);
                try {
                    await sharp(imageBuffer, {
                        raw: {
                            width: imageWidth,
                            height: imageHeight,
                            channels: 3
                        }
                    })
                    .extract({
                        left: j * tileWidth,
                        top: i * tileHeight,
                        width: tileWidth,
                        height: tileHeight
                    })
                    .toFile(tilePath);
                } catch (error) {
                    console.error(`Failed to create ${tileName}:`, error);
                }
            }
        }
    }
    
    
}
