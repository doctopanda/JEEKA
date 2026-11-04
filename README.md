# 🦅 JEEKA · Motor TUKAWIRU

**Jefatura Estratégica de Evaluación Ecológica y Kalidad del Aire**

> Vigilar el aire. Anticipar el riesgo.

## Versión actual: 0.2 · Importación CSV/JSON persistente

**La webapp sigue siendo independiente de la red local del monitor.** Se incorporó el módulo `js/jeeka-import.js` y el centro de importación en `index.html`.

- Selección de estación y zona horaria; admite el CSV del monitor y JSON de lecturas con timestamps ISO 8601.
- Revisión previa de nuevas, duplicadas, conflictos, incidencias y advertencias. Se confirma manualmente cada lote.
- Persistencia en **IndexedDB** del navegador por estación, con mediciones originales, metadatos de carga y eventos `SinRed`.
- Sin sobreescritura de lecturas existentes, historial consultable en la misma computadora, exportación de JSON para respaldos.
- Carga sucesiva de archivos, gráfico con promedios por minuto e indicadores actualizados desde todas las lecturas guardadas de la estación.
- Para evitar pérdidas de datos, **descargar periódicamente el respaldo JSON**. Los datos no se sincronizan entre navegadores, ni quedan almacenados en GitHub.

Consultar el **[Contrato de importación y validación](docs/CONTRATO_IMPORTACION.md)** antes de automatizar nuevas fuentes. La reimportación del historial exportado restaura lecturas, pero aún no reconstruye íntegramente la bitácora anterior.

### Versión 0.1 · Primer demo geoespacial (04/11/2026)

Visor web de una estación de monitoreo SCD40 + MQ135, con identidad JEEKA en paleta Charizard (naranja corporal `#FAAA6D`, azul de alas `#419EAE`, coral `#F2684A`, crema `#FFEEB0`, durazno `#FCC499`).

**Abrir:** `index.html` (requiere internet para cargar Leaflet, OpenStreetMap y Chart.js). Interfaz adaptable a escritorio y móvil.

### Datos incorporados

Se usó el archivo `datos_aire (3).csv` aportado para el prototipo:
- 854 filas en total; 849 lecturas con fecha válida.
- 5 registros de continuidad de red sin fecha calendarizada: `SinRed-205s`, `SinRed-300s`, `SinRed-305s`, `SinRed-1575s` y `SinRed-1580s`.
- Fecha: 2026-11-04, 11:12:59 a 12:25:19, hora reportada por el equipo.
- CO₂ SCD40: promedio 980.52 ppm; mínimo 489 y máximo 1424 ppm.
- Temperatura: promedio ~23.23 °C.
- Humedad relativa: promedio ~57.64 %.
- MQ135: 846 de 849 filas con valor 0.0; 3 con 0.1 en la unidad reportada.

La versión inicial **incorpora 74 puntos de promedio por minuto**, no todas las 849 filas individuales. Los indicadores generales sí se calculan sobre las 849 mediciones válidas. El último valor mostrado proviene de la última fila real (12:25:19).

### Funciones de la demo

1. Mapa OpenStreetMap con **un único marcador ilustrativo** en el centro de Hermosillo. La ubicación real del equipo **NO** ha sido verificada. El usuario puede mover el marcador al hacer clic, pero esto no certifica una posición.
2. Gráficas de CO₂, temperatura, humedad y señal MQ135; selectores por 15, 30, 60 minutos o todo el historial; selección de punto en gráfico o barra temporal.
3. Ficha de estación, indicadores, información sobre calidad de dato.
4. En la versión inicial, importación temporal de un CSV sin persistencia; **desde v0.2** el centro de importación realiza revisión previa y guarda la serie original en el navegador.
5. Exportación de la ventana temporal agregada como CSV.

### Interpretación y limitaciones

- Este prototipo **no produce un índice AQI oficial**, mapas de contaminación, isoconcentraciones ni indicadores regulatorios.
- El CO₂ es una variable útil para explorar ventilación bajo condiciones apropiadas, **no un sustituto de PM₂.₅, PM₁₀ ni O₃**.
- El MQ135 es un sensor de gases de sensibilidad cruzada. Los valores de 0.0 **no demuestran ausencia de contaminantes**. Se debe revisar calibración, voltaje, calentamiento y conversión a ppm.
- No hay streaming en vivo ni conectividad automática en v0.2. La IP `10.10.120.171` es privada: un GitHub Pages público servido por HTTPS no puede acceder directamente de forma fiable y segura al dashboard HTTP de una LAN. Además, no conocemos un endpoint JSON/CSV automatizable del firmware.
- Las marcas `SinRed` se retienen como **incidencias de continuidad**, sin imputarles hora cuando no existe fecha válida.
- Datos exploratorios; no usar para advertencias sanitarias ni decisiones regulatorias sin validación.

### Publicación en GitHub Pages

En el repositorio JEEKA: **Settings → Pages → Build and deployment → Deploy from a branch → main / (root) → Save**.

Cuando GitHub confirme la publicación, la dirección esperada es `https://doctopanda.github.io/JEEKA/` (no constituye confirmación de despliegue).

### Próximos desarrollos (v0.3 y posteriores)

- Identificar cómo obtener lecturas estructuradas del hardware, idealmente desde un bridge local autorizado que publique **solamente agregados** a un endpoint HTTPS con CORS controlado.
- Guardar `station_id`, latitud/longitud verificadas, entorno de medición (interior/exterior), altura de instalación, calibración, unidades, estado del sensor, zona horaria y timestamp ISO 8601.
- Convertir el almacenamiento histórico local actual en una arquitectura central sincronizable, con auditoría de conflictos e incidencias, respaldo/recuperación integral y control de calidad ampliado.
- Preparar la capa multiestación con marcadores georreferenciados y filtros por territorio; no interpolar un mapa continuo desde un solo sensor.
- Integrar equipos certificados o calibrados de partículas PM₂.₅/PM₁₀ y, según objetivos, O₃/NO₂ para análisis de contaminantes atmosféricos.

### Referencias técnicas

- Sensirion SCD40: https://sensirion.com/products/catalog/SCD40
- Winsen MQ135: https://www.winsen-sensor.com/manual/mq135.html
- AirNow / EPA: https://www.airnow.gov/about-the-data/

---

**Nota de identidad:** El SVG del encabezado es una representación simplificada de prueba en los colores del arte JEEKA; el sello final suministrado por el proyecto puede incorporarse como imagen de marca en una siguiente revisión.
