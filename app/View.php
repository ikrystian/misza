<?php
declare(strict_types=1);

/** Renderowanie szablonów PHP z app/views — odpowiednik warstwy EJS. */
final class View
{
    public static function render(string $__template, array $__data = [], int $__status = 200): void
    {
        http_response_code($__status);
        header('Content-Type: text/html; charset=utf-8');
        echo self::capture($__template, $__data);
    }

    public static function capture(string $__template, array $__data = []): string
    {
        $__file = APP_ROOT . '/app/views/' . $__template . '.php';
        if (!is_file($__file)) {
            throw new RuntimeException("Brak szablonu: {$__template}");
        }

        extract($__data, EXTR_SKIP);

        ob_start();
        try {
            include $__file;
        } catch (Throwable $e) {
            ob_end_clean();
            throw $e;
        }

        return (string) ob_get_clean();
    }
}
