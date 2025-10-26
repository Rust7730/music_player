Guía de commits y flujo para el proyecto

Objetivo
- Mantener commits atómicos y por funcionalidad para que el historial muestre trabajo incremental y comprensible.

Convenciones rápidas (conventional-like)
- Formato: tipo(scope): resumen corto
  - tipos: feat, fix, chore, docs, refactor, test, style
  - scope: área o componente (ej. music-player, spotify-service)

Ejemplos
- feat(music-player): añadir template y bindings básicos
- fix(spotify-service): corregir parsing de tracks con campos faltantes
- chore(env): añadir environment.example.ts con placeholders

Buenas prácticas
- Un commit = una idea
- Mensaje ≤ 72 chars en la primera línea
- Usar `git add -p` para dividir hunks cuando un archivo contiene cambios no relacionados
- Rebase interactivo (`git rebase -i`) para limpiar antes de push si es necesario

Flujo sugerido
1. Crear rama por feature: `git checkout -b feat/<nombre>`
2. Hacer commits pequeños y temáticos
3. Reorganizar/squash localmente si hace falta
4. Push y abrir PR cuando la feature esté lista

Notas
- No reescribir historia compartida sin coordinar (usar `--force-with-lease` con cuidado)
