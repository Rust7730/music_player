Feature: music-player (base)

Objetivo
- Implementar controles básicos del reproductor: play/pause, siguiente, anterior, lista mínima de pistas.

Tareas atómicas sugeridas (cada una -> commit)
- Crear template del componente (`music-player.component.html`) con marcadores
- Añadir bindings y propiedades en `music-player.component.ts` para la pista actual
- Añadir estilos mínimos en `music-player.component.css`
- Conectar con `spotify.service` (buscar mock de datos)
- Ajustes de accesibilidad: etiquetas ARIA en botones

Notas
- Mantener cada cambio en commits separados: `feat(music-player): añadir template` / `feat(music-player): bindear play/pause`
