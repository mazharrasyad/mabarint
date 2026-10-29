# Demo video script (3:00)

Stage directions are in Indonesian; the narration (voice-over) is in English for the judges. Read at about 140 words per minute, the narration leaves room for the live Muse Spark wait.

## Tampilan situs saat ini

- **Navbar:** Mabarint (home) · Playground · Docs.
- **Docs** punya 4 tab: One sentence, Novel, News, Developers.
- **Setiap halaman demo** punya tombol **Plain / Mabarint**. Hover atau tap kata bertanda untuk melihat alasannya.
- **Playground:** tidak ada pengaturan apa pun. Pengunjung menempel teks lalu klik **Add reading marks**, dan Muse Spark menentukan sendiri jenis teksnya (story, news, atau speech/script). Semua run tampil publik di **Recent readings**.
- **Popup Guide** selalu muncul setiap kali home dibuka.

## Persiapan sebelum rekam

1. **Browser:** pakai jendela biasa (bukan incognito) di Chrome. Zoom 110–125% supaya teks terbaca di video, dan sembunyikan bookmark bar.
2. **Siapkan 5 tab** sesuai urutan:
   - `/mabarint/docs#meanings`
   - `/mabarint/docs#novel`
   - `/mabarint/docs#news`
   - `/mabarint/playground`
   - `/mabarint` (home)
   
   Tutup popup Guide di setiap tab yang memunculkannya. Di tab home, popup muncul lagi setiap kali halaman dimuat ulang, jadi tutup tepat sebelum merekam segmen terakhir.
3. **Set semua tab demo ke Plain** sebelum merekam, supaya perpindahan Plain → Mabarint terlihat di kamera.
4. **Cek Recent readings di Playground.** Daftar ini publik dan akan terlihat di video. Pastikan tidak ada teks yang tidak pantas atau bersifat pribadi. Kalau ada, minta saya menghapus barisnya dari log server sebelum merekam.
5. **Teks live:**
   - **Latihan:** pakai teks B (atau variasi lain).
   - **Rekaman:** pakai teks A.
   - Alasannya: teks yang sudah pernah dijalankan diambil dari cache. Kalau teks A dipakai saat latihan, rekaman hanya akan menampilkan "Found it among recent readings", bukan proses Muse Spark yang sesungguhnya.
6. **Kalau waktu tunggu Muse Spark (±6–10 detik) dipercepat saat editing,** beri label kecil "sped up" supaya tetap jujur.

**Teks A (rekaman):**
```
"You're late," Grandma said, not looking up from her knitting. "Again."

Tom kissed her cheek. "I brought your favourite cake."

"Hmm," she said, and finally smiled. "Then you're forgiven. Barely."
```

**Teks B (latihan):**
```
"Is anyone there?" Lena whispered, gripping the torch. Nothing answered. Then, very slowly, the door began to open.
```

---

## Alur dan narasi

### 0:00–0:20 · Hook: teks biasa kehilangan suara
**Layar:** Docs, tab **One sentence** (`/docs#meanings`), mode **Plain**. Zoom ke kalimat *"I didn't say she stole it."*

> Read this sentence: "I didn't say she stole it." How should it sound? Lean on a different word and it means something completely different. Six meanings, and on a screen they all look exactly the same. Plain text loses the voice: the tone, the sarcasm, the pause before the bad news.

### 0:20–0:50 · One sentence, many meanings (momen "wow")
**Layar:** klik **Mabarint**. Scroll pelan melewati keenam kartu. Hover pill *Stress: she* dan *Stress: it*.

> This is Mabarint. We give Meta's Muse Spark the same sentence six times, each with a different story before it. Every time, Muse Spark moves the stress to the right word: I, didn't, say, she, stole, it. And it explains why. Here: "Corrects who was accused, not Lena." The words never change. Only the reading marks do.

### 0:50–1:30 · Novel: membaca dengan telinga
**Layar:** Docs, tab **Novel** (`/docs#novel`), adegan *A Mad Tea-Party*.
1. Mulai di **Plain**, lalu klik **Mabarint**: kata tebal, jeda, garis bawah emosi, panah nada, dan tempo muncul sekaligus.
2. Hover kata **civil**, lalu kalimat Alice yang bergaris merah.

> Authors keep writing plain text. Mabarint adds reading marks, a little like tajwid in the Qur'an. One switch moves between Plain and Mabarint: stress, pauses, emotion, pitch, tempo and volume. Muse Spark reads the cues a human narrator would: the dialogue tag "said Alice angrily," the March Hare echoing her words back at her. So "civil" gets the stress, and her line gets a red anger underline. Hover any mark and you read Muse Spark's reason, written for the reader.

### 1:30–1:55 · News: emosi hanya di kutipan
**Layar:** Docs, tab **News** (`/docs#news`). Tunjukkan artikel perpustakaan: kutipan bergaris (*cried*, *finally*), narasi wartawan polos. Lalu scroll ke artikel toko roti untuk kontras emosi sedih. Jangan tampilkan kartu terakhir (contoh teks politik) supaya video tidak menyentuh topik politik.

> News works differently. The people quoted carry emotion, like the librarian who "honestly cried," but the reporter's own words stay neutral. The same engine carries joy in one story and grief in the next, without ever dramatizing the facts.

### 1:55–2:35 · Playground: siapa saja bisa mencoba
**Layar:** `/playground`.
1. Tempel **teks A**, lalu klik **Add reading marks**.
2. Tunjukkan langkah progres: *Looks like a story* → *Reading it like a narrator* → *Double-checking every mark* → *Done*.
3. Tunjukkan notifikasi hijau *"Reading marks added"*, lalu hasilnya. Hover salah satu kata bertanda.
4. Scroll ke **Recent readings**: teks A ada di paling atas dengan jam dan label *You*.
5. (Opsional, 3 detik) Buka Docs, tab **Developers**, dan tunjukkan snippet `<script>`.

> Anyone can try it. Paste any text: no settings, no sign-up. Muse Spark first works out that this is a story, not news or a speech, then reads it like a narrator. Behind these friendly steps, our engine double-checks every mark against the exact text and the reading rules, and sends mistakes back to Muse Spark to fix. Every reading is saved here, with the time and the text. For developers, it's an open format and one script tag.

### 2:35–3:00 · Peran Meta, dampak, penutup
**Layar:** `/mabarint` home, tutup popup Guide. Scroll pelan ke bagian *Who it's for*, lalu kembali ke hero: *Authors write plain text. Readers hear the voice.* dengan URL di layar.

> Muse Spark is the brain: deep reading of who speaks, what they mean and how they feel, returned as reliable structured data. We built Mabarint with Claude Code, which Meta's Model API also supports directly. It's for readers, language learners, and anyone reading aloud. Authors write plain text. Readers hear the voice.

---

## Checklist setelah rekam

- [ ] Durasi ≤ 3:00. Kalau kelebihan, potong langkah 5 di segmen Playground (Docs Developers) terlebih dahulu.
- [ ] Hanya fitur yang dibuat selama lomba yang muncul di video.
- [ ] Upload ke YouTube (unlisted) atau Loom, lalu buka link-nya di jendela incognito untuk memastikan bisa diputar.
- [ ] Isi link video di README (`(add link)`) dan di form submission.
- [ ] Potong klip 20–30 detik dari segmen "One sentence" untuk post di X (lihat [x-post.md](x-post.md)).
