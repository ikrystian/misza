<?php
declare(strict_types=1);

/**
 * Front controller — wszystkie żądania (poza plikami statycznymi) trafiają tutaj przez .htaccess.
 */

require __DIR__ . '/app/bootstrap.php';

$router = new Router();

/* ---------- strony publiczne ---------- */
$router->get('/', [PublicController::class, 'home']);
$router->get('/gallery.html', [PublicController::class, 'gallery']);
$router->get('/aktualnosci.html', [PublicController::class, 'aktualnosci']);
$router->get('/post.html', [PublicController::class, 'post']);

/* ---------- panel administratora (HTML) ---------- */
$router->get('/admin/login', [AuthController::class, 'loginPage']);
$router->get('/admin', [AdminPagesController::class, 'dashboard']);
$router->get('/admin/gallery', [AdminPagesController::class, 'galleryPage']);
$router->get('/admin/gallery/new', [AdminPagesController::class, 'galleryFormNew']);
$router->get('/admin/gallery/{id}/edit', [AdminPagesController::class, 'galleryFormEdit']);
$router->get('/admin/news', [AdminPagesController::class, 'newsPage']);
$router->get('/admin/news/new', [AdminPagesController::class, 'newsFormNew']);
$router->get('/admin/news/{slug}/edit', [AdminPagesController::class, 'newsFormEdit']);
$router->get('/admin/content', [AdminPagesController::class, 'contentPage']);

/* ---------- API: sesja ---------- */
$router->post('/api/auth/login', [AuthController::class, 'login']);
$router->post('/api/auth/logout', [AuthController::class, 'logout']);
$router->get('/api/auth/session', [AuthController::class, 'session']);

/* ---------- API: galeria ---------- */
$router->get('/api/gallery', [GalleryController::class, 'list']);
$router->post('/api/gallery', [GalleryController::class, 'create']);
$router->put('/api/gallery/reorder', [GalleryController::class, 'reorder']);
$router->put('/api/gallery/{id}/image', [GalleryController::class, 'updateImage']);
$router->put('/api/gallery/{id}', [GalleryController::class, 'update']);
$router->delete('/api/gallery/{id}', [GalleryController::class, 'remove']);

/* ---------- API: kategorie ---------- */
$router->get('/api/categories', [CategoriesController::class, 'list']);
$router->post('/api/categories', [CategoriesController::class, 'create']);
$router->put('/api/categories/{slug}', [CategoriesController::class, 'update']);
$router->delete('/api/categories/{slug}', [CategoriesController::class, 'remove']);

/* ---------- API: aktualności ---------- */
$router->get('/api/news', [NewsController::class, 'list']);
$router->get('/api/news/{slug}', [NewsController::class, 'get']);
$router->post('/api/news', [NewsController::class, 'create']);
$router->put('/api/news/{slug}', [NewsController::class, 'update']);
$router->delete('/api/news/{slug}', [NewsController::class, 'remove']);

/* ---------- API: treść strony ---------- */
$router->get('/api/content', [ContentController::class, 'getAll']);
$router->put('/api/content/{section}', [ContentController::class, 'updateSection']);

/* ---------- API: wgrywanie zdjęć ---------- */
$router->post('/api/upload', [UploadController::class, 'uploadImage']);

try {
    Upload::assertPostNotTruncated();
    $router->dispatch(Request::method(), Request::path());
} catch (HttpError $e) {
    respondWithError($e->getMessage(), $e->status());
} catch (Throwable $e) {
    error_log('[misza] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    $message = APP_IS_PRODUCTION ? 'Błąd serwera.' : $e->getMessage();
    respondWithError($message, 500);
}

function respondWithError(string $message, int $status): void
{
    if (headers_sent()) {
        return;
    }

    if (Request::isApi()) {
        Response::json(['error' => $message], $status);
        return;
    }

    Response::text($message, $status);
}
