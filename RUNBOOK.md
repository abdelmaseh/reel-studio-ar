# RUNBOOK — دليل الإنتاج الكامل

Egyptian Arabic first, English summary under each section. Follow it top to bottom and a
finished reel comes out the other end: 1080x1920, 60fps container (default, override with --fps), H.264+AAC, under 14 MB.

---

## 0. التثبيت | Install

```bash
./INSTALL.sh
```

بيركّب كل حاجة: npm packages (Remotion 4.0.547 + @remotion/motion-blur + media-utils)،
بينسخ الموديولات المنقولة لـ `template/src/vendor/`، بينزّل خط Tajawal، وبيكلون مكتبة
المؤثرات (438 ملف CC0). آمن يتعاد تشغيله. البيئة بتمسح /home بين الجلسات، فالستوديو كله
عايش تحت /downloads (أو جوه الريبو لو رفعته) — لو لقيت حاجة ناقصة: شغّل INSTALL تاني.

One command installs everything (deps, vendored modules, Cairo + Tajawal + alternates, the SFX pack).
Idempotent — re-run it whenever the environment was wiped.

---

## 1. خطة الشوتات قبل الكود | Shot list first

قبل ما تكتب أي كود اعمل جدول: رقم الشوت · من-لـ (ثواني) · المشاهد بيشوف إيه · الكاميرا ·
العنصر البطل · الفيزيكا/الإفكت · الضربة الصوتية. القواعد:

- الهوك في أول ثانية: حركة غير متوقعة أو سؤال. ممنوع لوجو بيظهر بفيد.
- فكرة واحدة جديدة كل 1.5-3 ثواني.
- كل شوت ليه بطل واحد، الباقي يدعمه أو يتعتم/يتبلر.
- خطط للـ money shot واديله slow motion أو لحظة وقفة.
- التوقيتات كلها من ملف الصوت (الفويس أوفر هو الماستر كلوك). اعمل Whisper pass على
  الفويس أوفر وخد توقيتات الكلمات (word timings) — هي اللي بتحرك القص والكابشن.

Write the shot table before code: hook in the first second, one idea per 1.5-3s, one hero
per shot, the voiceover is the master clock (Whisper word timings drive cuts and captions).

---

## 2. بنك الحركات — انضباط الاختيار | Moves discipline

`vendor/video-ad-editor/moves/catalog.json` فيه 108 حركة متوثقة بالطاقة (energy 1-3)
والعائلة (calm / punch / onetake / editorial) واللحظات (cues: price, cta, reveal...).

القاعدة لكل فيديو:
1. اختار **3 حركات أساسية بس** (كابشن + انتقال + حركة كاميرا/كرت) من عائلة واحدة تحسسك
   بمود واحد متسق.
2. ضيف **لهجات (accents)** للحظات الخاصة بس (سعر، CTA، reveal).
3. سجّل اللي استخدمته عشان الفيديو الجاي ميطلعش نسخة.

Pick 3 core moves from one family plus accents for special cues. Log what you used so the
next reel doesn't repeat it.

---

## 3. الفيزيكا والكاميرا | Physics and camera

المرجع الكامل: `vendor/cinematic-motion/physics-motion.md` و `cinematography-montage.md`.
اللي ميتكسرش:

- الجاذبية حقيقية: سقوط بتسارع ثابت، مش ease-in عادي.
- كل ارتداد بيفقد طاقة (restitution)، وكل ارتداد أقل من اللي قبله بنفس النسبة.
- anticipation → action → overshoot → settle. مفيش وقفة روبوت.
- squash & stretch بحجم ثابت، contact shadow بيكبر ويفتح ويبلى كل ما الجسم يطير.
- الكاميرا مبتقفش ساكنة أكتر من ثانية: push-in بطيء، parallax، اهتزاز يد خفيف.
- الـ money shot عليه time remap ناعم.

Real gravity, energy-losing bounces, anticipation/overshoot/settle, contact shadows that
scale with height, a camera that never sits still, smooth time remap on the money shot.

---

## 4. الموشن بلور | Motion blur

الطريقة الأساسية: `@remotion/motion-blur` عن طريق الموديول المنقول:

```tsx
import {CameraBlur, Smear} from '../vendor/reel-studio/core/mblur';
<CameraBlur shutter="film180"> ...moving subtree... </CameraBlur>   // بلور كاميرا حقيقي
<Smear shutter="film180"> ...fast element... </Smear>                // سمير/تريل للعناصر السريعة
```

