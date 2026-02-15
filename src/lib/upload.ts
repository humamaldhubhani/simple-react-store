import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);

export async function saveBase64Image(base64Data: string): Promise<string | null> {
    if (!base64Data || !base64Data.startsWith('data:image/')) return null;

    try {
        // Extract base64 content
        const matches = base64Data.match(/^data:image\/([A-Za-z-+/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return null;

        const extension = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        
        // Create unique filename
        const filename = `img_${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension === 'jpeg' ? 'jpg' : extension}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        const filePath = path.join(uploadDir, filename);

        // Ensure directory exists (redundant but safe)
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        await writeFile(filePath, buffer);
        
        // Return relative path for web access
        return `/uploads/${filename}`;
    } catch (error) {
        console.error('Error saving image:', error);
        return null;
    }
}
