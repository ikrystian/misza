<?php
declare(strict_types=1);

final class PublicController
{
    private const AKTUALNOSCI_CTA_IMAGE = '97605673_608548533117445_2836186498636709888_n.jpg';
    private const POST_CTA_IMAGE = '61163821_389454365026864_6372790439929446400_n.jpg';

    /** @param list<object> $news @return list<object> */
    private static function sortByDateDesc(array $news): array
    {
        usort($news, static fn(object $a, object $b): int => strcmp((string) $b->date, (string) $a->date));
        return $news;
    }

    /** @return list<object> */
    private static function published(array $news): array
    {
        return array_values(array_filter($news, static fn(object $p): bool => ($p->status ?? 'published') !== 'draft'));
    }

    public static function home(): void
    {
        $content = DataStore::read('site-content');
        $news = DataStore::read('news');

        $latestNews = array_slice(self::sortByDateDesc(self::published($news)), 0, 3);

        View::render('index', compact('content', 'latestNews'));
    }

    public static function gallery(): void
    {
        $content = DataStore::read('site-content');
        $gallery = DataStore::read('gallery');
        $categories = DataStore::read('categories');

        usort($gallery, static fn(object $a, object $b): int => $a->order <=> $b->order);
        usort($categories, static fn(object $a, object $b): int => $a->order <=> $b->order);

        $counts = [];
        foreach ($gallery as $item) {
            $counts[$item->category] = ($counts[$item->category] ?? 0) + 1;
        }

        $labelBySlug = [];
        $categoriesWithCounts = [];
        foreach ($categories as $category) {
            $labelBySlug[$category->slug] = $category->label;
            $withCount = clone $category;
            $withCount->count = $counts[$category->slug] ?? 0;
            $categoriesWithCounts[] = $withCount;
        }

        View::render('gallery', [
            'content' => $content,
            'gallery' => $gallery,
            'categories' => $categoriesWithCounts,
            'labelBySlug' => $labelBySlug,
        ]);
    }

    public static function aktualnosci(): void
    {
        $content = DataStore::read('site-content');
        $sorted = self::sortByDateDesc(self::published(DataStore::read('news')));

        $featured = $sorted[0] ?? null;
        $rest = array_slice($sorted, 1);

        View::render('aktualnosci', [
            'content' => $content,
            'featured' => $featured,
            'rest' => $rest,
            'ctaImage' => self::AKTUALNOSCI_CTA_IMAGE,
        ]);
    }

    public static function post(): void
    {
        $content = DataStore::read('site-content');
        $sorted = self::sortByDateDesc(self::published(DataStore::read('news')));

        $slug = isset($_GET['slug']) && is_string($_GET['slug']) ? $_GET['slug'] : '';
        $index = null;
        foreach ($sorted as $i => $item) {
            if ($item->slug === $slug) {
                $index = $i;
                break;
            }
        }

        if ($index === null) {
            View::render('post', [
                'content' => $content,
                'post' => null,
                'prevPost' => null,
                'nextPost' => null,
                'related' => [],
                'hasMultiplePosts' => false,
                'shareUrl' => '',
                'ctaImage' => self::POST_CTA_IMAGE,
            ], 404);
            return;
        }

        $found = $sorted[$index];
        $total = count($sorted);
        $prevPost = $sorted[($index - 1 + $total) % $total];
        $nextPost = $sorted[($index + 1) % $total];

        $others = array_values(array_filter($sorted, static fn(object $p): bool => $p->slug !== $found->slug));
        $sameCategory = array_filter($others, static fn(object $p): bool => $p->category === $found->category);
        $rest = array_filter($others, static fn(object $p): bool => $p->category !== $found->category);
        $related = array_slice(array_merge(array_values($sameCategory), array_values($rest)), 0, 3);

        View::render('post', [
            'content' => $content,
            'post' => $found,
            'prevPost' => $prevPost,
            'nextPost' => $nextPost,
            'related' => $related,
            'hasMultiplePosts' => $total > 1,
            'shareUrl' => Request::fullUrl(),
            'ctaImage' => self::POST_CTA_IMAGE,
        ]);
    }
}