- `WhipPan` بيحسب السرعة وبيشغل البلور المناسب لوحده.
- shutter presets: `crisp90 / film180 / smear270 / open360`.

**Fallback موثق** لو المكتبة ما اشتغلتش في بيئة: ريندر الكومب على 200 فريم واعمل متوسط
كل 4 فريمات متتالية (50fps × 4 subframes) بفلتر ffmpeg `tmix=frames=4` — نفس النتيجة
بس أغلى ريندرًا. (اتجربت قبل كده وشغالة.)

Primary: the vendored mblur wrappers (verified working in this environment). Documented
fallback: render at 200fps and average each 4 consecutive frames with ffmpeg tmix.

---

## 5. الكابشن العربي | Arabic captions

المكوّن: `template/src/captions/TajawalCaptions.tsx`. بياخد كلمات بتوقيتات Whisper
`{text, start, end}` (ثواني) وبيطلع كابشن RTL كلمة-كلمة: الكلمة اللي بتتقال بتتكبر
وبتتظلل، والكشيدة بتتمدد عليها في مكان قانوني بس (مش بعد ا د ر ز و ة، مش جوه لام-ألف،
مش على أطراف الكلمة).

```tsx
<TajawalCaptions words={words} kashida={2} bottom={430} />
```

- خلي الكابشن بعيد عن واجهة المنصات: سيب ~250px فوق و ~350px تحت.
- ممنوع letter-spacing على العربي، وممنوع أنيميشن حرف-حرف (بيكسر الاتصال) — كلمة-كلمة بس.
- **البوابة**: `node scripts/qa-gate.mjs out.mp4 --captions captions.json` بيفشل التسليم
  على: حروف مقطوعة الاتصال، presentation forms، تطويل على طرف كلمة، ZWJ جوه كلمة.

Per-word Tajawal captions from Whisper timings, legal-slot kashida on the spoken word,
no letter-spacing, no per-letter animation, platform safe areas, and a hard lint gate.

**فحص توقيت الكابشن (جديد):** البوابة بتفشل التسليم لو الكلمات متداخلة أو مش مترتبة أو مدتها صفر أو الكابشن بيعدي نهاية الفيديو، وبتنبّه (needs-review) لو كلمة أقل من 0.12 ثانية أو السرعة أكتر من 4.5 كلمة/ثانية أو فيه فجوة أكتر من 1.5 ثانية. الضبط: `--min-word-sec` و `--max-words-per-sec`. اختبار ذاتي: `npm run qa:selftest`.

New caption timing lint: fails on overlap, out-of-order, zero-duration, captions past the video end; flags too-fast words, high reading speed and long gaps. Self-test: `npm run qa:selftest`.

---

## 6. الانتقالات | Transitions

منقولة من reel-studio transitions-v4 (Apache-2.0):

| الانتقال | الاستخدام |
|---|---|
| `page-turn` | قلب صفحة كتاب عربي (يمين لشمال) — الديفولت السينمائي |
| `ink-slab` | بلاطة حبر بتغطي — فخم، ديفولت ستايل gold |
| `lens-zoom` | عدسة زجاج بتكبر جزء من المشهد القديم وتفتح على الجديد (بيحتاج outgoing + outgoingLens) |
| `iris` | دايرة بتفتح من نقطة |
| `dot-zoom` | غوص أسي جوه دايرة — طاقة، ديفولت pop |
| `zoom-through` | دخول بتكبير وبلور بيصفى — نضيف، ديفولت minimal |
| `blinds` | شرايح ميكانيكية — خام، ديفولت vhs |
| `WhipPan` + `LightScan` | ويب بان ببلور تلقائي ولمعة ضوء على الكروت |

نوعين: **overlay** (زي page-turn بيتتركب فوق القطع) و **entrance** (الباقي: بياخد المشهد
الجاي كـ children ويكشفه بنفسه). بص على `StyleTransition` في الديمو كمرجع للتوصيل.

Overlay transitions sit on top of the cut; entrance transitions wrap the incoming scene
as children. See `StyleTransition` in the demo.

---

## 7. الستايلات | Styles

خمسة ستايلات جاهزة في `template/src/styles.ts` — التبديل بثابت واحد `ACTIVE_STYLE`
أو `defaultProps: {styleName}` على الكومبوزيشن:

| الاسم | الوصف |
|---|---|
| `cinematic` | سينمائي غامق تيل/أورانج — الشكل الافتراضي البريميوم |
| `gold` | فخامة دهبي/أسود — عقارات وبراندات غالية |
| `minimal` | فاتح نضيف — تك وSaaS وعروض أسعار |
| `pop` | بوب صاخب ألوان قوية — عروض وترندات |
| `vhs` | جريتي VHS/بروتاليست — للهوك وأول ثانيتين |

