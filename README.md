# adapools

`adapools` ist ein neues Cardano-Pool-Explorer-Projekt in der Blox-Projektfamilie.
Es orientiert sich funktional an `pool.pm`, wird aber in der bestehenden Blox-
Architektur umgesetzt: modernes JavaScript, React/Vite im Frontend, Node.js/
Express im Backend, MongoDB als einzige Datenquelle fuer das Web-Backend und
Postgres/db-sync nur in den Aggregationsdiensten.

## Zielbild

- Startseite zeigt oben aktuelle Cardano-Netzwerkmetriken.
- Darunter laeuft ein Block-Ticker mit den zuletzt gefundenen Bloecken als
  quadratische Kacheln.
- Jede Block-Kachel zeigt:
  - Blocknummer
  - Pool-Ticker bzw. Pool-Identitaet
  - ADA-Volumen
  - Anzahl Transaktionen
  - Fees
  - Blockfuellstand in Prozent
- Pool-Detailseiten zeigen oben immer Pool-Metriken.
- Darunter nutzen Pool-Detailseiten dieselbe Block-Kachel-Darstellung, aber
  gefiltert auf die letzten Bloecke dieses Pools.
- Startseite erhaelt neue Bloecke per WebSocket mit maximal 15 Sekunden
  Zielverzoegerung.
- Pool-Detailseiten duerfen bis zu 60 Sekunden verzoegert sein.

## Repositories Und Verantwortlichkeiten

### `adapools`

Enthaelt die Web-App:

- durchgehend React-basiertes Vite-Frontend
- Node.js/Express Backend
- WebSocket-Server fuer neue Startseiten-Bloecke
- ausschliesslicher Lesezugriff auf MongoDB
- kein direkter Zugriff auf die chain-synchronisierte Postgres-Datenbank

### `adablox-workers`

Erweitern um eventgetriebene Jobs aus Postgres/db-sync nach MongoDB:

- Cardano-Netzwerkmetriken aktualisieren
- Pool-Metriken aktualisieren
- vom Indexer gemeldete neue Bloecke anreichern und normalisierte
  Blockdokumente in Mongo schreiben
- nach jedem neuen Block den zugehoerigen Pool gezielt aktualisieren
- bestehende Pool-Metadaten aus `pool_cache` wiederverwenden
- Status- und Lag-Metadaten pflegen

### `adablox-indexer`

Der Indexer ist der schnelle Trigger fuer neue Bloecke. Sobald er einen neuen
Block sieht, legt er ein kleines `adapools`-Blockevent bzw. einen Queue-Job an.
Der Job enthaelt mindestens Blocknummer, Slot, Hash, Zeit und Pool-ID. Danach
uebernimmt `adablox-workers` die Anreicherung aus db-sync/Postgres und den
Mongo-Write.

## Technischer Stack

- Sprache: JavaScript ES6+, kein TypeScript
- Frontend: React, Vite, React Router
- UI: Ant Design in der neuesten stabilen Major-Version, `@ant-design/icons`,
  TailwindCSS fuer Layout-Utilities und gezielte Ergaenzungen
- Theme: heller und dunkler Modus, per Toggle-Button im Header umschaltbar
- Backend: Node.js, Express
- Realtime: `ws` oder `socket.io`; bevorzugt `ws`, wenn nur Server-Push fuer
  neue Bloecke benoetigt wird
- Datenbank Web: MongoDB
- Datenquelle Aggregation: Postgres/db-sync `cexplorer`

## Vorgeschlagene Projektstruktur

```text
adapools/
  AGENTS.md
  README.md
  package.json
  index.html
  vite.config.js
  postcss.config.js
  tailwind.config.js
  eslint.config.js
  config/
    env-example
  server/
    index.js
    mongo.js
    blockModule.js
    metricsModule.js
    websocketModule.js
  src/
    main.jsx
    App.jsx
    index.css
    api/
      client.js
    components/
      AppHeader.jsx
      BlockTicker.jsx
      BlockTile.jsx
      MetricsBar.jsx
      PoolIdentity.jsx
      SyncStatus.jsx
      ThemeToggle.jsx
    context/
      ThemeContext.jsx
    pages/
      HomePage.jsx
      PoolPage.jsx
      NotFoundPage.jsx
    utils/
      format.js
```

