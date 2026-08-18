<?php
declare(strict_types=1);

/**
 * Odczyt i zapis plików data/*.json.
 *
 * JSON dekodujemy do obiektów (a nie tablic asocjacyjnych), żeby zapis wracał do pliku
 * w dokładnie tym samym kształcie — pusty obiekt `{}` nie zamieni się w `[]`.
 */
final class DataStore
{
    public static function dir(): string
    {
        return APP_ROOT . '/data';
    }

    private static function file(string $name): string
    {
        if (!preg_match('/^[a-z0-9-]+$/', $name)) {
            throw new RuntimeException("Nieprawidłowa nazwa pliku danych: {$name}");
        }
        return self::dir() . '/' . $name . '.json';
    }

    public static function read(string $name): mixed
    {
        $file = self::file($name);
        $raw = @file_get_contents($file);
        if ($raw === false) {
            throw new HttpError("Nie udało się odczytać danych ({$name}.json).", 500);
        }

        $data = json_decode($raw);
        if ($data === null && trim($raw) !== 'null') {
            throw new HttpError("Uszkodzony plik danych: {$name}.json (" . json_last_error_msg() . ').', 500);
        }

        return $data;
    }

    public static function write(string $name, mixed $data): void
    {
        $file = self::file($name);
        $dir = self::dir();
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            throw new HttpError('Nie udało się zapisać danych (błąd kodowania JSON).', 500);
        }

        // PHP wcina 4 spacjami, wersja node'owa 2 — zachowujemy dotychczasowy format plików.
        // Łamania linii w JSON-ie są zawsze strukturalne (znaki nowej linii w treści są uciekane),
        // więc wcięcie na początku linii można bezpiecznie przeliczyć.
        $json = preg_replace_callback(
            '/^ +/m',
            static fn(array $m): string => str_repeat(' ', intdiv(strlen($m[0]), 2)),
            $json
        ) . "\n";

        $tmp = $dir . '/.' . $name . '.' . getmypid() . '.tmp';
        if (file_put_contents($tmp, $json, LOCK_EX) === false) {
            throw new HttpError("Brak uprawnień do zapisu w katalogu data/ ({$name}.json).", 500);
        }
        if (!rename($tmp, $file)) {
            @unlink($tmp);
            throw new HttpError("Nie udało się zapisać pliku {$name}.json.", 500);
        }
    }

    /**
     * Czyta, przekazuje dane do $updater, zapisuje wynik — pod blokadą pliku,
     * żeby dwa równoczesne zapisy (np. dwie karty otwarte w panelu) się nie nadpisały.
     *
     * @param callable(mixed):mixed $updater
     */
    public static function update(string $name, callable $updater): mixed
    {
        $lockFile = self::dir() . '/.' . $name . '.lock';
        $lock = @fopen($lockFile, 'c');
        if ($lock === false) {
            throw new HttpError('Brak uprawnień do zapisu w katalogu data/.', 500);
        }

        try {
            flock($lock, LOCK_EX);
            $data = self::read($name);
            $result = $updater($data);
            $toWrite = $result !== null ? $result : $data;
            self::write($name, $toWrite);
            return $toWrite;
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
}
