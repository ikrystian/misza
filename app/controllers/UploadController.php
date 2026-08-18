<?php
declare(strict_types=1);

final class UploadController
{
    public static function uploadImage(): void
    {
        $file = Upload::single('image');
        if ($file === null) {
            Response::json(['error' => 'Zdjęcie jest wymagane.'], 400);
            return;
        }

        $filename = ImageService::uniqueFilename($file['name']);
        $size = ImageService::generateVariants($file['tmp'], $filename);

        Response::json([
            'file' => $filename,
            'width' => $size['width'],
            'height' => $size['height'],
            'thumbUrl' => '/pictures/thumbs/' . $filename,
            'largeUrl' => '/pictures/large/' . $filename,
        ], 201);
    }
}
