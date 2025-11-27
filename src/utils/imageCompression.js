/**
 * Compresses an image file using the HTML5 Canvas API.
 * 
 * @param {File} file - The image file to compress.
 * @param {Object} options - Compression options.
 * @param {number} [options.maxWidth=1200] - Maximum width of the output image.
 * @param {number} [options.quality=0.7] - JPEG quality (0 to 1).
 * @returns {Promise<File>} - A promise that resolves with the compressed file.
 */
export const compressImage = (file, { maxWidth = 1200, quality = 0.7 } = {}) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Canvas is empty'));
                            return;
                        }
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
