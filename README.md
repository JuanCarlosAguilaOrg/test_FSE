# Recorrido de aprendizaje matemático

App web con un recorrido determinista de 3 temas (principal → teoría → refuerzo). Las reglas viven en el backend; el progreso y los intentos se guardan en PostgreSQL. Sin IA, sin usuarios (v1).

## Requisitos
- Docker y Docker Compose (flujo recomendado), **o** Node.js ≥ 20 y un PostgreSQL 16 local.

## Configuración
```bash
cp .env.example .env     # edita POSTGRES_PASSWORD y ajusta las URLs si cambias usuario/contraseña
```

## Inicio con Docker Compose
```bash
docker compose up --build -d      # db + api (aplica migraciones pendientes) + web
docker compose exec api npm run db:seed   # carga el contenido (idempotente)
```
- Frontend: http://localhost:5173
- API: http://localhost:3000/api/health
- PostgreSQL: localhost:5432 (volumen `pgdata`, persiste entre reinicios)

Detener / reanudar (sin perder datos): `docker compose stop` / `docker compose start`.
`docker compose down` conserva el volumen; **`down -v` lo borra** (no se hace automáticamente).

> No hay `package-lock.json` en esta entrega (se generó sin acceso a red). Tras el primer `npm install`, cométalo.
> Los Dockerfiles usan `npm install` por esa razón; cámbialo a `npm ci` cuando exista el lockfile.

## Migraciones y seed
```bash
docker compose exec api npm run db:deploy   # solo aplica migraciones pendientes (no destructivo)
docker compose exec api npm run db:seed     # upserts por códigos estables; no reinicia el progreso
```

## Pruebas
La base de pruebas (`learning_test`) se crea en la primera inicialización del volumen. Las pruebas se niegan a correr si `TEST_DATABASE_URL` no termina en `_test`.
```bash
docker compose exec api npm test
```
Sin Docker: `npm install`, `npm run db:generate`, levantar PostgreSQL con una base `learning_test` y `npm test`.
Si el volumen ya existía antes de añadir el script de init: `docker compose exec db createdb -U learning learning_test`.

## Endpoints
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | API y base de datos (503 si la BD cae) |
| GET | `/api/learning/current` | Paso actual (sin respuesta correcta) |
| GET | `/api/learning/progress` | Progreso y temas completados |
| GET | `/api/learning/attempts` | Historial persistido |
| POST | `/api/learning/attempts` | `{ "activityCode": "A1", "selectedOption": "b" }` |
| POST | `/api/learning/theory/continue` | THEORY → REINFORCEMENT |

Errores: `{ "error": { "code", "message", "details?" } }` con 400/404/409/413/500.

## Problemas frecuentes
- **`COURSE_NOT_SEEDED`**: ejecuta `db:seed`.
- **La API no conecta**: espera al healthcheck de `db` (`docker compose ps`).
- **Puerto ocupado**: cambia `POSTGRES_PORT`, `API_PORT` o `WEB_PORT` en `.env`.
- **Tests: "debe terminar en _test"**: revisa `TEST_DATABASE_URL`.
