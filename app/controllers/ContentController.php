<?php
declare(strict_types=1);

final class ContentController
{
    private const SECTIONS = ['hero', 'about', 'showcase', 'services', 'cta', 'instagram', 'footer'];

    public static function getAll(): void
    {
        Response::json(DataStore::read('site-content'));
    }

    public static function updateSection(array $params): void
    {
        $section = $params['section'];
        if (!in_array($section, self::SECTIONS, true)) {
            Response::json(['error' => 'Nieznana sekcja. Dozwolone: ' . implode(', ', self::SECTIONS) . '.'], 400);
            return;
        }

        // dekodujemy do obiektu, żeby zapisany JSON zachował kształt przysłany przez panel
        $payload = Request::jsonAsObject();
        if (!$payload instanceof stdClass) {
            Response::json(['error' => 'Nieprawidłowe dane sekcji.'], 400);
            return;
        }

        $content = DataStore::update('site-content', static function (stdClass $content) use ($section, $payload): stdClass {
            $content->{$section} = $payload;
            return $content;
        });

        Response::json($content->{$section});
    }
}
