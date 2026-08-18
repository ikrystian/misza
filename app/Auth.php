<?php
declare(strict_types=1);

/** Sesja administratora — odpowiednik express-session + middleware requireAuth. */
final class Auth
{
    private const COOKIE = 'misza_sid';
    private const IDLE_TIMEOUT = 3600; // 1 h bezczynności, odświeżane przy każdym żądaniu

    private static bool $started = false;

    public static function start(): void
    {
        if (self::$started) {
            return;
        }
        self::$started = true;

        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        session_name(self::COOKIE);
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure' => Request::scheme() === 'https',
        ]);
        session_start();

        // wygaszenie po godzinie bezczynności
        $lastSeen = (int) ($_SESSION['last_seen'] ?? 0);
        if ($lastSeen > 0 && time() - $lastSeen > self::IDLE_TIMEOUT) {
            $_SESSION = [];
            session_regenerate_id(true);
        }
        $_SESSION['last_seen'] = time();
    }

    public static function isAdmin(): bool
    {
        self::start();
        return !empty($_SESSION['is_admin']);
    }

    public static function username(): string
    {
        self::start();
        return (string) ($_SESSION['username'] ?? '');
    }

    public static function login(string $username): void
    {
        self::start();
        session_regenerate_id(true);
        $_SESSION['is_admin'] = true;
        $_SESSION['username'] = $username;
        $_SESSION['last_seen'] = time();
    }

    public static function logout(): void
    {
        self::start();
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $params['path'],
                'domain' => $params['domain'],
                'secure' => $params['secure'],
                'httponly' => $params['httponly'],
                'samesite' => 'Lax',
            ]);
        }

        session_destroy();
    }

    /** Wymusza zalogowanie: API dostaje 401 w JSON, strony przekierowanie na login. */
    public static function requireAdmin(): void
    {
        if (self::isAdmin()) {
            return;
        }

        if (Request::isApi()) {
            Response::json(['error' => 'Wymagane logowanie.'], 401);
        } else {
            Response::redirect('/admin/login');
        }
        exit;
    }

    /** Prosta ochrona CSRF na mutujących trasach API: żądanie musi pochodzić z tego samego originu. */
    public static function assertSameOrigin(): void
    {
        if (!in_array(Request::method(), ['POST', 'PUT', 'DELETE', 'PATCH'], true)) {
            return;
        }

        $origin = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
        if ($origin === '') {
            return;
        }

        $expected = Request::scheme() . '://' . Request::host();
        if (!str_starts_with($origin, $expected)) {
            throw new HttpError('Nieprawidłowe źródło żądania.', 403);
        }
    }

    /**
     * Weryfikacja hasła. Hash z bcryptjs bywa zapisany z prefiksem $2a$/$2b$ —
     * dla PHP-owego crypt() to ten sam algorytm co $2y$, więc prefiks normalizujemy.
     */
    public static function verifyPassword(string $password, string $hash): bool
    {
        if (str_starts_with($hash, '$2b$') || str_starts_with($hash, '$2a$')) {
            $hash = '$2y$' . substr($hash, 4);
        }

        return password_verify($password, $hash);
    }
}