## MongoDB Collections

Alle Zahlen, die Lovelace- oder grosse Chain-Werte darstellen, werden als
String gespeichert und im Frontend kontrolliert formatiert.

Wichtig: Bereits vorhandene Pooldaten aus `adablox` werden genutzt. Besonders
Offchain-Metadaten, Ticker, Namen, Homepages, Logos und Logo-Scrape-Ergebnisse
werden nicht fuer `adapools` neu gescraped. `adapools` liest diese Informationen
aus der bestehenden `pool_cache`-Collection und speichert in eigenen Collections
nur die fuer schnelle Block- und Detailseiten benoetigten Snapshots.

### `adapools_blocks`

Ein Dokument pro Block.

```js
{
  block_no: 11700000,
  hash: "...",
  slot_no: 154000000,
  epoch_no: 560,
  epoch_slot_no: 12345,
  time: "2026-07-03T12:34:56Z",
  tx_count: 42,
  size: 54321,
  max_block_size: 90112,
  fullness_percent: 60.3,
  total_output_lovelace: "123456789000",
  total_fees_lovelace: "1234567",
  pool: {
    bech32_pool_id: "pool1...",
    hex_pool_id: "...",
    ticker: "BLOX",
    name: "Ada Blox",
    homepage: "https://...",
    logo: null
  },
  created_at: "2026-07-03T12:35:03Z",
  synced_at: "2026-07-03T12:35:03Z"
}
```

Indexe:

- `{ block_no: -1 }` unique
- `{ time: -1 }`
- `{ "pool.bech32_pool_id": 1, block_no: -1 }`
- `{ synced_at: -1 }`

### `adapools_pool_recent_blocks`

Ein optimiertes Dokument pro Pool fuer die Pool-Detailseite. Dieses Dokument
wird vom Block-Worker bei jedem neuen Block des Pools aktualisiert und
enthaelt nur die letzten N Bloecke, z.B. 240. Dadurch kann die Detailseite mit
einem einzigen Mongo-Lookup geladen werden.

```js
{
  bech32_pool_id: "pool1...",
  hex_pool_id: "...",
  pool: {
    ticker: "BLOX",
    name: "Ada Blox",
    logo: null
  },
  latest_block_no: 11700000,
  latest_block_time: "2026-07-03T12:34:56Z",
  blocks: [
    {
      block_no: 11700000,
      hash: "...",
      slot_no: 154000000,
      epoch_no: 560,
      time: "2026-07-03T12:34:56Z",
      tx_count: 42,
      size: 54321,
      max_block_size: 90112,
      fullness_percent: 60.3,
      total_output_lovelace: "123456789000",
      total_fees_lovelace: "1234567"
    }
  ],
  block_count_cached: 240,
  updated_at: "2026-07-03T12:35:03Z"
}
```

Indexe:

- `{ bech32_pool_id: 1 }` unique
- `{ latest_block_no: -1 }`
- `{ updated_at: -1 }`

### `adapools_cardano_metrics`

Ein Snapshot-Dokument mit `_id: "current"`.

```js
{
  _id: "current",
  current_epoch: 560,
  latest_block_no: 11700000,
  latest_block_time: "2026-07-03T12:34:56Z",
  active_pools: 3000,
  total_pools: 3600,
  total_stake_lovelace: "23000000000000000",
  circulating_supply_lovelace: "35000000000000000",
  tx_count_24h: 50000,
  fees_24h_lovelace: "12000000000",
  avg_block_fullness_1h: 47.2,
  updated_at: "2026-07-03T12:35:05Z"
}
```

Index:

- `{ updated_at: -1 }`

### `adapools_pool_metrics`

Ein Dokument pro Pool.

