<?php
declare(strict_types=1);

/**
 * Generator hasha hasła administratora (bcrypt).
 *
 * Uruchomienie:
 *   php tools/hash-password.php
 *   php tools/hash-password.php "moje-haslo"
 *
 * Wynik wklej do pliku .env jako ADMIN_PASSWORD_HASH.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Ten skrypt uruchamia się wyłącznie z linii poleceń.\n");
}

$password = $argv[1] ?? null;

if ($password === null) {
    echo "Hasło administratora: ";
    if (function_exists('shell_exec') && stripos(PHP_OS_FAMILY, 'Windows') === false) {
        // ukrycie wpisywanych znaków, jeśli terminal na to pozwala
        @shell_exec('stty -echo 2>/dev/null');
        $password = trim((string) fgets(STDIN));
        @shell_exec('stty echo 2>/dev/null');
        echo PHP_EOL;
    } else {
        $password = trim((string) fgets(STDIN));
    }
}

if ($password === '' || strlen($password) < 8) {
    exit("Hasło musi mieć co najmniej 8 znaków.\n");
}

$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

echo PHP_EOL;
echo "Wklej do pliku .env:" . PHP_EOL . PHP_EOL;
echo 'ADMIN_PASSWORD_HASH=' . $hash . PHP_EOL . PHP_EOL;
