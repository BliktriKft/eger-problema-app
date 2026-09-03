-- Eger Város Probléma Térkép — Seed data (institutions + problems)
-- Futtasd a Supabase Dashboard → SQL Editor → New query menüben.
-- A 0001_init migration már létrehozta a táblákat és a PostGIS extension-t.
-- A problémák táblájában van egy "location geography(Point, 4326)" oszlop,
-- amit külön kell kitölteni a lat/lng koordinátákból.

-- ============================================================================
-- 1. INTÉZMÉNYEK (Institution catalog, 20 db)
-- ============================================================================

INSERT INTO public.institutions (id, name, type, address, latitude, longitude, "officialUrl", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Egri Dobó István Gimnázium', 'school', 'Széchenyi István utca 19.', 47.9030, 20.3780, 'https://www.dig.hu', NOW(), NOW()),
  (gen_random_uuid(), 'Egri Balassi Bálint Általános Iskola', 'school', 'Balassi Bálint utca 2.', 47.8985, 20.3700, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Eszterházy Károly Katolikus Egyetem', 'school', 'Eszterházy tér 1.', 47.8988, 20.3744, 'https://www.uni-eszterhazy.hu', NOW(), NOW()),
  (gen_random_uuid(), 'Markhot Ferenc Oktatókórház', 'hospital', 'Markhot Ferenc utca 1-3.', 47.9056, 20.3780, 'https://www.mfkh.hu', NOW(), NOW()),
  (gen_random_uuid(), 'Egri Rendelőintézet', 'hospital', 'Kossuth Lajos utca 13.', 47.9022, 20.3755, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Bitskey Aladár Uszoda', 'pool', 'Törvényház utca 4.', 47.8974, 20.3810, 'https://www.bitskey-uszoda.hu', NOW(), NOW()),
  (gen_random_uuid(), 'Termál Strand (Eger)', 'pool', 'Petőfi tér 2.', 47.9010, 20.3850, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Bródy Sándor Megyei és Városi Könyvtár', 'library', 'Kossuth Lajos utca 18.', 47.9028, 20.3738, 'https://www.brody.hu', NOW(), NOW()),
  (gen_random_uuid(), 'Egri Főegyházmegyei Könyvtár', 'library', 'Eszterházy tér 1.', 47.8987, 20.3745, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Eger Megyei Jogú Város Polgármesteri Hivatal', 'government', 'Dobó István tér 2.', 47.9029, 20.3772, 'https://www.eger.hu', NOW(), NOW()),
  (gen_random_uuid(), 'Heves Megyei Kormányhivatal', 'government', 'Kossuth Lajos utca 9.', 47.9025, 20.3745, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Egri Járási Hivatal', 'government', 'Mindszenty József utca 4.', 47.9045, 20.3750, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Egri Szimfonikus Zenekar', 'other', 'Széchenyi István utca 27.', 47.9015, 20.3790, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Gárdonyi Géza Színház', 'other', 'Hatvani kapu tér 4.', 47.9030, 20.3810, 'https://www.gsz.hu', NOW(), NOW()),
  (gen_random_uuid(), 'Egri Bazilika (minor bazilika)', 'other', 'Pyrker János tér 1.', 47.8988, 20.3760, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Egri Vár', 'other', 'Vár köz 1.', 47.8995, 20.3785, 'https://www.egrivar.hu', NOW(), NOW()),
  (gen_random_uuid(), 'Sportcsarnok (Balassi út)', 'other', 'Balassi Bálint út 3.', 47.8945, 20.3680, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Egri Városi Sporttelep', 'other', 'Mátyás király út 53.', 47.8905, 20.3715, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Egri Piac (nagybani + kiskereskedelmi)', 'other', 'Rákóczi út 8.', 47.9055, 20.3790, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Líceum (Egri Érseki Palota)', 'other', 'Eszterházy tér 1-3.', 47.8988, 20.3745, NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. PROBLÉMÁK (Problems, 50 db Eger belvárosában)
-- A "location" mezőt (PostGIS geography) külön töltjük ki a lat/lng-ből.
-- A "createdBy" mező egy placeholder UUID lesz (a vote RLS policy-k miatt
-- Supabase auth user kellene, de a seed user a DB INSERT-nél is átmegy).
-- ============================================================================

INSERT INTO public.problems (id, title, description, category, status, "institutionId", latitude, longitude, "createdBy", "createdAt", "updatedAt", score)
VALUES
  (gen_random_uuid(), 'Nagy kátyú a Kossuth utcán', 'A Kossuth Lajos utca 12. szám előtt egy 30 cm átmérőjű, 10 cm mély kátyú keletkezett, amely már több autónak okozott sérülést. Sürgős javítás szükséges.', 'infrastructure', 'open', NULL, 47.9025, 20.3772, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 12),
  (gen_random_uuid(), 'Nem működik a közvilágítás a Kertész utcában', 'A Kertész utca teljes hosszában 3 napja nem működnek a lámpaoszlopok. Éjszaka balesetveszélyes a gyalogosforgalom.', 'infrastructure', 'investigating', NULL, 47.9050, 20.3810, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day', 4),
  (gen_random_uuid(), 'Elhagyatott bicikli a főtér sarkán', 'A Dobó István tér 4. számú ház előtt 2 hete áll egy kidobott, lánc nélküli bicikli. Akadályozza a gyalogosforgalmat.', 'public_safety', 'open', NULL, 47.9010, 20.3750, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', -1),
  (gen_random_uuid(), 'Szemetes a Szépasszony-völgyben túlcsordult', 'A Szépasszony-völgyi pincesor felső végén lévő közterületi szemetes 1 hete nem ürített, teljesen tele van, a szél szétszórja a szemetet.', 'environment', 'open', NULL, 47.8990, 20.3700, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', 7),
  (gen_random_uuid(), 'Iskolai bejárat akadálymentesítése', 'A Balassi Bálint Általános Iskolánál nincs akadálymentes rámpás bejárat a kerekesszékeseknek. Több szülő jelezte, hogy ez problémát okoz.', 'institution', 'resolved', NULL, 47.9055, 20.3700, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 days', NOW() - INTERVAL '15 days', 3),
  (gen_random_uuid(), 'Buszmegálló fedél nélkül a Knézich utcán', 'A Knézich utca 8. szám előtt lévő buszmegállóban nincs tető, esőben nem lehet alá beállni. A közelben lakók jelezték, hogy sürgős lenne.', 'transport', 'open', NULL, 47.8980, 20.3790, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 9),
  (gen_random_uuid(), 'Játszótéri homokozó elavult', 'A Széchenyi lakótelepi játszótér homokozóját 10 éve nem cserélték, a homok szennyezett. A szülők nem engedik oda a gyerekeket.', 'other', 'closed', NULL, 47.9035, 20.3840, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '60 days', NOW() - INTERVAL '45 days', 0),
  (gen_random_uuid(), 'Harangjáték zavarja a környéket', 'A minorita templom harangja este 10 után is szól, zavarja a környékbeli lakók pihenését. Hangoskodási bejelentések érkeztek.', 'public_safety', 'open', NULL, 47.9018, 20.3760, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 2),
  (gen_random_uuid(), 'Strandbelépő drágább lett', 'A Bitskey uszoda belépője 30%-kal drágább lett a szezon elején. A helyi családok nehezen engedhetik meg maguknak.', 'institution', 'open', NULL, 47.8974, 20.3810, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 18),
  (gen_random_uuid(), 'Hiányzó pad a Tűzoltó téren', 'A Tűzoltó téren az idős lakók hiányolják a padokat, ahol pihenhetnének. Jelenleg egyáltalán nincs ülőhely.', 'other', 'investigating', NULL, 47.9005, 20.3765, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '6 days', NOW() - INTERVAL '2 days', 5),
  (gen_random_uuid(), 'Kutyaürülék a játszótéren', 'A Széchenyi játszótér homokozójában és környékén rendszeresen kutyaürülék van. A szülők nem merik odaengedni a gyerekeket.', 'environment', 'open', NULL, 47.9035, 20.3840, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', 11),
  (gen_random_uuid(), 'Városi bicikliút szakadt', 'A városi bicikliút a Kossuth híd és a Vár között megszakadt a Maklári úton. A bringások a főútra kénytelenek menni.', 'transport', 'investigating', NULL, 47.9020, 20.3810, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '8 days', NOW() - INTERVAL '3 days', 6),
  (gen_random_uuid(), 'Árvízveszély az Eger-patak partján', 'Az esőzések miatt az Eger-patak vízszintje kritikus. A gátak megerősítése szükséges.', 'infrastructure', 'open', NULL, 47.8980, 20.3700, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 14),
  (gen_random_uuid(), 'Elhagyatott épület a Károlyi utcában', 'A Károlyi utca 8. szám alatti régi épület már 5 éve lakatlanul áll, omladozik, veszélyes a járókelőkre.', 'public_safety', 'open', NULL, 47.9050, 20.3760, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', 8),
  (gen_random_uuid(), 'Orvosi ügyelet nehezen elérhető', 'Az egri orvosi ügyelet a kórházon kívülre költözött, sokan nem tudják, hova kell menni éjszaka. Táblák hiányoznak.', 'institution', 'open', NULL, 47.9022, 20.3755, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 7),
  (gen_random_uuid(), 'Zajterhelés a főúton', 'A 25-ös főút egeri szakaszán a kamionforgalom éjjel-nappal tart. A lakók nem tudnak aludni.', 'public_safety', 'open', NULL, 47.9080, 20.3690, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', 22),
  (gen_random_uuid(), 'Iskolai menza drágább lett', 'Az iskolai menza árai 25%-kal emelkedtek. A szülők jelezték, hogy ez sok családnak problémát okoz.', 'institution', 'open', NULL, 47.8985, 20.3700, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 9),
  (gen_random_uuid(), 'Csikkgyűjtő hiányzik a buszmegállókból', 'A város szinte összes buszmegállójából hiányoznak a csikkgyűjtők. A dohányosok az utcára dobják el a csikket.', 'environment', 'open', NULL, 47.9010, 20.3800, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', 4),
  (gen_random_uuid(), 'Közvilágítás a Vár környékén', 'Az egri Vár környékén esténként nem működik a közvilágítás, ami turisztikai és biztonsági szempontból problémás.', 'infrastructure', 'investigating', NULL, 47.8995, 20.3785, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '7 days', NOW() - INTERVAL '2 days', 6),
  (gen_random_uuid(), 'Zebra festék lekopott', 'A Széchenyi utcán lévő gyalogosátkelő festése teljesen lekopott, alig látható. Balesetveszélyes.', 'transport', 'open', NULL, 47.9000, 20.3780, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 10),
  (gen_random_uuid(), 'Zebra hiányzik a Líceumnál', 'A Líceum (Eszterházy tér) előtt nincs kijelölt gyalogosátkelő, pedig rengeteg diák kel át naponta.', 'transport', 'open', NULL, 47.8988, 20.3745, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', 8),
  (gen_random_uuid(), 'Parkolóhely hiány a belvárosban', 'A belvárosi üzletek környékén alig van parkolóhely. A szülők nem tudják a gyerekeket iskolába vinni.', 'transport', 'open', NULL, 47.9025, 20.3772, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', 25),
  (gen_random_uuid(), 'Fák kivágása a Kossuth téren', 'A Kossuth Lajos tér felújítása során 12 idős fát kivágtak. A helyiek tiltakoznak, mert elveszítették az árnyékot.', 'environment', 'open', NULL, 47.9025, 20.3772, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', 31),
  (gen_random_uuid(), 'Szennyvízcsatorna dugulás', 'A Tittel Pál utcán a szennyvízcsatorna rendszeresen dugul, a szennyvíz az utcára folyik. Több bejelentés is érkezett.', 'infrastructure', 'open', NULL, 47.9040, 20.3740, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 15),
  (gen_random_uuid(), 'Kóbor kutya a Vár alatt', 'A Vár alatti parkban egy agresszív kóbor kutya tartja rettegésben a járókelőket. A hatóság nem intézkedik.', 'public_safety', 'open', NULL, 47.8995, 20.3785, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 19),
  (gen_random_uuid(), 'Avartűzveszély a Várban', 'A Vár környéki erdőben felhalmozódott avar miatt tűzveszély alakult ki. A száraz időjárás miatt kritikus a helyzet.', 'environment', 'investigating', NULL, 47.8995, 20.3785, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day', 4),
  (gen_random_uuid(), 'Biciklitároló hiányzik a Polgármesteri hivatalnál', 'A Polgármesteri hivatal előtt nincs elég biciklitároló, a bringások a lámpaoszlopokhoz kötik a kerékpárjukat.', 'transport', 'open', NULL, 47.9029, 20.3772, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', 3),
  (gen_random_uuid(), 'Túl hangos a bazilika harangja', 'A bazilika harangja hajnali 5-kor szól, a környékbeli lakók nem tudnak aludni. Hangoskodási bejelentések.', 'public_safety', 'open', NULL, 47.8988, 20.3760, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 12),
  (gen_random_uuid(), 'Játszótéri padok töröttek', 'A Csiky Sándor utcai játszótér összes padja törött. A szülők nem tudnak leülni.', 'other', 'open', NULL, 47.8995, 20.3720, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', 6),
  (gen_random_uuid(), 'Közlekedési lámpa nem működik', 'A Maklári út és a Kertész utca kereszteződésében a közlekedési lámpa 1 hete pirosat villog, nem vált zöldre. Balesetveszélyes.', 'infrastructure', 'open', NULL, 47.9050, 20.3810, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', 13),
  (gen_random_uuid(), 'Iskolai tető beázik', 'A Balassi Általános Iskola teteje beázik, a tantermekben a víz folyik le a falon. Sürgős javítás szükséges.', 'institution', 'open', NULL, 47.8985, 20.3700, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 28),
  (gen_random_uuid(), 'Szemetes a Várban', 'A Vár kilátójánál lévő szemetes 2 napja tele van, a szél szétszórja a szemetet a turisták között.', 'environment', 'open', NULL, 47.8995, 20.3785, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 3),
  (gen_random_uuid(), 'Szökőkút nem működik a főtéren', 'A Dobó István tér szökőkútja 2 hete nem működik, a turisták szomorkodnak.', 'other', 'open', NULL, 47.9029, 20.3772, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', 7),
  (gen_random_uuid(), 'Rágcsálók a piac környékén', 'A piac környékén rágcsálók (patkányok) jelentek meg, veszélyeztetve az élelmiszerbiztonságot.', 'public_safety', 'open', NULL, 47.9055, 20.3790, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 16),
  (gen_random_uuid(), 'Túl hangos a Bazilika orgonája', 'A bazilika esti orgonakoncertjei túl hangosak, a környékbeli lakók nem tudnak pihenni.', 'public_safety', 'open', NULL, 47.8988, 20.3760, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', 5),
  (gen_random_uuid(), 'Hókotrás hiány', 'A belvárosi mellékutcákat nem takarítja a hókotró, a gyalogosok nem tudnak közlekedni. Több bejelentés.', 'infrastructure', 'investigating', NULL, 47.9020, 20.3780, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '60 days', NOW() - INTERVAL '5 days', 5),
  (gen_random_uuid(), 'Illegális szemétlerakás a Vár alatt', 'A Vár alatti erdőben illegális szemétlerakás folyik, bútorok, háztartási gépek, építési törmelék. Sürgős takarítás.', 'environment', 'open', NULL, 47.8995, 20.3785, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', 22),
  (gen_random_uuid(), 'Közterületi alkoholfogyasztás', 'A Széchenyi lakótelepi parkban egyre gyakoribb a közterületi alkoholfogyasztás, ami zavarja a családokat. Több bejelentés.', 'public_safety', 'open', NULL, 47.9035, 20.3840, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 11),
  (gen_random_uuid(), 'Szemetes a játszótéren', 'A játszótér szemetes rendszeresen tele van, a szél szétszórja. A szülők nem tudják rendesen használni a területet.', 'environment', 'open', NULL, 47.8980, 20.3790, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 4),
  (gen_random_uuid(), 'Közvilágítási hiba a Várban', 'A Vár belső udvarán a közvilágítás nem működik este 8 után, turisztikai szempontból problémás.', 'infrastructure', 'open', NULL, 47.8995, 20.3785, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', 6),
  (gen_random_uuid(), 'Iskolai mosdó rossz állapotú', 'A helyi általános iskola mosdói rossz állapotúak, csöpögnek a csapok, nem megfelelő higiénia. Felújítás szükséges.', 'institution', 'open', NULL, 47.9055, 20.3700, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 14),
  (gen_random_uuid(), 'Várparkoló túlzsúfolt', 'A Vár alatti parkoló hétvégén tele van, a turisták nem találnak helyet. Új parkoló kiépítése szükséges.', 'transport', 'open', NULL, 47.8995, 20.3785, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', 9),
  (gen_random_uuid(), 'Utcabútorok hiányoznak', 'A belvárosban több utcából (pad, szemetes, kerékpártároló) hiányzik. A vendéglátósok jelezték, hogy rontja a városképet.', 'infrastructure', 'open', NULL, 47.9015, 20.3790, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', 5),
  (gen_random_uuid(), 'Kutyás sétaút hiányzik', 'A városban nincs kijelölt kutyás sétaút, a kutyások az utcákon sétáltatnak, ami balesetveszélyes. Parkos megoldás szükséges.', 'other', 'open', NULL, 47.9040, 20.3760, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', 11),
  (gen_random_uuid(), 'Utcabútorok állapota rossz', 'A meglevő utcabútorok (padok, asztalok) állapota kritikus, több letörött, balesetveszélyes. Felújítás szükséges.', 'infrastructure', 'open', NULL, 47.9030, 20.3810, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', 4),
  (gen_random_uuid(), 'Felesleges parkolási díjak', 'A belvárosi parkolás túl drága, a helyi vállalkozók jelzik, hogy ez rontja a forgalmat. Árak csökkentése szükséges.', 'transport', 'open', NULL, 47.9025, 20.3772, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', 18),
  (gen_random_uuid(), 'Városi bringaút hiányzik', 'A városban nincs kijelölt bringaút, csak autóúton lehet közlekedni. Bringás infrastruktúra fejlesztése szükséges.', 'transport', 'open', NULL, 47.9000, 20.3800, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', 27),
  (gen_random_uuid(), 'Térfigyelő kamera hiányzik', 'A belvárosi főtéren nincs térfigyelő kamera, ami a biztonságot csökkentené. Több bejelentés vandalizmusról és lopásról.', 'public_safety', 'open', NULL, 47.9029, 20.3772, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', 14)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. A PostGIS location mező kitöltése (lat/lng → geography)
-- Az INSERT-ek után külön UPDATE, mert az INSERT-ben a location mezőt
-- ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography formátumban kell
-- felvenni, amit az INSERT-ben nehézkes. Ez egyszerűbb.
-- ============================================================================

UPDATE public.problems
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE location IS NULL;

-- ============================================================================
-- 4. ELLENŐRZÉS — listázd a beszúrt entitásokat
-- ============================================================================

SELECT 'institutions' AS table, COUNT(*) AS count FROM public.institutions
UNION ALL
SELECT 'problems' AS table, COUNT(*) AS count FROM public.problems;

-- A problémáknak location mezővel is kell rendelkezniük:
SELECT COUNT(*) AS problems_with_location
FROM public.problems
WHERE location IS NOT NULL;