```js
{
  bech32_pool_id: "pool1...",
  hex_pool_id: "...",
  ticker: "BLOX",
  name: "Ada Blox",
  description: "...",
  homepage: "https://...",
  logo: null,
  active_stake_lovelace: "123456789000000",
  live_stake_lovelace: "123456789000000",
  delegators: 1234,
  pledge_lovelace: "500000000000",
  active_pledge_lovelace: "500000000000",
  margin_percent: 1.5,
  fixed_cost_lovelace: "340000000",
  lifetime_blocks: 12345,
  blocks_24h: 12,
  blocks_epoch: 220,
  saturation_percent: 63.1,
  retiring_epoch: null,
  updated_at: "2026-07-03T12:35:05Z"
}
```

Die Felder `ticker`, `name`, `description`, `homepage` und `logo` kommen aus
der bestehenden `pool_cache`-Collection. Der Pool-Metriken-Worker berechnet
nur die fuer `adapools` benoetigten Zahlen neu bzw. schreibt einen optimierten
Snapshot. Er startet keinen eigenen Logo- oder Metadaten-Scraper.

Indexe:

- `{ bech32_pool_id: 1 }` unique
- `{ ticker: 1 }`
- `{ active_stake_lovelace_numeric: -1 }` optional fuer Sortierung
- `{ updated_at: -1 }`

### `adapools_sync_state`

Status fuer Aggregatoren und API-Diagnose.

```js
{
  _id: "blocks",
  last_block_no: 11700000,
  last_postgres_seen_at: "2026-07-03T12:34:56Z",
  last_mongo_write_at: "2026-07-03T12:35:03Z",
  lag_seconds: 7,
  updated_at: "2026-07-03T12:35:03Z"
}
```

## Postgres/db-sync Aggregation

Die Aggregation wird in `adablox-workers` implementiert, damit das Web-Backend
keinen Postgres-Zugriff braucht.

### Neuer-Block-Ablauf

Der bevorzugte Ablauf ist eventgetrieben:

1. `adablox-indexer` erkennt per ChainSync einen neuen Block.
2. Der Indexer schreibt ein kleines Event in Mongo, z.B.
   `adapools_block_events`, oder legt einen Worker-Queue-Job an.
3. `adablox-workers` startet fuer dieses Event einen Block-Worker.
4. Der Worker liest die fehlenden Detaildaten aus Postgres/db-sync.
5. Der Worker mischt Pool-Metadaten aus `pool_cache` dazu.
6. Der Worker schreibt den Block in `adapools_blocks`.
7. Der Worker aktualisiert `adapools_pool_recent_blocks` fuer genau diesen Pool.
8. Der Worker aktualisiert `adapools_pool_metrics` fuer genau diesen Pool.
9. Das `adapools` Backend erkennt den neuen Mongo-Block per Change Stream oder
   leichtem Fallback-Polling und pusht ihn per WebSocket an verbundene
   Frontend-Clients.

Damit wird der gefundene Block sofort im Frontend sichtbar, waehrend die
Pool-Detaildaten zeitnah und gezielt nachgezogen werden.

### Block-Worker

Trigger: ein neuer Block vom Indexer. Fallback: kurzer Polling-Job, falls ein
Event verloren geht oder der Indexer-Trigger temporaer deaktiviert ist.

Aufgabe:

1. Blockevent vom Indexer lesen.
2. In Postgres den Block per `block_no`, `hash` oder `slot_no` laden.
3. Je Block Transaktionsanzahl, Output-Summe, Fee-Summe, Blockgroesse,
   Slot-Leader und Pool-ID joinen.
4. `max_block_size` aus aktuellen Protocol-Parametern bestimmen.
5. `fullness_percent = size / max_block_size * 100` berechnen.
6. Pool-Metadaten aus der bestehenden Mongo-Collection `pool_cache` dazumischen.
7. Dokumente per `bulkWrite(..., { upsert: true })` in `adapools_blocks`
   schreiben.
8. Fuer jeden betroffenen Pool `adapools_pool_recent_blocks` mit `$push`,
   `$each`, `$position: 0` und `$slice` aktualisieren, damit pro Pool nur die
   letzten N Bloecke im optimalen Detailseitenformat gespeichert werden.
