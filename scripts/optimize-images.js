import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { getDb } from '../src/lib/db.js';

async function optimizeUploads() {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const files = fs.readdirSync(uploadsDir);

    console.log(`Optimizing ${files.length} files in public/uploads...`);

    for (const file of files) {
        const fullPath = path.join(uploadsDir, file);
        const stat = fs.statSync(fullPath);
        if (!stat.isFile()) continue;

        if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
            const ext = path.extname(file);
            const baseName = path.basename(file, ext);
            const webpName = `${baseName}.webp`;
            const webpPath = path.join(uploadsDir, webpName);

            try {
                const buffer = fs.readFileSync(fullPath);
                const metadata = await sharp(buffer).metadata();
                
                // Resize if wider than 1600px
                let pipeline = sharp(buffer);
                if (metadata.width && metadata.width > 1600) {
                    pipeline = pipeline.resize(1600, null, { withoutEnlargement: true });
                }

                const webpBuffer = await pipeline.webp({ quality: 80, effort: 6 }).toBuffer();
                fs.writeFileSync(webpPath, webpBuffer);
                console.log(`Converted ${file} (${(stat.size / 1024).toFixed(1)} KB) -> ${webpName} (${(webpBuffer.length / 1024).toFixed(1)} KB)`);

                // Also overwrite original with compressed version if large
                if (file.endsWith('.png') && stat.size > 200 * 1024) {
                    const pngBuffer = await pipeline.png({ quality: 80, compressionLevel: 9 }).toBuffer();
                    fs.writeFileSync(fullPath, pngBuffer);
                    console.log(`Recompressed original PNG ${file}: ${(stat.size / 1024).toFixed(1)} KB -> ${(pngBuffer.length / 1024).toFixed(1)} KB`);
                }
            } catch (err) {
                console.error(`Error processing ${file}:`, err);
            }
        }
    }
}

async function optimizeMediaStorage() {
    console.log('Checking media_storage in DB...');
    const db = getDb();
    try {
        const items = await db.prepare('SELECT id, mime_type, data FROM media_storage').all();
        console.log(`Found ${items.length} items in media_storage`);

        for (const item of items) {
            if (!item.data || item.mime_type?.startsWith('video/')) continue;

            let buffer;
            if (typeof item.data === 'string') {
                const base64Data = item.data.replace(/^data:[^;]+;base64,/, '');
                buffer = Buffer.from(base64Data, 'base64');
            } else if (Buffer.isBuffer(item.data)) {
                buffer = item.data;
            } else {
                buffer = Buffer.from(item.data);
            }

            if (buffer.length > 200 * 1024) {
                try {
                    const metadata = await sharp(buffer).metadata();
                    let pipeline = sharp(buffer);
                    if (metadata.width && metadata.width > 1600) {
                        pipeline = pipeline.resize(1600, null, { withoutEnlargement: true });
                    }
                    const optimizedBuffer = await pipeline.webp({ quality: 80, effort: 6 }).toBuffer();
                    
                    const newBase64 = optimizedBuffer.toString('base64');
                    await db.prepare('UPDATE media_storage SET data = ?, mime_type = ? WHERE id = ?').run(newBase64, 'image/webp', item.id);
                    console.log(`Optimized DB item ${item.id}: ${(buffer.length / 1024).toFixed(1)} KB -> ${(optimizedBuffer.length / 1024).toFixed(1)} KB`);
                } catch (e) {
                    console.error(`Error optimizing DB media ${item.id}:`, e);
                }
            }
        }
    } catch (dbErr) {
        console.error('Error optimizing media_storage:', dbErr);
    }
}

async function updateCarouselUrls() {
    const db = getDb();
    try {
        const slides = await db.prepare('SELECT id, image_url, mobile_image_url FROM carousel_images').all();
        for (const slide of slides) {
            let updated = false;
            let imgUrl = slide.image_url;
            let mobUrl = slide.mobile_image_url;

            if (imgUrl && imgUrl.endsWith('.png') && imgUrl.startsWith('/uploads/')) {
                const webpUrl = imgUrl.replace(/\.png$/, '.webp');
                if (fs.existsSync(path.join(process.cwd(), 'public', webpUrl.replace(/^\//, '')))) {
                    imgUrl = webpUrl;
                    updated = true;
                }
            }

            if (mobUrl && mobUrl.endsWith('.png') && mobUrl.startsWith('/uploads/')) {
                const webpUrl = mobUrl.replace(/\.png$/, '.webp');
                if (fs.existsSync(path.join(process.cwd(), 'public', webpUrl.replace(/^\//, '')))) {
                    mobUrl = webpUrl;
                    updated = true;
                }
            }

            if (updated) {
                await db.prepare('UPDATE carousel_images SET image_url = ?, mobile_image_url = ? WHERE id = ?').run(imgUrl, mobUrl, slide.id);
                console.log(`Updated slide ${slide.id} URLs to WebP:`, { imgUrl, mobUrl });
            }
        }
    } catch (err) {
        console.error('Error updating carousel URLs:', err);
    }
}

async function main() {
    await optimizeUploads();
    await optimizeMediaStorage();
    await updateCarouselUrls();
    console.log('All image optimizations complete!');
}

main().catch(console.error);
