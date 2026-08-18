# MISZA — portfolio fotografa

Strona portfolio inspirowana motywem **Kimono** (`home-six` + `gallery-modern-col-3`):
ciemna paleta, typografia Sora / DM Sans / Playfair Display, pełnoekranowy slider
i kreatywna galeria z animacjami GSAP.

Strony publiczne są renderowane po stronie serwera (Express + EJS) na podstawie danych
z `data/*.json`, a całą treścią — galerią, kategoriami, aktualnościami i sekcjami strony
głównej — zarządza się przez panel administratora pod `/admin`.

Repozytorium zawiera **dwie równoważne implementacje serwera** działające na tych samych
danych, szablonach treści i tym samym froncie:

- **Node.js + Express + EJS** (`server/`, `views/`) — do pracy lokalnej,
- **PHP** (`index.php`, `app/`) — do uruchomienia na shared hostingu, patrz
  [Wersja PHP](#wersja-php--shared-hosting).

## Uruchomienie

```bash
npm install
cp .env.example .env
npm run hash-password   # wygeneruj hash hasła administratora i wklej do .env jako ADMIN_PASSWORD_HASH
```

W `.env` uzupełnij też `ADMIN_USERNAME` i `SESSION_SECRET` (losowy długi ciąg znaków, np.
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).

```bash
npm run dev     # z auto-restartem (nodemon)
# albo
npm start        # produkcyjnie, np. pod systemd/pm2
```

Następnie otwórz `http://localhost:4173`. Panel administratora jest pod `/admin/login`.

## Struktura

```
server/                serwer Express
  app.js                konfiguracja, middleware, montowanie tras
  index.js               punkt wejścia (nasłuchuje na PORT)
  config/env.js           wczytywanie i walidacja .env
  middleware/              auth (requireAuth), upload (multer)
  routes/                   /api/* (CRUD), /admin/* (panel), strony publiczne
  controllers/               logika tras
  services/                   dataStore (odczyt/zapis JSON), imageService (sharp), slugify
views/                  szablony EJS
  index.ejs, gallery.ejs, aktualnosci.ejs, post.ejs    strony publiczne
  partials/                                              head/header/footer, wspólne dla stron
  admin/                                                 panel administratora
data/                   treść strony jako JSON (jedyne źródło prawdy)
  gallery.json, categories.json, news.json, site-content.json
public/admin/           statyczny CSS/JS panelu administratora
scripts/                skrypty pomocnicze (migracja, hash hasła, masowa regeneracja miniatur)
css/style.css           style strony publicznej (zmienne w :root)
js/app.js               warstwa wspólna: preloader, kursor, header, smooth scroll, reveal
js/home.js              slider hero, pinowany showcase, podgląd usług, liczniki
js/gallery.js           filtry (Flip), tilt 3D, lightbox
pictures/thumbs/        miniatury (1000px), generowane automatycznie przez panel
pictures/large/         wersje do lightboxa (2000px), generowane automatycznie przez panel
```

## Panel administratora

Pod `/admin` (login: `ADMIN_USERNAME` / hasło ustawione przy `npm run hash-password`):

- **Galeria** (`/admin/gallery`) — dodawanie/edycja/usuwanie zdjęć, zmiana kolejności
  przeciąganiem, zarządzanie kategoriami (liczniki przeliczają się automatycznie).
- **Aktualności** (`/admin/news`) — CRUD wpisów, edytor treści blokowej (akapity/cytaty).
- **Treść strony** (`/admin/content`) — edycja sekcji strony głównej: hero, o studio,
  wybrane kadry, usługi, kontakt (CTA), Instagram, stopka.

Każde wgrane zdjęcie automatycznie dostaje warianty `thumbs/` (1000px, jakość 82) i
`large/` (2000px, jakość 86) — generowane przez `sharp`, z tymi samymi parametrami co
dawny ręczny pipeline ImageMagick. Stare warianty są usuwane przy podmianie lub kasowaniu
zdjęcia.

Jeśli zdjęcia trafią do `pictures/` z pominięciem panelu (ręcznie, po podfolderach
kategorii), warianty można przeliczyć zbiorczo:

```bash
npm run images:regenerate
```

## Wersja PHP — shared hosting

Port 1:1 wersji node'owej: te same adresy URL, ten sam HTML, te same pliki `data/*.json`,
niezmieniony front (`css/`, `js/`) i panel administratora. Bez Composera i bez zależności
zewnętrznych — wystarczy wgrać pliki na FTP.

### Wymagania hostingu

| Element | Wymaganie |
|---|---|
| PHP | 8.0 lub nowszy |
| Apache | `mod_rewrite` (przekierowanie na `index.php`) |
| Rozszerzenia | `gd` **albo** `imagick` (skalowanie zdjęć), `mbstring`, `json`, `session` |
| Opcjonalnie | `exif` — obrót zdjęć wg orientacji z aparatu, `fileinfo` — kontrola typu pliku |

### Co wgrać na serwer

Do katalogu głównego domeny (`public_html`, `htdocs` itp.):

```
index.php  .htaccess  .user.ini  .env
app/  data/  css/  js/  public/  pictures/
```

**Nie wgrywaj** `node_modules/`, `server/`, `views/`, `scripts/`, `package*.json` —
to część wersji node'owej i na hostingu jest zbędna.

### Konfiguracja

1. Skopiuj `.env.example` do `.env` i uzupełnij `ADMIN_USERNAME`.
2. Wygeneruj hash hasła i wklej go jako `ADMIN_PASSWORD_HASH`:

```bash
php tools/hash-password.php
```

   Hash wygenerowany wcześniej przez `npm run hash-password` też zadziała — bcrypt jest
   wspólny dla obu wersji.
3. Ustaw `APP_ENV=production` (wyłącza pokazywanie komunikatów błędów w przeglądarce).
4. Nadaj prawa zapisu katalogom `data/`, `pictures/thumbs/` i `pictures/large/`
   (zwykle `755`, na części hostingów `775`).

Panel administratora znajduje się pod `/admin/login`.

### Uruchomienie lokalne

```bash
php -S localhost:8080 -t . tools/dev-server.php
```

`tools/dev-server.php` zastępuje `.htaccess` na czas pracy lokalnej — na hostingu nie jest używany.

### Struktura

```
index.php               front controller — mapowanie adresów na kontrolery
.htaccess               przekierowanie na index.php + blokada plików konfiguracyjnych
.user.ini               limity uploadu (25 MB) dla PHP w trybie CGI/FPM
app/
  bootstrap.php           wczytanie konfiguracji i klas
  Env.php                  odczyt .env (odpowiednik dotenv)
  Http.php                  Request / Response / HttpError
  Router.php                 router + ochrona tras /admin i /api
  Auth.php                    sesja administratora, bcrypt, kontrola CSRF
  DataStore.php                odczyt/zapis data/*.json pod blokadą pliku
  ImageService.php              warianty zdjęć przez Imagick lub GD (odpowiednik sharp)
  Upload.php                     walidacja wgrywanych plików (odpowiednik multera)
  helpers.php                     funkcje szablonów (escapowanie, slugify, daty po polsku)
  View.php                         renderowanie szablonów
  controllers/                      logika tras
  views/                             szablony PHP (odpowiedniki plików .ejs)
tools/hash-password.php  generator hasha hasła (CLI)
tools/dev-server.php     router wbudowanego serwera PHP (tylko lokalnie)
```

### Różnice względem wersji node'owej

- **Metoda `PUT` z plikiem** — PHP nie parsuje ciała `multipart/form-data` dla `PUT`,
  więc `public/admin/admin.js` wysyła takie żądania jako `POST` z polem `_method=PUT`,
  a serwer tłumaczy je z powrotem. Pozostałe trasy API działają bez zmian.
- **Limit uploadu** — zamiast limitu multera obowiązują `upload_max_filesize`
  i `post_max_size` z `.user.ini`. Jeśli hosting używa mod_php, ustaw je w panelu hostingu.
- **Podświetlenie aktywnej pozycji w menu** — wersja EJS escapowała atrybut `class`
  (`class=&#34;is-active&#34;`), przez co podświetlenie nie działało; w PHP jest poprawne.
- **Liczniki kategorii w panelu** — pokazują się od razu przy pierwszym renderze
  (wcześniej do czasu odświeżenia listy widniało „undefined”).

## Animacje

| Efekt | Gdzie |
|---|---|
| Podążający kursor z etykietą (`data-cursor="…"`) | `app.js` → `initCursor` |
| Nagłówki dzielone na linie w maskach (`data-split`) | `app.js` → `splitLines` |
| Reveal obrazów maską clip-path (`.reveal-img`) | `app.js` → `initReveals` |
| Parallax (`data-parallax="-60"`) | `app.js` → `initReveals` |
| Marquee reagujący na kierunek scrolla | `app.js` → `initMarquee` |
| Slider hero: clip-path + Ken Burns + autoplay | `home.js` |
| Pinowana sekcja z poziomym przewijaniem | `home.js` → `gsap.matchMedia` |
| Podgląd zdjęcia przy kursorze na liście usług | `home.js` |
| Filtrowanie galerii z animacją układu (Flip) | `gallery.js` |
| Masonry w oryginalnych proporcjach zdjęć | `gallery.js` → `layoutMasonry` |
| Tilt 3D kafli + lightbox z przejściem z miniatury | `gallery.js` |

Zależności ładowane z CDN: GSAP 3.13 (+ ScrollTrigger, Flip) i Lenis. Strony renderowane
są po stronie serwera z identycznym markupem co wcześniej w statycznych plikach HTML —
dzięki temu cały ten JS działa bez zmian, tak jakby DOM był tam od zawsze. Gdy CDN jest
niedostępny, strona degraduje się do wersji statycznej. Respektowane jest też
`prefers-reduced-motion`.

## Model danych

- `data/gallery.json` — zdjęcia galerii: `{ id, category, title, alt, file, width, height, order }`.
- `data/categories.json` — kategorie filtrów: `{ slug, label, order }` (liczniki liczone w locie).
- `data/news.json` — wpisy aktualności: `{ slug, status: 'draft'|'published', category, date, title, excerpt, readTime, image, imageAlt, content: [{type: 'p'|'quote', text}] }`.
- `data/site-content.json` — sekcje strony głównej (hero, about, showcase, services, cta,
  instagram, footer).

`file`/`image` to nazwa pliku wspólna dla `pictures/thumbs/<plik>` i `pictures/large/<plik>`.

## Dostosowanie

Kolory i typografia siedzą w zmiennych CSS na górze `css/style.css`:

```css
--bg:#151515;  --accent:#c8a97e;  --text:#ddd;
--f-ui:'Sora';  --f-head:'DM Sans';  --f-serif:'Playfair Display';
```