9. Einen gezielten Pool-Metriken-Refresh fuer den betroffenen Pool starten.
10. Sync-State aktualisieren.

Ziel: Ein neuer Block ist spaetestens 15 Sekunden nach Erkennung durch den
Indexer im Frontend sichtbar. Die Pool-Metriken duerfen nachgelagert aktualisiert
werden, sollen aber fuer Detailseiten innerhalb von 60 Sekunden frisch sein.

### Cardano-Metriken-Aggregator

Laufintervall: alle 30 Sekunden.

Aufgabe:

- aktuellste Blocknummer und Blockzeit
- aktuelle Epoche
- aktive Pools
- Total Stake
- 24h Transaktionen
- 24h Fees
- durchschnittlicher Blockfuellstand der letzten Stunde

Ergebnis wird als `_id: "current"` in `adapools_cardano_metrics` ersetzt.

### Pool-Metriken-Worker

Trigger: gezielt nach einem neuen Block fuer den betroffenen Pool. Fallback:
periodischer Voll- oder Teilrefresh, z.B. alle 60 Sekunden fuer Pools mit neuen
Bloecken oder veralteten Metriken.

Aufgabe:

- Pool-Stammdaten und Offchain-Metadaten aus bestehendem `pool_cache` uebernehmen
- Stake, Delegatoren, Pledge, Margin, Fixed Cost berechnen
- Lifetime-, 24h- und Epoch-Blockzaehler berechnen
- Saturation berechnen
- Retiring-Status setzen

Bestehende Logik aus `adablox-workers/src/poolModule.js` sollte wiederverwendet
oder in gemeinsam nutzbare Helper extrahiert werden, damit Pool-Definitionen
und Metadaten konsistent bleiben. `adapools` darf dabei keine Metadaten neu
scrapen, sondern konsumiert den vorhandenen Cache.

### Blockevent-Collection Oder Queue

Falls Mongo als einfache Queue genutzt wird:

```js
{
  _id: "...",
  block_no: 11700000,
  hash: "...",
  slot_no: 154000000,
  time: "2026-07-03T12:34:56Z",
  bech32_pool_id: "pool1...",
  status: "pending",
  attempts: 0,
  created_at: "2026-07-03T12:34:57Z",
  started_at: null,
  finished_at: null,
  error: null
}
```

Indexe:

- `{ status: 1, created_at: 1 }`
- `{ block_no: 1 }` unique

## Backend API

Das `adapools` Backend liest nur MongoDB.

### REST

```text
GET /api/health
GET /api/cardano/metrics
GET /api/blocks/latest?limit=120
GET /api/pools/:poolId/metrics
GET /api/pools/:poolId/blocks?limit=120&beforeBlockNo=11700000
GET /api/pools/:poolId/recent-blocks
GET /api/sync/status
```

Details:

- `poolId` akzeptiert mindestens `pool1...`; optional spaeter Ticker-Suche oder
  Hex-ID.
- `limit` hart begrenzen, z.B. maximal 240 Bloecke.
- Responses liefern bereits normalisierte Feldnamen fuer das Frontend.
- Keine Postgres-Fallbacks im Backend einbauen.
- `GET /api/pools/:poolId/recent-blocks` liest bevorzugt
  `adapools_pool_recent_blocks`, damit Detailseiten ohne teure Blockqueries
  geladen werden.

### WebSocket

Pfad: `/ws/blocks`

Serververhalten:

- Client verbindet sich auf der Startseite.
- Server sendet initial optional die letzten N Bloecke oder nur einen
  `connected`/`snapshot`-Status.
- Server nutzt bevorzugt MongoDB Change Streams auf `adapools_blocks`, falls
  Mongo als Replica Set laeuft.
- Fallback: Server prueft alle 3 bis 5 Sekunden `adapools_blocks` auf neue
  `block_no`.
- Neue Bloecke werden als Event gesendet:

```js
{
  type: "block.created",
  block: { /* normalisiertes Blockdokument */ }
}
```

