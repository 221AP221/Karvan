-- Karvan rebrendi: köhnə avtomatik standart rəng (#6d28d9) yeni brend rənginə keçir.
-- İstifadəçinin özünün seçdiyi digər rənglərə toxunulmur.
UPDATE "Profile"
SET "theme" = jsonb_set("theme", '{primary}', '"#D6127E"')
WHERE "theme"->>'primary' = '#6d28d9';
