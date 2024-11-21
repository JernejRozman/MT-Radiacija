# Elasticsearch

TL;DR: `docker compose up -d`

## Postavitev

Docker lahko naložite iz [uradne spletne strani](https://www.docker.com).
S terminalom se premaknite v mapo, kjer se nahaja datoteka `docker-compose.yml` in zaženite ukaz `docker compose up -d`.
Po nekaj minutah se postavita elasticsearch (baza) in kibana (vmesnik za bazo).
Kibana bo dostopna na naslovu `localhost:5601` in vanjo se lahko prijavite z uporabniškim imenom `elastic` in geslom definiranim v `.env` datoteki.

## Python

Naložite potrebne knjižnice z ukazom:

```bash
pip install -r requirements.txt
```