MongoDB Change Streams sind der bevorzugte Push-Mechanismus zwischen Mongo und
Backend. Das Polling bleibt als robuste Fallbackvariante, falls Change Streams
in der jeweiligen Mongo-Umgebung nicht verfuegbar sind.

## Frontend

Das gesamte Frontend wird als React-Anwendung umgesetzt. Es werden ausschliesslich
Functional Components und Hooks verwendet. Ant Design ist das primaere
UI-Framework; neue Komponenten sollen zuerst mit Ant-Design-Bausteinen umgesetzt
werden und nur dort TailwindCSS/Vanilla CSS verwenden, wo Layout, Ticker oder
Block-Kacheln projektspezifische Feinkontrolle brauchen.

### Theme-System

- Ant Design wird ueber `ConfigProvider` zentral konfiguriert.
- Der aktuelle Modus wird in einem `ThemeContext` gehalten.
- `ThemeToggle` sitzt im `AppHeader` und schaltet zwischen hellem und dunklem
  Modus um.
- Der Modus wird in `localStorage` gespeichert.
- Ohne gespeicherte Einstellung wird `prefers-color-scheme` des Browsers als
  Startwert verwendet.
- Ant-Design-Tokens werden fuer beide Modi gepflegt, damit Kacheln, Tabellen,
  Buttons, Tooltips und Header konsistent wirken.
- CSS-Variablen fuer projektspezifische Flaechen wie Block-Kacheln werden aus
  dem aktiven Theme abgeleitet.

### Startseite

Komponenten:

- `MetricsBar`: kompakte Cardano-Metriken ganz oben
- `BlockTicker`: horizontales, responsives Raster/Tickerband
- `BlockTile`: quadratische Kachel fuer einen Block
- `SyncStatus`: dezenter Status bei veralteten Daten

Verhalten:

- Initiale Daten per `GET /api/cardano/metrics` und
  `GET /api/blocks/latest`.
- WebSocket ergaenzt neue Bloecke vorne in der Liste.
- Bei WebSocket-Abbruch automatischer Reconnect mit Backoff.
- Fallback-Polling alle 15 Sekunden, falls WebSocket nicht verfuegbar ist.

### Pool-Detailseite

Route:

```text
/pool/:poolId
```

Komponenten:

- `MetricsBar` mit Pool-Metriken
- `PoolIdentity` fuer Name, Ticker, Logo, Pool-ID
- `BlockTicker` mit Pool-Bloecken

Verhalten:

- Daten per REST laden.
- Refresh alle 60 Sekunden.
- Kein WebSocket erforderlich.
- Pagination oder "Mehr laden" ueber `beforeBlockNo` vorbereiten.

### Gestaltung

- Block-Kacheln sind echte Quadrate mit stabiler `aspect-ratio: 1 / 1`.
- Farbe darf Pool, Fuellstand oder Alter signalisieren, aber nicht allein
  Information tragen.
- Die wichtigsten Zahlen muessen auf Mobile lesbar bleiben:
  Blocknummer, Ticker, TX-Anzahl, Fees, Fuellstand.
- Lange Poolnamen werden gekuerzt; Ticker und Pool-ID bekommen Tooltips.
- Startseite ist direkt die Anwendung, keine Landingpage.

## Block-Kachel-Datenformat Im Frontend

```js
{
  blockNo: 11700000,
  time: "2026-07-03T12:34:56Z",
  poolId: "pool1...",
  poolTicker: "BLOX",
  poolName: "Ada Blox",
  ada: "123456.789",
  txCount: 42,
  feesAda: "1.234567",
  fullnessPercent: 60.3
}
```

## Fehler- Und Lag-Behandlung

- Wenn `adapools_sync_state.lag_seconds > 60`, zeigt die Startseite einen
  dezenten Hinweis auf verzoegerte Daten.
- API liefert bei leerer MongoDB leere Listen plus `sync`-Status, nicht 500.
- Aggregator schreibt idempotent per `block_no`-Upsert.
- Backend validiert Limits und Pool-IDs.
- Worker-Logs enthalten pro Lauf Anzahl gelesener und geschriebener Bloecke.

