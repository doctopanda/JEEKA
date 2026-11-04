# JEEKA · Identidad visual de referencia · v0.3

Diseño aprobado: águila JEEKA, desierto sonorense, oleaje turquesa, tarjetas oscuras y contornos cálidos.
Paleta: naranja corporal #FAAA6D, azul de alas #419EAE, coral #F2684A, crema #FFEEB0, durazno #FCC499, fondo petróleo #06353D.

Recurso `assets/jeeka-aguila-original.webp`: **recorte reducido del águila del póster original aportado por el proyecto**; destinado a miniaturas, marcadores y favicon. La identidad original tiene prioridad sobre ilustraciones alternativas. Complementos SVG son assets adaptables.

## Red demo

Se representan CECOSABI, UNISON, Metrocentro y Jardín Juárez como **cuatro ubicaciones ilustrativas**, no cuatro estaciones reales. Comparten exactamente los mismos datos del CSV cargado, sin replicarlos en IndexedDB. Valores iguales en todos los marcadores; al elegir el lugar solo cambia el foco. Las coordenadas de CECOSABI y Metrocentro son aproximaciones de zona, no puntos instrumentales. Jardín Juárez (29.081601,-110.952001) y UNISON campus centro (29.0834,-110.961548) están fundamentados en ubicaciones públicas.

No usar categorías de riesgo por CO₂ como AQI ni presentar esta copia como lectura local, tiempo real o estación activa. Los marcadores y popups llevan **SIMULADO** y aviso permanente. Antes de habilitar lecturas de campo, verificar coordenadas y estación_id y disponer de un sensor independiente por lugar.

## Arquitectura

Íconos, tags y tarjetas reaccionan al instante del histórico seleccionado. El único almacenamiento medido actual continúa en la ingesta manual y IndexedDB por station_id. Demo no alimenta base de datos; importador existente conserva su comportamiento.
