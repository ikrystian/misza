<?php
declare(strict_types=1);

final class CategoriesController
{
    /** @return list<object> */
    private static function withCounts(): array
    {
        $categories = DataStore::read('categories');
        $gallery = DataStore::read('gallery');

        $counts = [];
        foreach ($gallery as $item) {
            $counts[$item->category] = ($counts[$item->category] ?? 0) + 1;
        }

        usort($categories, static fn(object $a, object $b): int => $a->order <=> $b->order);

        return array_map(static function (object $category) use ($counts): object {
            $withCount = clone $category;
            $withCount->count = $counts[$category->slug] ?? 0;
            return $withCount;
        }, $categories);
    }

    public static function list(): void
    {
        Response::json(self::withCounts());
    }

    public static function create(): void
    {
        $label = trim((string) Request::field('label'));
        if ($label === '') {
            Response::json(['error' => 'Nazwa kategorii jest wymagana.'], 400);
            return;
        }

        $created = null;
        DataStore::update('categories', static function (array $categories) use (&$created, $label): array {
            $base = slugify($label);
            if ($base === '') {
                $base = 'kategoria';
            }

            $taken = [];
            foreach ($categories as $category) {
                $taken[$category->slug] = true;
            }

            $slug = $base;
            $n = 2;
            while (isset($taken[$slug])) {
                $slug = $base . '-' . $n++;
            }

            $nextOrder = 0;
            foreach ($categories as $category) {
                $nextOrder = max($nextOrder, (int) $category->order);
            }

            $created = (object) ['slug' => $slug, 'label' => $label, 'order' => $nextOrder + 1];
            $categories[] = $created;

            return $categories;
        });

        Response::json($created, 201);
    }

    public static function update(array $params): void
    {
        $label = trim((string) Request::field('label'));
        if ($label === '') {
            Response::json(['error' => 'Nazwa kategorii jest wymagana.'], 400);
            return;
        }

        $slug = $params['slug'];
        $updated = null;

        DataStore::update('categories', static function (array $categories) use (&$updated, $slug, $label): array {
            foreach ($categories as $category) {
                if ($category->slug === $slug) {
                    $category->label = $label;
                    $updated = $category;
                    break;
                }
            }

            return $categories;
        });

        if ($updated === null) {
            Response::json(['error' => 'Nie znaleziono kategorii.'], 404);
            return;
        }

        Response::json($updated);
    }

    public static function remove(array $params): void
    {
        $slug = $params['slug'];

        $count = 0;
        foreach (DataStore::read('gallery') as $item) {
            if ($item->category === $slug) {
                $count++;
            }
        }
        if ($count > 0) {
            Response::json(['error' => "Nie można usunąć kategorii — zawiera {$count} zdjęć."], 409);
            return;
        }

        $removed = false;
        DataStore::update('categories', static function (array $categories) use (&$removed, $slug): array {
            foreach ($categories as $index => $category) {
                if ($category->slug === $slug) {
                    array_splice($categories, $index, 1);
                    $removed = true;
                    break;
                }
            }

            return $categories;
        });

        if (!$removed) {
            Response::json(['error' => 'Nie znaleziono kategorii.'], 404);
            return;
        }

        Response::json(['success' => true]);
    }
}
