<?php
declare(strict_types=1);

/** Escapowanie do HTML — odpowiednik `<%= %>` z EJS. */
function e(mixed $value): string
{
    return htmlspecialchars((string) ($value ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Ścieżka do wariantu zdjęcia: /pictures/<wariant>/<plik> */
function pic(?string $file, ?string $variant): string
{
    return '/pictures/' . rawurlencode((string) $variant) . '/' . rawurlencode((string) $file);
}

/**
 * Treść pochodzi z panelu (dane admina), ale i tak escapujemy przed wstrzyknięciem &nbsp;/<br> —
 * to pola tekstowe, nie miejsce na HTML.
 */
function eyebrow_html(?string $str): string
{
    return preg_replace('/\s*\/\/\s*/', ' &nbsp;//&nbsp; ', e($str)) ?? '';
}

function multiline_html(?string $str): string
{
    return str_replace(["\r\n", "\n"], '<br>', e($str));
}

/** Data po polsku, np. „18 sierpnia 2026” (bez zależności od rozszerzenia intl). */
function date_label_pl(?string $isoDate): string
{
    $months = [
        1 => 'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
        'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
    ];

    $timestamp = strtotime((string) $isoDate);
    if ($timestamp === false) {
        return (string) $isoDate;
    }

    $day = (int) date('j', $timestamp);
    $month = (int) date('n', $timestamp);
    $year = date('Y', $timestamp);

    return $day . ' ' . ($months[$month] ?? '') . ' ' . $year;
}

function pad2(int|string $n): string
{
    return str_pad((string) $n, 2, '0', STR_PAD_LEFT);
}

/** Bezpieczne osadzanie JSON w <script> — `<` uciekane, żeby "</script>" nie zamknęło tagu. */
function json_script(mixed $data): string
{
    return (string) json_encode($data, JSON_HEX_TAG | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

/**
 * ł/Ł i pozostałe polskie znaki nie mają prostego odpowiednika ASCII w PHP bez intl,
 * więc podmieniamy je z mapy przed usunięciem reszty znaków.
 */
function slugify(?string $str): string
{
    $map = [
        'ą' => 'a', 'ć' => 'c', 'ę' => 'e', 'ł' => 'l', 'ń' => 'n', 'ó' => 'o', 'ś' => 's', 'ź' => 'z', 'ż' => 'z',
        'Ą' => 'A', 'Ć' => 'C', 'Ę' => 'E', 'Ł' => 'L', 'Ń' => 'N', 'Ó' => 'O', 'Ś' => 'S', 'Ź' => 'Z', 'Ż' => 'Z',
        'á' => 'a', 'à' => 'a', 'â' => 'a', 'ä' => 'a', 'ã' => 'a', 'å' => 'a', 'æ' => 'ae',
        'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
        'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i',
        'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u',
        'ý' => 'y', 'ÿ' => 'y', 'ñ' => 'n', 'ç' => 'c', 'ø' => 'o', 'ð' => 'd', 'þ' => 'th', 'ß' => 'ss',
        'č' => 'c', 'š' => 's', 'ž' => 'z', 'ř' => 'r', 'ě' => 'e', 'ů' => 'u', 'ť' => 't', 'ď' => 'd',
    ];

    $value = strtr((string) $str, $map);
    $value = mb_strtolower($value, 'UTF-8');
    $value = preg_replace('/[^a-z0-9]+/u', '-', $value) ?? '';

    return trim($value, '-');
}

/** Skrót na renderowanie widoku wewnątrz innego widoku. */
function partial(string $template, array $data = []): void
{
    echo View::capture($template, $data);
}

/** Bezpieczny odczyt pola z obiektu/tablicy pochodzącej z JSON-a. */
function prop(mixed $subject, string $key, mixed $default = null): mixed
{
    if (is_object($subject)) {
        return $subject->{$key} ?? $default;
    }
    if (is_array($subject)) {
        return $subject[$key] ?? $default;
    }
    return $default;
}
