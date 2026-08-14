# MISZA — portfolio fotografa

Statyczna strona portfolio inspirowana motywem **Kimono** (`home-six` + `gallery-modern-col-3`):
ciemna paleta, typografia Sora / DM Sans / Playfair Display, pełnoekranowy slider
i kreatywna galeria z animacjami GSAP.

## Uruchomienie

```bash
python3 -m http.server 4173
```

Następnie otwórz `http://localhost:4173`. Serwer jest potrzebny — otwarcie plików przez
`file://` zablokuje część zasobów.

## Struktura

```
index.html      strona główna (slider, o studio, poziomy showcase, usługi, kontakt)
gallery.html    galeria 3-kolumnowa z filtrami i lightboxem
css/style.css   całość stylów (zmienne w :root)
js/app.js       warstwa wspólna: preloader, kursor, header, smooth scroll, reveal
js/home.js      slider hero, pinowany showcase, podgląd usług, liczniki
js/gallery.js   filtry (Flip), tilt 3D, lightbox
```

## Animacje

| Efekt | Gdzie |
|---|---|
| Preloader z licznikiem i odsłonięciem kurtyny | `app.js` → `runPreloader` |
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

Zależności ładowane z CDN: GSAP 3.13 (+ ScrollTrigger, Flip) i Lenis.
Gdy CDN jest niedostępny, strona degraduje się do wersji statycznej — preloader znika,
a treść pozostaje dostępna. Respektowane jest też `prefers-reduced-motion`.

## Zdjęcia

**Galeria** korzysta z prawdziwych zdjęć z `pictures/`. Obok oryginałów leżą dwa wygenerowane
warianty (ImageMagick):

```
pictures/            oryginały (do 6000 px, ~14 MB razem)
pictures/thumbs/     miniatury do siatki, dłuższy bok 1000 px (~930 KB razem)
pictures/large/      wersje do lightboxa, dłuższy bok 2000 px (~3,5 MB razem)
```

Regeneracja po dorzuceniu nowych plików:

```bash
cd pictures && for f in *.jpg; do magick "$f" -auto-orient -strip -resize '1000x1000>' -quality 82 -interlace Plane "thumbs/$f"; magick "$f" -auto-orient -strip -resize '2000x2000>' -quality 86 -interlace Plane "large/$f"; done
```

Nowy kafel w `gallery.html` wygląda tak — **atrybuty `width`/`height` muszą odpowiadać
wymiarom miniatury**, bo z nich wynikają proporcje kadru i rezerwacja miejsca przed wczytaniem:

```html
<figure class="card" data-cat="koncerty">
  <a class="card__media" href="pictures/large/plik.jpg" data-cursor="Podgląd">
    <img src="pictures/thumbs/plik.jpg" width="1000" height="563" alt="Opis" loading="lazy">
  </a>
  <figcaption><h3>Tytuł</h3><span>Koncert</span></figcaption>
</figure>
```

Miniatury zachowują **oryginalne proporcje** i pełne kolory — układ masonry (`js/gallery.js`
→ `layoutMasonry`) liczy `grid-row-end: span N` z rzeczywistej wysokości kafla, więc kolumny
domykają się bez dziur. `ResizeObserver` przelicza spany po zmianie szerokości, dociągnięciu
fontu czy zawinięciu tytułu. Bez JS siatka degraduje się do zwykłych trzech kolumn.

**Strona główna** korzysta z tych samych zdjęć — bez placeholderów i bez `grayscale`:

| Sekcja | Wariant | Uwagi |
|---|---|---|
| Hero (4 slajdy) | `large/` | pełny ekran, `object-fit: cover` |
| O studio (2) | `large/` | kadry 3:4 i 4:5, użyte zdjęcia pionowe → minimalne przycięcie |
| Showcase (5) | `thumbs/` | pełne kadry, stała wysokość, szerokość z proporcji |
| Podgląd usług (4) | `thumbs/` | `data-img` na `.svc__row` |
| Instagram (6) | `thumbs/` | kwadratowy kadr, jak w siatce IG |
| Tło CTA | `large/` | przyciemnione, parallax |

Poziomy showcase nie przycina zdjęć: wysokość jest stała
(`clamp(300px, 54vh, 540px)`), a szerokość kafla wynika z proporcji obrazka. Poniżej 900 px
zamienia się to na stałą szerokość i naturalną wysokość, żeby kadr 16:9 mieścił się w ekranie.

## Dostosowanie

Kolory i typografia siedzą w zmiennych CSS na górze `css/style.css`:

```css
--bg:#151515;  --accent:#c8a97e;  --text:#ddd;
--f-ui:'Sora';  --f-head:'DM Sans';  --f-serif:'Playfair Display';
```

Kategorie filtrów w galerii wynikają z `data-cat` na `.card` i `data-filter` na `.filter` —
liczniki przy nazwach (`<sup>`) są wpisane ręcznie. Aktualnie: koncerty (3), portret (2),
reportaż (2), street (2), natura (1).
