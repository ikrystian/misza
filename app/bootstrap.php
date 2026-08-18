<?php
declare(strict_types=1);

// katalog główny projektu (jeden poziom wyżej niż app/)
define('APP_ROOT', dirname(__DIR__));

mb_internal_encoding('UTF-8');

require APP_ROOT . '/app/Env.php';

Env::load(APP_ROOT . '/.env');

define('APP_IS_PRODUCTION', in_array(Env::get('APP_ENV', Env::get('NODE_ENV', 'production')), ['production', 'prod'], true));

ini_set('display_errors', APP_IS_PRODUCTION ? '0' : '1');
error_reporting(E_ALL);

require APP_ROOT . '/app/Http.php';
require APP_ROOT . '/app/helpers.php';
require APP_ROOT . '/app/View.php';
require APP_ROOT . '/app/DataStore.php';
require APP_ROOT . '/app/ImageService.php';
require APP_ROOT . '/app/Upload.php';
require APP_ROOT . '/app/Auth.php';
require APP_ROOT . '/app/Router.php';

require APP_ROOT . '/app/controllers/PublicController.php';
require APP_ROOT . '/app/controllers/AuthController.php';
require APP_ROOT . '/app/controllers/AdminPagesController.php';
require APP_ROOT . '/app/controllers/GalleryController.php';
require APP_ROOT . '/app/controllers/CategoriesController.php';
require APP_ROOT . '/app/controllers/NewsController.php';
require APP_ROOT . '/app/controllers/ContentController.php';
require APP_ROOT . '/app/controllers/UploadController.php';
