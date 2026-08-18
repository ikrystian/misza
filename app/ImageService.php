<?php
declare(strict_types=1);

/**
 * Generowanie wariantów zdjęć — odpowiednik warstwy `sharp` z wersji node'owej.
 * Używa Imagick, jeśli jest dostępny; w przeciwnym razie GD (obecne na każdym hostingu).
 *
 * Te same parametry co dotychczasowy pipeline: thumbs 1000px/q82, large 2000px/q86,
 * progresywny JPEG, obrót wg EXIF, bez powiększania mniejszych zdjęć.
 */
final class ImageService
{
    private const THUMB = ['size' => 1000, 'quality' => 82];
    private const LARGE = ['size' => 2000, 'quality' => 86];

    public static function picturesDir(): string
    {
        return APP_ROOT . '/pictures';
    }

    public static function thumbsDir(): string
    {
        return self::picturesDir() . '/thumbs';
    }

    public static function largeDir(): string
    {
        return self::picturesDir() . '/large';
    }

    private static function ensureDirs(): void
    {
        foreach ([self::thumbsDir(), self::largeDir()] as $dir) {
            if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
                throw new HttpError('Nie udało się utworzyć katalogu na zdjęcia: ' . basename($dir) . '.', 500);
            }
            if (!is_writable($dir)) {
                throw new HttpError('Brak uprawnień do zapisu w pictures/' . basename($dir) . '.', 500);
            }
        }
    }

    public static function uniqueFilename(string $originalName): string
    {
        $slug = slugify(pathinfo($originalName, PATHINFO_FILENAME));
        if ($slug === '') {
            $slug = 'zdjecie';
        }

        $stamp = base_convert((string) (int) (microtime(true) * 1000), 10, 36);
        $filename = $slug . '-' . $stamp . '.jpg';

        // w tej samej milisekundzie mogą trafić dwa pliki — dokładamy losowy sufiks
        while (file_exists(self::thumbsDir() . '/' . $filename) || file_exists(self::largeDir() . '/' . $filename)) {
            $filename = $slug . '-' . $stamp . '-' . bin2hex(random_bytes(2)) . '.jpg';
        }

        return $filename;
    }

    /**
     * Generuje warianty thumbs/ (1000px) i large/ (2000px), zwraca wymiary miniatury.
     *
     * @return array{width:int,height:int}
     */
    public static function generateVariants(string $sourcePath, string $filename): array
    {
        self::ensureDirs();

        // duże zdjęcia potrafią wyczerpać domyślny limit pamięci na hostingu
        @ini_set('memory_limit', '512M');

        if (class_exists('Imagick')) {
            return self::withImagick($sourcePath, $filename);
        }
        if (function_exists('imagecreatetruecolor')) {
            return self::withGd($sourcePath, $filename);
        }

        throw new HttpError('Na serwerze brakuje rozszerzenia GD lub Imagick — nie można przetworzyć zdjęcia.', 500);
    }

    public static function deleteVariants(?string $filename): void
    {
        if ($filename === null || $filename === '' || basename($filename) !== $filename) {
            return;
        }
        @unlink(self::thumbsDir() . '/' . $filename);
        @unlink(self::largeDir() . '/' . $filename);
    }

    /* ---------- Imagick ---------- */

    private static function withImagick(string $source, string $filename): array
    {
        try {
            $image = new Imagick();
            $image->readImage($source);
            $image->setIteratorIndex(0);

            self::imagickOrient($image);

            [$width, $height] = self::imagickWrite(
                clone $image,
                self::thumbsDir() . '/' . $filename,
                self::THUMB['size'],
                self::THUMB['quality']
            );

            self::imagickWrite(
                $image,
                self::largeDir() . '/' . $filename,
                self::LARGE['size'],
                self::LARGE['quality']
            );

            return ['width' => $width, 'height' => $height];
        } catch (ImagickException $e) {
            throw new HttpError('Nie udało się przetworzyć zdjęcia: ' . $e->getMessage(), 400);
        }
    }

    private static function imagickOrient(Imagick $image): void
    {
        $orientation = $image->getImageOrientation();
        $background = new ImagickPixel('#000000');

        switch ($orientation) {
            case Imagick::ORIENTATION_TOPRIGHT:
                $image->flopImage();
                break;
            case Imagick::ORIENTATION_BOTTOMRIGHT:
                $image->rotateImage($background, 180);
                break;
            case Imagick::ORIENTATION_BOTTOMLEFT:
                $image->flopImage();
                $image->rotateImage($background, 180);
                break;
            case Imagick::ORIENTATION_LEFTTOP:
                $image->flopImage();
                $image->rotateImage($background, -90);
                break;
            case Imagick::ORIENTATION_RIGHTTOP:
                $image->rotateImage($background, 90);
                break;
            case Imagick::ORIENTATION_RIGHTBOTTOM:
                $image->flopImage();
                $image->rotateImage($background, 90);
                break;
            case Imagick::ORIENTATION_LEFTBOTTOM:
                $image->rotateImage($background, -90);
                break;
        }

        $image->setImageOrientation(Imagick::ORIENTATION_TOPLEFT);
    }

    /** @return array{0:int,1:int} */
    private static function imagickWrite(Imagick $image, string $target, int $max, int $quality): array
    {
        [$width, $height] = self::fitInside($image->getImageWidth(), $image->getImageHeight(), $max);

        $image->resizeImage($width, $height, Imagick::FILTER_LANCZOS, 1);
        // JPEG nie ma kanału alfa — przezroczystość spłaszczamy na czarno, tak jak robi to sharp
        $image->setImageBackgroundColor(new ImagickPixel('black'));
        $image = $image->flattenImages();
        $image->setImageFormat('jpeg');
        $image->setImageCompressionQuality($quality);
        $image->setInterlaceScheme(Imagick::INTERLACE_PLANE);
        $image->stripImage();

        if (!$image->writeImage($target)) {
            throw new HttpError('Nie udało się zapisać pliku zdjęcia.', 500);
        }
        $image->clear();

        return [$width, $height];
    }

    /* ---------- GD ---------- */

    private static function withGd(string $source, string $filename): array
    {
        $info = @getimagesize($source);
        if ($info === false) {
            throw new HttpError('Nie udało się odczytać pliku obrazu.', 400);
        }

        $image = self::gdLoad($source, $info[2]);
        $image = self::gdOrient($image, $source, $info[2]);

        $thumb = self::gdResize($image, self::THUMB['size']);
        self::gdSave($thumb, self::thumbsDir() . '/' . $filename, self::THUMB['quality']);
        $width = imagesx($thumb);
        $height = imagesy($thumb);
        imagedestroy($thumb);

        $large = self::gdResize($image, self::LARGE['size']);
        self::gdSave($large, self::largeDir() . '/' . $filename, self::LARGE['quality']);
        imagedestroy($large);

        imagedestroy($image);

        return ['width' => $width, 'height' => $height];
    }

    private static function gdLoad(string $source, int $type): GdImage
    {
        $image = match ($type) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($source),
            IMAGETYPE_PNG => @imagecreatefrompng($source),
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($source) : false,
            default => false,
        };

        if ($image === false) {
            throw new HttpError('Nieobsługiwany format obrazu — użyj JPG, PNG lub WEBP.', 400);
        }

        return $image;
    }

    private static function gdOrient(GdImage $image, string $source, int $type): GdImage
    {
        if ($type !== IMAGETYPE_JPEG || !function_exists('exif_read_data')) {
            return $image;
        }

        $exif = @exif_read_data($source);
        $orientation = (int) ($exif['Orientation'] ?? 1);

        // imagerotate obraca przeciwnie do ruchu wskazówek zegara
        switch ($orientation) {
            case 2:
                imageflip($image, IMG_FLIP_HORIZONTAL);
                break;
            case 3:
                $image = imagerotate($image, 180, 0);
                break;
            case 4:
                imageflip($image, IMG_FLIP_VERTICAL);
                break;
            case 5:
                $image = imagerotate($image, -90, 0);
                imageflip($image, IMG_FLIP_HORIZONTAL);
                break;
            case 6:
                $image = imagerotate($image, -90, 0);
                break;
            case 7:
                $image = imagerotate($image, 90, 0);
                imageflip($image, IMG_FLIP_HORIZONTAL);
                break;
            case 8:
                $image = imagerotate($image, 90, 0);
                break;
        }

        return $image;
    }

    private static function gdResize(GdImage $image, int $max): GdImage
    {
        $sourceWidth = imagesx($image);
        $sourceHeight = imagesy($image);
        [$width, $height] = self::fitInside($sourceWidth, $sourceHeight, $max);

        $target = imagecreatetruecolor($width, $height);
        // spłaszczenie ewentualnej przezroczystości na czarno — jak w sharp przy zapisie do JPEG
        imagefilledrectangle($target, 0, 0, $width, $height, imagecolorallocate($target, 0, 0, 0));
        imagecopyresampled($target, $image, 0, 0, 0, 0, $width, $height, $sourceWidth, $sourceHeight);

        return $target;
    }

    private static function gdSave(GdImage $image, string $target, int $quality): void
    {
        imageinterlace($image, true); // progresywny JPEG
        if (!imagejpeg($image, $target, $quality)) {
            throw new HttpError('Nie udało się zapisać pliku zdjęcia.', 500);
        }
    }

    /* ---------- wspólne ---------- */

    /** Wpisanie w kwadrat $max bez powiększania (fit: 'inside', withoutEnlargement). */
    private static function fitInside(int $width, int $height, int $max): array
    {
        $scale = min($max / $width, $max / $height, 1);

        return [
            max(1, (int) round($width * $scale)),
            max(1, (int) round($height * $scale)),
        ];
    }
}
