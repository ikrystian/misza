<?php
declare(strict_types=1);

final class AuthController
{
    public static function loginPage(): void
    {
        if (Auth::isAdmin()) {
            Response::redirect('/admin');
            return;
        }
        View::render('admin/login');
    }

    public static function login(): void
    {
        $body = Request::body();
        $username = is_string($body['username'] ?? null) ? $body['username'] : '';
        $password = is_string($body['password'] ?? null) ? $body['password'] : '';

        $expectedUsername = Env::required('ADMIN_USERNAME');
        $expectedHash = Env::required('ADMIN_PASSWORD_HASH');

        $validUsername = hash_equals($expectedUsername, $username);
        $validPassword = $validUsername && Auth::verifyPassword($password, $expectedHash);

        if (!$validUsername || !$validPassword) {
            Response::json(['error' => 'Nieprawidłowy login lub hasło.'], 401);
            return;
        }

        Auth::login($username);
        Response::json(['success' => true]);
    }

    public static function logout(): void
    {
        Auth::logout();
        Response::json(['success' => true]);
    }

    public static function session(): void
    {
        $authenticated = Auth::isAdmin();
        Response::json([
            'authenticated' => $authenticated,
            'username' => $authenticated ? Auth::username() : null,
        ]);
    }
}
