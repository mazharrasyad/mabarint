# Demo video script (3:00)

Stage directions are in Indonesian; the narration (voice-over) is in English for the judges. The narration is about 360 words (about 2:35 at 140 words per minute), which leaves room for the live Muse Spark wait.

## Persiapan sebelum rekam

1. **Browser bersih:** gunakan jendela biasa (bukan incognito) di Chrome. Zoom 110–125% supaya teks terbaca di video. Sembunyikan bookmark bar.
2. **Tutup popup Guide** sekali sebelum merekam, supaya tidak menghalangi di tengah video. Popup ini selalu muncul setiap kali halaman home dibuka.
3. **Siapkan 6 tab** sesuai urutan: `/mabarint/meanings`, `/mabarint/novel`, `/mabarint/news`, `/mabarint/playground`, `/mabarint/docs`, `/mabarint` (home).
4. **Playground:** terbuka untuk umum, tanpa kode akses. Pilih profil **Novel** sebelum merekam.
5. **Teks live:**
   - **Latihan:** pakai teks B.
   - **Rekaman:** pakai teks A.
   - Alasannya, hasil yang sudah pernah dijalankan disimpan di cache. Kalau teks yang sama diulang, di video akan muncul "Loaded from cache", bukan proses Muse Spark yang sesungguhnya.
6. **Set semua halaman demo ke Plain** sebelum merekam, supaya perpindahan Plain → Mabarint terlihat di kamera.
7. **Kalau waktu tunggu Muse Spark (±6–10 detik) dipercepat saat editing,** beri label kecil "sped up" supaya tetap jujur.

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
**Layar:** `/meanings` dalam mode **Plain**. Zoom ke kalimat *"I didn't say she stole it."*

> Read this sentence: "I didn't say she stole it." How should it sound? Lean on a different word and it means something completely different. Six meanings, and on a screen they all look exactly the same. Plain text loses the voice: the tone, the sarcasm, the pause before the bad news.

### 0:20–0:50 · One sentence, many meanings (momen "wow")
**Layar:** klik **Mabarint**. Scroll pelan melewati keenam kartu. Hover pill *Stress: she* dan *Stress: it*.

> This is Mabarint. We give Meta's Muse Spark the same sentence six times, each with a different story before it. Every time, Muse Spark moves the stress to the right word: I, didn't, say, she, stole, it. And it explains why. Here: "Corrects who was accused, not Lena." The words never change. Only the notation does.

### 0:50–1:35 · Novel: membaca dengan telinga
**Layar:** `/novel`, adegan *A Mad Tea-Party*.
1. Mulai di **Plain**, lalu klik **Mabarint**: kata tebal, jeda, garis bawah emosi, panah nada, dan tempo muncul sekaligus.
2. Hover kata **civil**, lalu kalimat Alice yang bergaris merah.

> Authors keep writing plain text. Mabarint adds marks, like tajwid in Qur'anic script. One switch moves between the plain text and the Mabarint reading, with stress, pauses, emotion, pitch, tempo and volume. Muse Spark reads the cues a human narrator would: the dialogue tag "said Alice angrily," the March Hare echoing her words back at her. So "civil" gets the stress, and her line gets a red anger underline. Hover any mark and you read Muse Spark's reason, written for the reader. It works the same on Jane Austen, where every polite line has an edge.

### 1:35–2:00 · News: emosi hanya di kutipan
**Layar:** `/news`. Tunjukkan artikel perpustakaan: kutipan bergaris (*cried*, *finally*), narasi wartawan polos. Scroll ke kartu terakhir (refusal).

> News has its own profile. The people quoted carry emotion, like the librarian who "honestly cried," but the reporter's narration stays neutral. The engine enforces that rule after the model answers. And political or war stories are refused outright.

### 2:00–2:35 · Playground live + sisi developer
**Layar:** `/playground`. Tempel **teks A**, klik **Annotate with Muse Spark**.
1. Tunjukkan langkah progres: *Detected: story (novel profile)*, *Muse Spark is reading the context*, *Validating offsets, schema and reading rules*.
2. Tunjukkan notifikasi ✓ hijau, lalu hasilnya.
3. Klik tab **Mabarint JSON** dan scroll sebentar.
4. Pindah ke `/docs` dan tunjukkan snippet `<script>` di bagian 1.

> Here is a live run. No settings: Muse Spark first detects that this is a story, not news or a script. Then it reads each paragraph with the text before it as context. Then our engine checks every span: exact quotes, offsets, the schema, the stress density, and sends any errors back to Muse Spark to repair. The output is an open, offset-based JSON format. Any platform can render it with one script tag.

### 2:35–3:00 · Peran Meta, dampak, penutup
**Layar:** `/mabarint` home, bagian *How it works*. Akhiri di hero: *Authors write plain text. Readers hear the voice.* dan URL.

> Muse Spark is the brain: deep reading of who speaks, what they mean and how they feel, delivered as reliable structured output. The reasoning effort is tuned per use case. We built it with Claude Code, which Meta's Model API also supports directly. Mabarint helps every reader, language learners, and anyone reading aloud. Authors write plain text. Readers hear the voice.

---

## Checklist setelah rekam

- [ ] Durasi ≤ 3:00. Kalau kelebihan, potong bagian Jane Austen dan kalimat "reasoning effort" terlebih dahulu.
- [ ] Hanya fitur yang dibuat selama lomba yang muncul di video.
- [ ] Upload ke YouTube (unlisted) atau Loom, lalu buka link-nya di jendela incognito untuk memastikan bisa diputar.
- [ ] Isi link video di README (`_add link_`) dan di form submission.
- [ ] Potong klip 20–30 detik dari segmen "One sentence" untuk post di X (Most Viral).
