# JEEKA · Identidad visual de referencia · v0.3

Diseño aprobado: águila JEEKA, desierto sonorense, oleaje turquesa, tarjetas oscuras y contornos cálidos.
Paleta: naranja corporal #FAAA6D, azul de alas #419EAE, coral #F2684A, crema #FFEEB0, durazno #FCC499, fondo petróleo #06353D.

Recurso `assets/jeeka-aguila-original.webp`: **recorte reducido del águila del póster original aportado por el proyecto**; destinado a miniaturas, marcadores y favicon. La identidad original tiene prioridad sobre ilustraciones alternativas. Complementos SVG son assets adaptables.

## Red demo

Se representan CECOSABI, UNISON, Metrocentro y Jardín Juárez como **cuatro ubicaciones ilustrativas**, no cuatro estaciones reales. Comparten exactamente los mismos datos del CSV cargado, sin replicarlos en IndexedDB. Valores iguales en todos los marcadores; al elegir el lugar solo cambia el foco. Las coordenadas de CECOSABI y Metrocentro son aproximaciones de zona, no puntos instrumentales. Jardín Juárez (29.081601,-110.952001) y UNISON campus centro (29.0834,-110.961548) están fundamentados en ubicaciones públicas.

No usar categorías de riesgo por CO₂ como AQI ni presentar esta copia como lectura local, tiempo real o estación activa. Los marcadores y popups llevan **SIMULADO** y aviso permanente. Antes de habilitar lecturas de campo, verificar coordenadas y estación_id y disponer de un sensor independiente por lugar.

## Arquitectura

Íconos, tags y tarjetas reaccionan al instante del histórico seleccionado. El único almacenamiento medido actual continúa en la ingesta manual y IndexedDB por station_id. Demo no alimenta base de datos; importador existente conserva su comportamiento.


## v0.4 · Adaptación a aplicaciones cartográficas

Se utiliza `jeeka-eagle-vector.svg` para mantener nitidez al escalar, y `jeeka-pin.svg` en los tres mapas: integrado, minimapa de pines pequeños y `mapa.html` de ventana independiente. Se redujo el ruido visual y se aumentó el contraste de texto y controles. El motor de importación permanece intacto. La cartografía demo sigue etiquetada SIMULADA.


## v0.5 · Identidad exacta y mapa de pantalla completa

El águila del póster proporcionado por el proyecto (archivo `JEEKA_ Paleta Charizard para el aire(2).png`) es el emblema oficial. No se sustituye por una ilustración vectorial alternativa. El recorte rasterizado optimizado `assets/jeeka-original-emblem.webp` se usa en tamaño pequeño, sin ampliar sobre su resolución. El visor y sus mapas emplean el mismo recurso. La presentación cartográfica de `mapa.html` usa un lienzo de pantalla completa con sidebar plegable, sin barra superior que le quite espacio al mapa. Todas las medidas en cuatro sitios son COPIAS DEMOSTRATIVAS de una sola serie, no mediciones independientes.
