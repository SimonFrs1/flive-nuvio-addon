# FLive → Nuvio addon

Tento addon vystavuje F1 stream ako Nuvio/Stremio-compatible addon.

## Najjednoduchšie nasadenie cez Render

1. Nahraj celý priečinok `flive-nuvio-addon` do nového GitHub repozitára.
2. V Render zvoľ **New → Web Service** a pripoj tento repozitár.
3. Render automaticky použije `render.yaml`.
4. Po úspešnom deployi dostaneš adresu napr.:
   `https://flive-nuvio-addon.onrender.com`
5. Do Nuvio pridaj:
   `https://flive-nuvio-addon.onrender.com/manifest.json`

## Kontrola

- `https://TVORJA-DOMENA/health`
- `https://TVORJA-DOMENA/manifest.json`

Stream URL sa nevkladá napevno. Addon pri požiadavke na `/stream/tv/flive:skyf1.json`
načíta embed stránku a podľa logiky z dodaného FLive JavaScriptu vytvorí aktuálny
tokenizovaný HLS `.m3u8` odkaz.

Poznámka: tento projekt neoveruje licenčné práva k zdroju. Používaj ho iba tam,
kde máš právo daný stream sledovať alebo ďalej sprístupňovať.
