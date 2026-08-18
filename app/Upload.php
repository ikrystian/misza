<?php
declare(strict_types=1);

/** Obsługa pojedynczego pliku z formularza — odpowiednik multera z wersji node'owej. */
final class Upload
{
    private const MAX_BYTES = 25 * 1024 * 1024;
    private const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

    /**
     * @return array{tmp:string,name:string}|null  null, gdy pola z plikiem nie przesłano
     */
    public static function single(string $field): ?array
    {
        $file = $_FILES[$field] ?? null;
        if (!is_array($file) || is_array($file['name'] ?? null)) {
            return null;
        }

        $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($error === UPLOAD_ERR_NO_FILE) {
            return null;
        }
        if ($error === UPLOAD_ERR_INI_SIZE || $error === UPLOAD_ERR_FORM_SIZE) {
            // limit serwera bywa niższy niż nasze 25 MB — podajemy ten, który faktycznie zadziałał
            $limit = (string) ini_get('upload_max_filesize');
            throw new HttpError("Plik jest za duży — limit serwera to {$limit}.", 400);
        }
        if ($error !== UPLOAD_ERR_OK) {
            throw new HttpError('Nie udało się wgrać pliku (kod błędu ' . $error . ').', 400);
        }

        $tmp = (string) ($file['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            throw new HttpError('Nieprawidłowy plik.', 400);
        }
        if ((int) ($file['size'] ?? 0) > self::MAX_BYTES) {
            throw new HttpError('Plik jest za duży — maksymalny rozmiar to 25 MB.', 400);
        }

        if (!in_array(self::mimeType($tmp), self::ALLOWED, true)) {
            throw new HttpError('Dozwolone są tylko pliki JPG, PNG lub WEBP.', 400);
        }

        return ['tmp' => $tmp, 'name' => (string) ($file['name'] ?? 'zdjecie.jpg')];
    }

    private static function mimeType(string $path): string
    {
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo !== false) {
                $mime = finfo_file($finfo, $path);
                finfo_close($finfo);
                if (is_string($mime) && $mime !== '') {
                    return $mime;
                }
            }
        }

        $info = @getimagesize($path);
        return is_array($info) ? (string) ($info['mime'] ?? '') : '';
    }

    /**
     * Gdy przesłane dane przekroczą post_max_size, PHP czyści $_POST i $_FILES —
     * bez tej kontroli panel dostałby mylący komunikat „Zdjęcie jest wymagane”.
     */
    public static function assertPostNotTruncated(): void
    {
        if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
            return;
        }

        // dotyczy tylko formularzy — przy application/json PHP z założenia nie wypełnia $_POST
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        $isForm = stripos($contentType, 'multipart/form-data') !== false
            || stripos($contentType, 'application/x-www-form-urlencoded') !== false;
        if (!$isForm) {
            return;
        }

        $length = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
        if ($length > 0 && $_POST === [] && $_FILES === []) {
            $limit = ini_get('post_max_size');
            throw new HttpError(
                "Przesłane dane są większe niż limit serwera (post_max_size = {$limit}). " .
                'Zwiększ limit w pliku .user.ini albo wgraj mniejsze zdjęcie.',
                413
            );
        }
    }
}