## Umsetzung In Phasen

### Phase 1: Projekt-Skeleton

- Status: implementiert.
- `package.json`, Vite, React, Express und Mongo-Anbindung anlegen.
- neueste stabile Ant-Design-Version und `@ant-design/icons` installieren.
- `config/env-example` definieren.
- globalen Ant-Design-`ConfigProvider` und `ThemeContext` einrichten.
- Header mit Hell/Dunkel-`ThemeToggle` anlegen.
- Gemeinsame Format-Helper fuer ADA, Prozent, Datum und kompakte Zahlen bauen.
- Basis-Routen und leere Seiten anlegen.

### Phase 2: Mongo-Schema Und Indexe

- Status: implementiert im Worker-Collector; Beispiel-Daten offen.
- Mongo-Collection-Namen finalisieren.
- bestehende `pool_cache`-Felder fuer Pool-Metadaten als Quelle definieren.
- Index-Erstellung im Worker oder separatem Deploy-Script implementieren.
- Beispiel-Dokumente lokal einspielen.
- Backend-REST gegen Beispiel-Daten bauen.

### Phase 3: Indexer-Trigger Und Worker

- Status: implementiert als additive Worker/Indexer-Erweiterung hinter
  Feature-Flags.
- `adablox-indexer` um minimales `adapools`-Blockevent erweitern.
- `adablox-workers` um `adapools`-Module erweitern.
- Block-Worker fuer Indexer-Events implementieren.
- Block-Worker mit `pool_cache`-Join fuer Pool-Metadaten implementieren.
- `adapools_pool_recent_blocks` als optimierten Pro-Pool-Blockcache pflegen.
- Cardano-Metriken-Aggregator mit 30s Intervall implementieren.
- Pool-Metriken-Worker nach jedem neuen Block fuer den betroffenen Pool starten.
- Fallback-Scanner fuer verlorene Blockevents oder veraltete Pools ergaenzen.
- Sync-State und Lag-Messung einbauen.

### Phase 4: Backend

- Status: implementiert.
- Express-Server nur mit Mongo-Verbindung implementieren.
- REST-Endpunkte fuer Metriken und Blocklisten bauen.
- WebSocket `/ws/blocks` mit Mongo Change Stream und Polling-Fallback
  implementieren.
- Health- und Sync-Endpunkte bereitstellen.

### Phase 5: Frontend

- Status: implementiert.
- Startseite mit Cardano-Metriken und Block-Ticker bauen.
- WebSocket-Integration inklusive Reconnect und Polling-Fallback.
- Pool-Detailseite mit Pool-Metriken und Pool-Blockliste bauen.
- Hell- und Dunkelmodus fuer alle Views, Kacheln, Header und Ladezustaende
  pruefen.
- Responsive Styling und stabile Kachelgroessen pruefen.

### Phase 6: Verifikation

- Lokale Mongo-Beispieldaten pruefen.
- Worker gegen lokale db-sync-Sample-Postgres-Daten laufen lassen.
- API-Responses fuer leere, normale und verzoegerte Daten testen.
- pruefen, dass keine neuen Pool-Metadaten- oder Logo-Scrapes fuer `adapools`
  gestartet werden.
- WebSocket-Latenz messen: Ziel kleiner als 15 Sekunden ab Indexer-Erkennung.
- Pool-Detailseiten-Refresh messen: Ziel kleiner als 60 Sekunden.
- Frontend per Desktop- und Mobile-Viewport visuell pruefen.

### Phase 7: Deployment

- Status: implementiert mit Docker Compose und Makefile analog `adablox`.
- Systemd- oder bestehendes Deploy-Muster analog `adablox` festlegen.
- `.env` fuer Mongo, Port, CORS und WebSocket-Origin dokumentieren.
- Reverse-Proxy fuer REST und WebSocket konfigurieren.
- Monitoring fuer Aggregator-Lag und Backend-Health ergaenzen.

## Deployment

