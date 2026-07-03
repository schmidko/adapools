# AGENTS.md

Diese Datei enthaelt gemeinsame Regeln fuer agentische Tools in den Blox-Projekten unter diesem Ordner.

## Projekt

- Projektfamilie: `Blox`
- Gemeinsamer Arbeitsordner: `/private/var/www/blox`
- Repositories: `adablox`, `adablox-workers`, `adablox-indexer`

## Programmiersprache Und Stil

- Nutze `JavaScript (ES6+)`.
- Verwende kein `TypeScript`.
- Nutze ausschliesslich Funktionen, einschliesslich Functional Components und Hooks.
- Verwende keine Klassen.

## Frameworks Und Bibliotheken

- UI-Framework: `React`
- Design-System: `Ant Design (antd)` inklusive passender Icons aus `@ant-design/icons`
- Styling: `TailwindCSS`, bei Bedarf ergaenzt durch Vanilla CSS

## Git Und Workflow

- Niemals selbststaendig committen. Der Benutzer entscheidet, wann committet wird.
- Arbeite im jeweils passenden Repository unter `/private/var/www/blox`.
- Codeaenderungen werden lokal im passenden Repository vorgenommen und muessen dort fuer Git persistiert werden. Der Server darf zum Testen oder Verifizieren genutzt werden, aber produktive Codeaenderungen auf dem Server sind nur temporaer; der dauerhafte Weg ist: lokal aendern, vom Benutzer committen lassen, danach aus Git deployen.

## Datenbank

- Lokaler Postgres-Tunnel auf Port `5433`
- Datenbankname: `cexplorer`
- Zugangsdaten befinden sich in `.env`
