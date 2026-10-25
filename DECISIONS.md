# DECISIONS

## 1. Monolito modular
Un solo despliegue API + web + BD basta para un recorrido único; microservicios añadirían coste operativo sin beneficio. La modularidad (domain / services / repositories / routes / controllers) permite añadir usuarios, roles e importación sin reescribir.

## 2. Reglas separadas del transporte
`apps/api/src/domain/learning.ts` es puro (sin Express ni Prisma): `transition(pos, evento, totalTemas)` es la única fuente de verdad. Controllers solo traducen HTTP; el servicio lee el estado, llama al dominio y persiste. React no contiene reglas: solo renderiza lo que dice el servidor.

## 3. Consistencia intento ↔ progreso
Cada respuesta corre en una transacción Prisma. Estrategia de concurrencia: **bloqueo optimista** con `LearningProgress.version`. Primero se ejecuta `updateMany WHERE version = <leída>`; si afecta 0 filas se aborta con 409 `CONCURRENT_UPDATE` y no se escribe nada (ni intento ni finalización). En READ COMMITTED la segunda petición espera el commit de la primera, reevalúa el `WHERE` y falla. Además `TopicCompletion.topicId` es PK: un tema no puede completarse dos veces aunque falle otra defensa. No se reintenta automáticamente: el cliente re-sincroniza consultando `/current`. Esta garantía cubre transiciones ilegales y estados obsoletos; no pretende resolver otros escenarios multiusuario (no existen en v1).

## 4. Respuestas correctas ocultas
`ActivityOption.isCorrect` solo se lee en el servicio. Las respuestas públicas se construyen con un mapeo explícito `{key, text}` (lista blanca), no con el objeto de Prisma. Hay una prueba que verifica que el JSON no contiene `isCorrect`/`correct`.

## 5. Modelo
Un `Activity` MAIN y uno REINFORCEMENT por tema (`@@unique([topicId, type])`). Opciones relacionales con `isCorrect` en lugar de un FK circular a la opción correcta. Limitación conocida: la BD no impide por sí sola dos opciones correctas en una actividad (se garantiza por el seed; un índice parcial único sería la mejora). `LearningProgress` es singleton (`id = "main"`) sin tabla de usuarios ficticia; al añadir autenticación se sustituirá por una clave `userId`. `Attempt` guarda `topicId` para integridad histórica si el contenido cambia.

## 6. Diseño educativo y límites
Repetir la misma pregunta de refuerzo puede medir memorización de la respuesta y no comprensión. Mejora futura (no implementada): variantes equivalentes por actividad. Con 3 opciones, el azar acierta 33 %. El recorrido es lineal y sin diagnóstico previo.

## 7. Preparación para el futuro (no implementado)
Autenticación (JWT con expiración, cookies HttpOnly), roles STUDENT/TEACHER validados en backend, paneles, importación Excel con vista previa, transacción y auditoría, versionado de contenido y despliegue remoto. Nada de esto está simulado en la v1.

## 8. Uso de IA durante el desarrollo
Este proyecto fue generado con asistencia de Claude (Anthropic) a partir del prompt maestro. [COMPLETAR: qué revisaste, modificaste o rechazaste tú.]

## 9. Validaciones realmente ejecutadas
**Ninguna.** El entorno de generación no tenía acceso a red (no se pudieron instalar dependencias), por lo que no se ejecutaron ni `tsc`, ni `vitest`, ni Docker, ni las migraciones. La migración SQL inicial fue escrita a mano y debe contrastarse con `prisma migrate diff`.
[COMPLETAR: fecha y resultado de `npm run typecheck`, `npm test`, `docker compose up`.]

## 10. Autoevaluación
- Implementado: todo lo listado en el README (API, dominio, Prisma, seed, frontend, Docker, pruebas escritas).
- Pendiente: ejecutar y corregir lo anterior; generar `package-lock.json`; índice parcial para opción correcta única; pruebas del frontend.

## 11. Tiempo real de trabajo
[COMPLETAR por el desarrollador.]
