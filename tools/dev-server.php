<?php
declare(strict_types=1);

/**
 * Router dla wbudowanego serwera PHP — do pracy lokalnej, zastępuje .htaccess.
 *
 *   php -S localhost:8080 -t . tools/dev-server.php
 *
 * Na hostingu nie jest używany (tam ruch kieruje .htaccess).
 */

$path = (string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$root = dirname(__DIR__);
$file = $root . '/' . ltrim(rawurldecode($path), '/');

// pliki statyczne serwuje wbudowany serwer; kod aplikacji i dane pozostają niedostępne
$isProtected = preg_match('#^/(app|data|tools|server|views|scripts|node_modules)(/|$)#', $path) === 1
    || str_starts_with(basename($path), '.');

if (!$isProtected && $path !== '/' && is_file($file) && !str_ends_with($file, '.php')) {
    return false;
}

require $root . '/index.php';