كل ستايل بيحدد: البالت، شكل الكابشن والهايلايت، الانتقال الافتراضي، الجرين والفينيت،
ونكهة المؤثرات (أسماء من `assets/sfx/catalog.json`).

---

## 8. المؤثرات الصوتية | SFX

مكتبة 408 مؤثر CC0 في `assets/sfx/sounds/<category>/` والفهرس `assets/sfx/catalog.json`
(اسم، تصنيف، مدة، تاجز، وصف). خلطة التسليم بملف mix spec: سطر لكل مؤثر
`ملف|بداية_بالثانية|الشدة` وبعدين:

```bash
bash scripts/render-reel.sh <Comp> <frames> out.mp4 --voiceover vo.mp3 --mix mix.txt
```

الشدة المجربة: مؤثرات 0.3-0.6 تحت الفويس، alimiter 0.94 على الخلطة. خطط الصوت: ووش قبل
الحركة، impact على الضربة، riser قبل الـ reveal، وربع ثانية سكوت قبل الـ money shot.

Mix spec lines `file|startSec|volume`, SFX at 0.3-0.6 under voiceover, limiter on the bus,
whoosh before moves, impact on hits, riser before reveals, silence before the money shot.

---

## 9. B-roll | سحب لقطات حقيقية

```bash
node scripts/broll-fetch.mjs "coffee pour" --n 3 --out work/broll           # Coverr (ديفولت، ببلاش مفتاح)
node scripts/broll-fetch.mjs "cairo street" --n 2 --source mixkit           # Mixkit (بيقيّد المعدل أحيانًا 429 — السكريبت بيعيد المحاولة)
export PEXELS_API_KEY=...   # مفتاح مجاني من pexels.com/api — وبعدين --source pexels
export PIXABAY_API_KEY=...  # مفتاح مجاني من pixabay.com/api/docs — وبعدين --source pixabay
```

- بيكتب manifest لكل لقطة: المصدر + اللينك + الترخيص (كلها تجاري مجاني بلا نسب).
- كلمات إنجليزي بتجيب نتايج أحسن بكتير — ترجم العربي الأول.
- اللقطات غالبًا أفقية: للريل اعمل كروب رأسي `crop=608:1080` أو scale+crop، ودريدها
  لنفس اللوك (teal/orange للسينمائي) عشان الخلط يبقى مقصود.

Fetches free stock clips with a per-clip license manifest. Coverr keyless by default,
Mixkit with 429 backoff, Pexels/Pixabay with free API keys. English keywords win; crop
vertical and grade footage to the reel's look.

---

## 10. الريندر والتسليم | Render and delivery

البيئة CPU واحدة — ريندر متسلسل على شُقف (chunks) وبعدين دمج:

```bash
bash scripts/render-reel.sh Demo 250 out.mp4 --max-mb 14   # add --voiceover/--mix when you have audio
```

السكريبت بيعمل: ريندر متسلسل concurrency=1 → concat → خلط الصوت → تحويل الكونتينر لـ
60fps (الافتراضي، و`--fps 200` لو عايز 200) → ضغط تحت 14 ميجا (2-pass لو لزم). الكومب نفسه 50fps؛ البلور متخبط في الفريمات
فالتحويل لـ 60 (أو 200) ما بيخسرش حاجة.

**وبعدين إجباري:**
1. `node scripts/qa-gate.mjs out.mp4 --captions captions.json --expect-video-sec <N> --expect-audio --max-mb 14`
   — بيفحص: الأبعاد، الفريم ريت، المدة، الحجم، فك الترميز كامل، فريمات سودا/مجمدة،
   قمة الصوت، ولينت العربي. البوابة بتفشل = مفيش تسليم.
2. شوف الفريمات بعينك: اطلع 8-12 فريم (منهم فريمات الضربات والانتقال) واتأكد من
   الظلال والقراية والأمان. اعمل contact sheet.
3. عدي على `vendor/cinematic-motion/quality-checklist.md` قبل ما تسلّم.

Sequential chunked renders (1 CPU), concat, audio mix, 60fps conform (default; --fps overrides), size compress,
then the QA gate and a human eyeball pass on extracted frames. The gate fails = no delivery.

---

## 11. حل المشاكل | Troubleshooting

