<?php
declare(strict_types=1);

final class NewsController
{
    /**
     * Treść wpisu przychodzi jako JSON w polu formularza. Zwraca null, gdy pola nie przesłano
     * (wtedy przy edycji zostaje dotychczasowa treść).
     *
     * @return list<object>|null
     */
    private static function parseContent(): ?array
    {
        $raw = Request::field('content');
        if ($raw === null) {
            return null;
        }

        $parsed = json_decode($raw);
        if (!is_array($parsed)) {
            throw new HttpError('Nieprawidłowy format treści.', 400);
        }

        return array_values(array_filter($parsed, static fn($block): bool => is_object($block)
            && isset($block->text, $block->type)
            && is_string($block->text)
            && in_array($block->type, ['p', 'quote'], true)));
    }

    public static function list(): void
    {
        $news = DataStore::read('news');
        usort($news, static fn(object $a, object $b): int => strcmp((string) $b->date, (string) $a->date));
        Response::json($news);
    }

    public static function get(array $params): void
    {
        foreach (DataStore::read('news') as $post) {
            if ($post->slug === $params['slug']) {
                Response::json($post);
                return;
            }
        }

        Response::json(['error' => 'Nie znaleziono wpisu.'], 404);
    }

    public static function create(): void
    {
        $title = trim((string) Request::field('title'));
        $category = trim((string) Request::field('category'));
        $date = trim((string) Request::field('date'));
        $excerpt = trim((string) Request::field('excerpt'));

        if ($title === '' || $category === '' || $date === '' || $excerpt === '') {
            Response::json(['error' => 'Tytuł, kategoria, data i zajawka są wymagane.'], 400);
            return;
        }

        $file = Upload::single('image');
        if ($file === null) {
            Response::json(['error' => 'Zdjęcie jest wymagane.'], 400);
            return;
        }

        $content = self::parseContent() ?? [];
        $readTime = (string) Request::field('readTime');
        $imageAlt = (string) Request::field('imageAlt');
        $status = Request::field('status') === 'draft' ? 'draft' : 'published';

        $filename = ImageService::uniqueFilename($file['name']);
        ImageService::generateVariants($file['tmp'], $filename);

        $created = null;
        DataStore::update('news', static function (array $news) use (
            &$created, $title, $category, $date, $excerpt, $readTime, $imageAlt, $status, $filename, $content
        ): array {
            $base = slugify($title);
            if ($base === '') {
                $base = 'wpis';
            }

            $taken = [];
            foreach ($news as $post) {
                $taken[$post->slug] = true;
            }

            $slug = $base;
            $n = 2;
            while (isset($taken[$slug])) {
                $slug = $base . '-' . $n++;
            }

            $created = (object) [
                'slug' => $slug,
                'status' => $status,
                'category' => $category,
                'date' => $date,
                'title' => $title,
                'excerpt' => $excerpt,
                'readTime' => $readTime !== '' ? $readTime : '3 min',
                'image' => $filename,
                'imageAlt' => $imageAlt !== '' ? $imageAlt : $title,
                'content' => $content,
            ];
            $news[] = $created;

            return $news;
        });

        Response::json($created, 201);
    }

    public static function update(array $params): void
    {
        $slug = $params['slug'];
        $content = self::parseContent();

        $existing = null;
        foreach (DataStore::read('news') as $post) {
            if ($post->slug === $slug) {
                $existing = $post;
                break;
            }
        }
        if ($existing === null) {
            Response::json(['error' => 'Nie znaleziono wpisu.'], 404);
            return;
        }

        $oldImage = $existing->image ?? null;

        $newFilename = null;
        $file = Upload::single('image');
        if ($file !== null) {
            $newFilename = ImageService::uniqueFilename($file['name']);
            ImageService::generateVariants($file['tmp'], $newFilename);
        }

        $body = Request::body();
        $updated = null;

        DataStore::update('news', static function (array $news) use (&$updated, $slug, $body, $content, $newFilename): array {
            foreach ($news as $post) {
                if ($post->slug !== $slug) {
                    continue;
                }

                if (array_key_exists('status', $body)) {
                    $post->status = $body['status'] === 'draft' ? 'draft' : 'published';
                }
                foreach (['title', 'category', 'date', 'excerpt', 'readTime', 'imageAlt'] as $field) {
                    if (array_key_exists($field, $body)) {
                        $post->{$field} = (string) $body[$field];
                    }
                }
                if ($content !== null) {
                    $post->content = $content;
                }
                if ($newFilename !== null) {
                    $post->image = $newFilename;
                }

                $updated = $post;
                break;
            }

            return $news;
        });

        if ($newFilename !== null) {
            ImageService::deleteVariants($oldImage);
        }

        Response::json($updated);
    }

    public static function remove(array $params): void
    {
        $slug = $params['slug'];
        $removed = null;

        DataStore::update('news', static function (array $news) use (&$removed, $slug): array {
            foreach ($news as $index => $post) {
                if ($post->slug === $slug) {
                    $removed = $post;
                    array_splice($news, $index, 1);
                    break;
                }
            }

            return $news;
        });

        if ($removed === null) {
            Response::json(['error' => 'Nie znaleziono wpisu.'], 404);
            return;
        }

        ImageService::deleteVariants($removed->image ?? null);
        Response::json(['success' => true]);
    }
}