`adapools` laeuft im Docker-Setup analog zu `adablox`: `node:22`, bind mount
nach `/app`, `npm ci`, `npm run build` und danach `node server/index.js`.
Der Node/Express-Server liefert im Container sowohl die REST/WebSocket-API als
auch das gebaute Vite-Frontend aus `dist/` aus.

Lokale Compose-Pruefung:

```bash
docker compose config
```

Server vorbereiten:

```bash
make bootstrap
```

Deploy:

```bash
make deploy
```

Status und Logs:

```bash
make status
make logs
```

Erwartete Server-Dateien:

- Repository: `/var/www/adapools`
- Env-Datei: `/home/mog/env/adapools/.env`
- Deploy kopiert Env nach: `/var/www/adapools/config/.env`
- Container: `adapools`
- Port: `5056`

Die Env-Datei sollte mindestens Mongo-Verbindung und CORS enthalten. Wenn Mongo
auf dem Docker-Host laeuft, ist `MONGO_HOST=host.docker.internal` vorgesehen.

## Pool-Header-Anzeigen

Die optionalen Pool-Anzeigen bestehen aus zwei Header-Slots. Freie Slots zeigen
die Eigenwerbung, gebuchte Slots werden ausschliesslich aus Pool-Ticker, Name,
Beschreibung und Logo generiert. Ein Slot kostet 1 ADA pro Tag und wird nach
einer bestaetigten Zahlung fuer die gebuchte Dauer aktiviert.

Die Funktion ist standardmaessig deaktiviert und wird nur in der Server-Env
eingeschaltet:

```env
POOL_ADS_ENABLED=true
POOL_ADS_PAYMENT_ADDRESS=addr1...
ADAPOOLS_DATABASE_URL=postgresql://...
```

`POOL_ADS_PAYMENT_ADDRESS` und `ADAPOOLS_DATABASE_URL` bleiben nur auf dem
Server. Ohne beide Werte sind Buchung und Zahlungspruefung gesperrt, auch wenn
der Feature-Flag aktiv ist. Die Zahlungspruefung fragt die eigene db-sync-
Postgres-Datenbank ab und kontrolliert Empfaenger, exakten Lovelace-Betrag und
Buchungsreferenz in den Transaktions-Metadaten.
`adapools_pool_ad_bookings` speichert Buchungen; `adapools_pool_ad_slot_locks`
verhindert parallele Buchungen. Abgelaufene Slots werden bei API-Aufrufen und
durch einen minuetlichen Job wieder freigegeben.

Lokal zeigt `http://localhost:5173/__timeline-preview` beide Banner-Varianten.
Die Route ist nur im Vite-Entwicklungsmodus verfuegbar.

## Pool Discovery

`/discover` ist die eigenstaendige Poolliste von adapools. Die Seite liest
ausschliesslich aus Mongo `pool_cache`, paginiert serverseitig und kann nach
Pool, Status, Stake, Delegators, Blocks, Sattigung, Margin, Fixkosten, Pledge
und erster Registrierungszeit filtern und sortieren. Der Pool-Worker schreibt
`registered_on` als erste On-Chain-Poolregistrierung, nicht als Zeitpunkt der
letzten Pool-Aktualisierung.

## Offene Entscheidungen

- Soll `adapools` dieselbe Mongo-Datenbank `adablox` nutzen oder eine eigene
  Datenbank `adapools` bekommen? Empfehlung: gleiche Mongo-Instanz, eigene
  Collections mit Prefix `adapools_`.
- Soll WebSocket mit `ws` oder `socket.io` umgesetzt werden? Empfehlung: `ws`,
  solange nur neue Blockevents gesendet werden.
- Soll die Pool-Route nur `pool1...` akzeptieren oder auch Ticker/Name?
  Empfehlung: zuerst `pool1...`, spaeter Suchroute ergaenzen.
- Soll `max_block_size` pro Block aus historischen Protocol-Parametern oder
  nur aus dem aktuellen Parameter gesetzt werden? Empfehlung: fuer neue
  Bloecke den zum Blockzeitpunkt gueltigen Parameter verwenden; fuer die erste
  Version ist aktueller Parameter als kontrollierte Naeherung akzeptabel.