- **الخط العربي طالع مقطوع**: شغّل qa-gate بالكابشن — غالبًا ZWJ أو presentation form.
- **الريندر واقف**: قلل `--chunk` (مثلا 50) وشغّل تاني؛ البيئة بتمسح /tmp أحيانًا.
- **الفيديو أكبر من 14 ميجا**: render-reel بيعمل 2-pass لوحده؛ لو لسه، قلل CRF للصورة أو مدة.
- **@remotion/motion-blur مش شغال في بيئة جديدة**: طبّق fallback في سكشن 4 وسجّلها.
- **مكتبة SFX ناقصة**: `./INSTALL.sh` بيكلونها تاني.

---

## 3D — ستايل ثري دي | The "3d" style

`StyleName` = `'3d'` في `template/src/styles.ts` (طاقة البوب: بنفسجي/وردي/أصفر، بس بعمق حقيقي).
الأدوات في `vendor/reel-studio/kits/depth3d.tsx` (CSS 3D بس، من غير WebGL، offline، كل حاجة دالة في الفريم):

- `Stage3D`: مشهد بمنظور وكاميرا بتدور ببطء + push-in. أي حاجة جواه بتاخد parallax تلقائي.
- `Layer z`: طبقة على عمق z. `focusZ` + `dof` = بلور عمق الميدان كل ما الطبقة تبعد عن الفوكس.
- `Slab3D`: كرت بسمك حقيقي (وجه أمامي + جوانب مبثوقة + حافة ضوء).
- `Cube3D` / `Sphere3D` / `Ring3D`: عناصر طايرة مضاءة.
- `ContactShadow`: ضل ناعم على الأرض بيكبر ويبهت ويبلر مع الارتفاع.
- `Text3D`: نص مبثوق بسمك (طبقات text-shadow لنفس الحروف، فالاتصال العربي سليم). ممنوع letter-spacing وممنوع تحريك حرف-حرف.

مثال كامل: `template/src/demo/Demo3D.tsx` (7 مشاهد على توقيتات الفويس أوفر في `timings3d.json`).
`npx remotion render src/index.ts Demo3D ...` أو `scripts/render-reel.sh Demo3D <frames> out.mp4 --voiceover vo.wav --mix mix.txt`.

Rules: one CameraBlur only on fast entrances (`enabled` window), not on the whole reel (each blurred
subtree re-renders per sample). Don't wrap flex layouts in WhipPan. Keep captions in the bottom safe area.

English: depth kit = perspective stage with orbiting camera, z-layers with DOF blur, extruded slabs,
lit cubes/spheres/rings, contact shadows, extruded Arabic text. Pure CSS 3D, deterministic per frame.

---

## الخطوط والتايبوجرافي العربي | Arabic typography

الافتراضي دلوقتي **Cairo** (OFL، variable 200-1000) بدل Tajawal: وزن Black حقيقي للعناوين، تطويل (كشيدة) بيتوصل
نضيف، وتشكيل متراص صح (فتحة/ضمة/شدة فوق وتحت من غير ما تتداخل). Tajawal فاضل fallback.
الكود: `template/src/fonts.tsx` (`<Fonts/>` بيحمّل الخطوط ويقفل الريندر لحد ما تتفك، و`ARABIC_FONT`).
`TajawalCaptions` بياخد `fontFamily` و`fontWeight` (الافتراضي Cairo 900).

اللي اتغيّر عشان الشكل يطلع أحسن في الفيديو:
- `font-feature-settings: ccmp, locl, calt, liga, rlig, mark, mkmk, kern` شغّالة (التشكيل والربط السياقي).
- `text-rendering: geometricPrecision` + `font-kerning: normal`، وارتفاع سطر 1.45 للكابشن عشان التشكيل يلاقي مكان.
- الكشيدة (`stretchWord`) بتتحط قبل علامات التشكيل مش بينها، متجربة على مُحَمَّدٌ / الْكَلِمَةَ / كَتَبَ.
- بدائل متنزلة بـ INSTALL: IBM Plex Sans Arabic Bold (`ARABIC_FONTS.plex`) للنص الرسمي، وAlmarai ExtraBold (`ARABIC_FONTS.almarai`).
  اتقارنوا على نفس الجمل: Cairo أقوى في العناوين والكابشن، Plex أهدى للفقرات، Almarai نضيف لكن أضيق.

English: default face is now Cairo (variable, true Black weight, clean tatweel, correct tashkeel stacking), with
Tajawal as fallback; OpenType Arabic features (ccmp/calt/liga/mark/mkmk) and geometricPrecision rendering are on;
captions get 1.45 line height for diacritics; Plex Sans Arabic and Almarai are installed as alternates.
