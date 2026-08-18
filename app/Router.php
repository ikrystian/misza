<?php
declare(strict_types=1);

/** Minimalny router: wzorce w stylu `/admin/gallery/{id}/edit`, dopasowywane w kolejności dodania. */
final class Router
{
    /** @var list<array{method:string,regex:string,handler:callable}> */
    private array $routes = [];

    public function get(string $pattern, callable $handler): void
    {
        $this->add('GET', $pattern, $handler);
    }

    public function post(string $pattern, callable $handler): void
    {
        $this->add('POST', $pattern, $handler);
    }

    public function put(string $pattern, callable $handler): void
    {
        $this->add('PUT', $pattern, $handler);
    }

    public function delete(string $pattern, callable $handler): void
    {
        $this->add('DELETE', $pattern, $handler);
    }

    private function add(string $method, string $pattern, callable $handler): void
    {
        // preg_quote ucieka też nawiasy klamrowe — przywracamy je przed podmianą na grupy
        $regex = str_replace(['\{', '\}'], ['{', '}'], preg_quote($pattern, '#'));
        $regex = preg_replace('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', '(?P<$1>[^/]+)', $regex);

        $this->routes[] = [
            'method' => $method,
            'regex' => '#^' . $regex . '$#u',
            'handler' => $handler,
        ];
    }

    public function dispatch(string $method, string $path): void
    {
        $pathMatched = false;

        foreach ($this->routes as $route) {
            if (!preg_match($route['regex'], $path, $matches)) {
                continue;
            }
            $pathMatched = true;
            if ($route['method'] !== $method) {
                continue;
            }

            $params = [];
            foreach ($matches as $key => $value) {
                if (is_string($key)) {
                    $params[$key] = $value;
                }
            }

            $this->guard($path);
            ($route['handler'])($params);
            return;
        }

        if ($pathMatched) {
            throw new HttpError('Nieobsługiwana metoda żądania.', 405);
        }
        throw new HttpError('Nie znaleziono strony.', 404);
    }

    /**
     * Odpowiednik `router.use(requireAuth)` z wersji node'owej: chronione jest całe /admin
     * (poza stroną logowania) i całe /api poza /api/auth/*.
     */
    private function guard(string $path): void
    {
        if (str_starts_with($path, '/api/')) {
            Auth::assertSameOrigin();
            if (!str_starts_with($path, '/api/auth/')) {
                Auth::requireAdmin();
            }
            return;
        }

        if (str_starts_with($path, '/admin') && $path !== '/admin/login') {
            Auth::requireAdmin();
        }
    }
}
