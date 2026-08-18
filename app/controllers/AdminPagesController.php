<?php
declare(strict_types=1);

final class AdminPagesController
{
    public static function dashboard(): void
    {
        $gallery = DataStore::read('gallery');
        $categories = DataStore::read('categories');
        $news = DataStore::read('news');

        View::render('admin/dashboard', [
            'username' => Auth::username(),
            'stats' => (object) [
                'photos' => count($gallery),
                'categories' => count($categories),
                'posts' => count($news),
            ],
        ]);
    }

    public static function galleryPage(): void
    {
        $gallery = DataStore::read('gallery');
        $categories = DataStore::read('categories');

        usort($gallery, static fn(object $a, object $b): int => $a->order <=> $b->order);
        usort($categories, static fn(object $a, object $b): int => $a->order <=> $b->order);

        View::render('admin/gallery', [
            'username' => Auth::username(),
            'gallery' => $gallery,
            'categories' => $categories,
        ]);
    }

    public static function galleryFormNew(): void
    {
        $categories = DataStore::read('categories');
        usort($categories, static fn(object $a, object $b): int => $a->order <=> $b->order);

        View::render('admin/gallery-form', [
            'username' => Auth::username(),
            'mode' => 'create',
            'item' => null,
            'categories' => $categories,
        ]);
    }

    public static function galleryFormEdit(array $params): void
    {
        $gallery = DataStore::read('gallery');
        $categories = DataStore::read('categories');

        $item = null;
        foreach ($gallery as $candidate) {
            if ($candidate->id === $params['id']) {
                $item = $candidate;
                break;
            }
        }
        if ($item === null) {
            throw new HttpError('Nie znaleziono zdjęcia.', 404);
        }

        usort($categories, static fn(object $a, object $b): int => $a->order <=> $b->order);

        View::render('admin/gallery-form', [
            'username' => Auth::username(),
            'mode' => 'edit',
            'item' => $item,
            'categories' => $categories,
        ]);
    }

    public static function newsPage(): void
    {
        $news = DataStore::read('news');
        usort($news, static fn(object $a, object $b): int => strcmp((string) $b->date, (string) $a->date));

        View::render('admin/news', [
            'username' => Auth::username(),
            'news' => $news,
        ]);
    }

    public static function newsFormNew(): void
    {
        View::render('admin/news-form', [
            'username' => Auth::username(),
            'mode' => 'create',
            'item' => null,
        ]);
    }

    public static function newsFormEdit(array $params): void
    {
        $news = DataStore::read('news');

        $item = null;
        foreach ($news as $candidate) {
            if ($candidate->slug === $params['slug']) {
                $item = $candidate;
                break;
            }
        }
        if ($item === null) {
            throw new HttpError('Nie znaleziono wpisu.', 404);
        }

        View::render('admin/news-form', [
            'username' => Auth::username(),
            'mode' => 'edit',
            'item' => $item,
        ]);
    }

    public static function contentPage(): void
    {
        View::render('admin/content', [
            'username' => Auth::username(),
            'content' => DataStore::read('site-content'),
        ]);
    }
}
