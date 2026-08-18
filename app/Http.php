<?php
declare(strict_types=1);

/** Błąd z kodem HTTP — łapany centralnie w index.php. */
class HttpError extends RuntimeException
{
    public function __construct(string $message, private int $status = 500)
    {
        parent::__construct($message);
    }

    public function status(): int
    {
        return $this->status;
    }
}

final class Request
{
    private static ?array $jsonBody = null;

    /** Ścieżka żądania bez query stringa, bez końcowego ukośnika (poza „/”). */
    public static function path(): string
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH);
        $path = is_string($path) ? rawurldecode($path) : '/';
        $path = rtrim($path, '/');
        return $path === '' ? '/' : $path;
    }

    /**
     * Metoda HTTP z uwzględnieniem nadpisania przez `_method` / `X-HTTP-Method-Override`.
     * PHP nie parsuje ciała multipart dla PUT/PATCH, więc panel wysyła takie żądania
     * jako POST z polem `_method` (patrz public/admin/admin.js).
     */
    public static function method(): string
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        if ($method !== 'POST') {
            return $method;
        }

        $override = $_POST['_method'] ?? ($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? null);
        if (is_string($override)) {
            $override = strtoupper($override);
            if (in_array($override, ['PUT', 'PATCH', 'DELETE'], true)) {
                return $override;
            }
        }
        return 'POST';
    }

    public static function rawBody(): string
    {
        static $raw = null;
        if ($raw === null) {
            $raw = (string) file_get_contents('php://input');
        }
        return $raw;
    }

    /** Ciało żądania jako tablica asocjacyjna: JSON albo pola formularza. */
    public static function body(): array
    {
        if (self::$jsonBody !== null) {
            return self::$jsonBody;
        }

        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (stripos($contentType, 'application/json') !== false) {
            $decoded = json_decode(self::rawBody(), true);
            self::$jsonBody = is_array($decoded) ? $decoded : [];
        } else {
            self::$jsonBody = $_POST;
        }

        return self::$jsonBody;
    }

    /** Ciało JSON jako obiekty (zachowuje rozróżnienie obiekt/tablica przy zapisie do pliku). */
    public static function jsonAsObject(): mixed
    {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (stripos($contentType, 'application/json') === false) {
            return null;
        }
        return json_decode(self::rawBody());
    }

    public static function field(string $name): ?string
    {
        $value = self::body()[$name] ?? null;
        return is_scalar($value) ? (string) $value : null;
    }

    public static function isApi(): bool
    {
        return str_starts_with(self::path(), '/api/');
    }

    public static function scheme(): string
    {
        $https = $_SERVER['HTTPS'] ?? '';
        if ($https !== '' && strtolower((string) $https) !== 'off') {
            return 'https';
        }
        if (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') {
            return 'https';
        }
        return 'http';
    }

    public static function host(): string
    {
        return (string) ($_SERVER['HTTP_HOST'] ?? 'localhost');
    }

    public static function fullUrl(): string
    {
        return self::scheme() . '://' . self::host() . ($_SERVER['REQUEST_URI'] ?? '/');
    }
}

final class Response
{
    public static function json(mixed $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public static function text(string $body, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: text/plain; charset=utf-8');
        echo $body;
    }

    public static function redirect(string $location, int $status = 302): void
    {
        http_response_code($status);
        header('Location: ' . $location);
    }
}
