# Mabarint

> **Authors write plain text. Readers hear the voice.**

Mabarint uses Meta's Muse Spark to read the context of plain text and add tajwid-like notation for intonation and emotion (stress, elongation, pitch, pause, tempo, volume, emotion), so any digital text platform can show readers how a passage should be read.

Built during the Meta Global AI Developer Hackathon (Oct 27 - Nov 4, 2026).

## Quick start

```bash
npm install
cp .env.example .env   # fill in META_API_KEY, META_BASE_URL, META_MODEL
npm run hello
npm run annotate -- '"No," she whispered. "He was fine this morning."' novel grief
```

## License
MIT
