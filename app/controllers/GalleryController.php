<?php
declare(strict_types=1);

final class GalleryController
{
    public static function list(): void
    {
        $gallery = DataStore::read('gallery');
        usort($gallery, static fn(object $a, object $b): int => $a->order <=> $b->order);
        Response::json($gallery);
    }

    public static function create(): void
    {
        $title = trim((string) Request::field('title'));
        $alt = (string) Request::field('alt');
        $category = trim((string) Request::field('category'));

        if ($title === '' || $category === '') {
            Response::json(['error' => 'Tytuł i kategoria są wymagane.'], 400);
            return;
        }

        $file = Upload::single('image');
        if ($file === null) {
            Response::json(['error' => 'Zdjęcie jest wymagane.'], 400);
            return;
        }

        if (!self::categoryExists($category)) {
            Response::json(['error' => 'Nieznana kategoria.'], 400);
            return;
        }

        $filename = ImageService::uniqueFilename($file['name']);
        $size = ImageService::generateVariants($file['tmp'], $filename);

        $created = null;
        DataStore::update('gallery', static function (array $gallery) use (&$created, $category, $title, $alt, $filename, $size): array {
            $nextOrder = 0;
            foreach ($gallery as $item) {
                $nextOrder = max($nextOrder, (int) $item->order);
            }

            $created = (object) [
                'id' => self::uuid(),
                'category' => $category,
                'title' => $title,
                'alt' => $alt !== '' ? $alt : $title,
                'file' => $filename,
                'width' => $size['width'],
                'height' => $size['height'],
                'order' => $nextOrder + 1,
            ];
            $gallery[] = $created;

            return $gallery;
        });

        Response::json($created, 201);
    }

    public static function update(array $params): void
    {
        $id = $params['id'];
        $body = Request::body();

        if (isset($body['category']) && !self::categoryExists((string) $body['category'])) {
            Response::json(['error' => 'Nieznana kategoria.'], 400);
            return;
        }

        $updated = null;
        DataStore::update('gallery', static function (array $gallery) use (&$updated, $id, $body): array {
            foreach ($gallery as $item) {
                if ($item->id !== $id) {
                    continue;
                }
                if (array_key_exists('title', $body)) {
                    $item->title = (string) $body['title'];
                }
                if (array_key_exists('alt', $body)) {
                    $item->alt = (string) $body['alt'];
                }
                if (array_key_exists('category', $body)) {
                    $item->category = (string) $body['category'];
                }
                $updated = $item;
                break;
            }

            return $gallery;
        });

        if ($updated === null) {
            Response::json(['error' => 'Nie znaleziono zdjęcia.'], 404);
            return;
        }

        Response::json($updated);
    }

    public static function updateImage(array $params): void
    {
        $id = $params['id'];

        $file = Upload::single('image');
        if ($file === null) {
            Response::json(['error' => 'Zdjęcie jest wymagane.'], 400);
            return;
        }

        $oldFile = null;
        foreach (DataStore::read('gallery') as $item) {
            if ($item->id === $id) {
                $oldFile = $item->file;
                break;
            }
        }
        if ($oldFile === null) {
            Response::json(['error' => 'Nie znaleziono zdjęcia.'], 404);
            return;
        }

        $filename = ImageService::uniqueFilename($file['name']);
        $size = ImageService::generateVariants($file['tmp'], $filename);

        $updated = null;
        DataStore::update('gallery', static function (array $gallery) use (&$updated, $id, $filename, $size): array {
            foreach ($gallery as $item) {
                if ($item->id !== $id) {
                    continue;
                }
                $item->file = $filename;
                $item->width = $size['width'];
                $item->height = $size['height'];
                $updated = $item;
                break;
            }

            return $gallery;
        });

        ImageService::deleteVariants($oldFile);
        Response::json($updated);
    }

    public static function remove(array $params): void
    {
        $id = $params['id'];
        $removed = null;

        DataStore::update('gallery', static function (array $gallery) use (&$removed, $id): array {
            foreach ($gallery as $index => $item) {
                if ($item->id !== $id) {
                    continue;
                }
                $removed = $item;
                array_splice($gallery, $index, 1);
                break;
            }

            foreach ($gallery as $index => $item) {
                $item->order = $index + 1;
            }

            return $gallery;
        });

        if ($removed === null) {
            Response::json(['error' => 'Nie znaleziono zdjęcia.'], 404);
            return;
        }

        ImageService::deleteVariants($removed->file);
        Response::json(['success' => true]);
    }

    public static function reorder(): void
    {
        $order = Request::body()['order'] ?? null;
        if (!is_array($order)) {
            Response::json(['error' => 'Wymagana jest tablica `order` z identyfikatorami zdjęć.'], 400);
            return;
        }

        $gallery = DataStore::update('gallery', static function (array $gallery) use ($order): array {
            $byId = [];
            foreach ($gallery as $item) {
                $byId[$item->id] = $item;
            }
            foreach (array_values($order) as $index => $id) {
                if (is_string($id) && isset($byId[$id])) {
                    $byId[$id]->order = $index + 1;
                }
            }

            return $gallery;
        });

        usort($gallery, static fn(object $a, object $b): int => $a->order <=> $b->order);
        Response::json($gallery);
    }

    private static function categoryExists(string $slug): bool
    {
        foreach (DataStore::read('categories') as $category) {
            if ($category->slug === $slug) {
                return true;
            }
        }

        return false;
    }

    /** UUID v4 — odpowiednik crypto.randomUUID() */
    private static function uuid(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
    }
}
