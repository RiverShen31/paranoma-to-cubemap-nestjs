// src/utils/file.util.ts
import * as fs from 'fs';

export const ensureDirectoryExists = (path: string): void => {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
    }
};
