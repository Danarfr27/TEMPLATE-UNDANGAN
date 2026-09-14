# Wedding Invitation — Luxury Cinematic

Buka `index.html` langsung di browser.

## Struktur
- index.html
- css/style.css
- js/script.js
- images/*.svg (placeholder lokal, mudah diganti foto asli)
- audio/ambient-pulse.wav (ambient lokal untuk demo music toggle)

Halaman mencakup opening cinematic, announcement, couple, story, gallery lightbox,
event, countdown, location, RSVP, wishes/guestbook, digital gift, closing, dan footer.

## Ganti data utama
Edit `CONFIG` di `js/script.js`, terutama `weddingDate`.

Untuk foto asli:
ganti file di folder `images/` dengan JPG/WEBP/PNG menggunakan nama yang sama, atau ubah `src` di `index.html`.

Untuk lagu pernikahan:
ubah `<source src="audio/ambient-pulse.wav">` menjadi file MP3 pilihan Anda, misalnya:
`audio/wedding-song.mp3`

RSVP demo saat ini menampilkan confirmation toast dan belum mengirim ke server/database.
Form wishes dan tombol copy rekening juga berjalan sebagai interaksi lokal di browser.
