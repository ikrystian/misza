<?php
declare(strict_types=1);

/**
 * Minimalny czytnik pliku .env — odpowiednik `dotenv` z wersji node'owej.
 * Bez zależności zewnętrznych, żeby działało na hostingu bez Composera.
 */
final class Env
{
    /** @var array<string,string> */
    private static array $vars = [];
    private static bool $loaded = false;

    public static function load(string $file): void
    {
        self::$loaded = true;
        if (!is_readable($file)) {
            return;
        }

        foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') {
                continue;
            }
            $pos = strpos($line, '=');
            if ($pos === false) {
                continue;
            }
            $key = trim(substr($line, 0, $pos));
            $value = trim(substr($line, $pos + 1));

            // zdejmij cudzysłowy, jeśli wartość jest w nie ujęta
            $len = strlen($value);
            if ($len >= 2 && ($value[0] === '"' || $value[0] === "'") && $value[$len - 1] === $value[0]) {
                $value = substr($value, 1, -1);
            }

            self::$vars[$key] = $value;
        }
    }

    /**
     * Zmienne ustawione w środowisku mają pierwszeństwo przed .env — tak samo działa
     * dotenv w wersji node'owej (nie nadpisuje istniejącego process.env).
     */
    public static function get(string $key, ?string $default = null): ?string
    {
        $fromEnv = getenv($key);
        if (is_string($fromEnv) && $fromEnv !== '') {
            return $fromEnv;
        }
        if (isset(self::$vars[$key]) && self::$vars[$key] !== '') {
            return self::$vars[$key];
        }
        return $default;
    }

    /** Wartość wymagana — brak kończy się czytelnym komunikatem zamiast białej strony. */
    public static function required(string $key): string
    {
        $value = self::get($key);
        if ($value === null || $value === '') {
            throw new RuntimeException(
                "Brakuje zmiennej środowiskowej: {$key}. Skopiuj .env.example do .env, uzupełnij dane " .
                'i wygeneruj hash hasła poleceniem `php tools/hash-password.php`.'
            );
        }
        return $value;
    }

    public static function isLoaded(): bool
    {
        return self::$loaded;
    }
}
