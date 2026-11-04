# JEEKA · Contrato de importación v0.2

El visor procesa datos en el navegador, sin conexión directa al monitor. Cada archivo se revisa antes de confirmarlo y se almacena en IndexedDB, separado por estación.

## Flujo operativo

1. Indica ID de estación y zona horaria de origen (ejemplo Sonora: UTC−07:00).
2. Selecciona un archivo CSV o JSON (máximo 20 MB).
3. Revisa filas nuevas, duplicadas, conflictos, no importables y advertencias.
4. Confirma. Se guardan únicamente las lecturas nuevas; las previas nunca se sobrescriben.
5. Consulta el historial de cargas, las series y la ficha de la estación.
6. Exporta con frecuencia el historial JSON como respaldo. La reimportación de ese JSON restaura lecturas, no la bitácora previa completa.

## CSV del monitor

Encabezado exacto: Fecha,Hora,CO2_SCD40(ppm),Temperatura(C),Humedad(%),Gases_MQ135(ppm)

Ejemplo de dos filas:

    2026-11-04,11:12:59,1339,27.1,50.6,0.0
    SinRed-205s,00:00:00,1166,22.6,58.6,0.0

Las marcas SinRed se registran como incidencias, sin asignación artificial de fecha ni incorporación a curvas. Fechas no válidas o valores ausentes/no numéricos se excluyen. Se aceptan separadores coma o punto y coma.

**Aviso**: el botón Exportar ventana del visor produce promedios por minuto; esos agregados no deben reimportarse como si fueran mediciones crudas.

## JSON para un puente futuro

Esquema: jeeka.readings.v1. Ejemplo:

    {
      "schema_version": "jeeka.readings.v1",
      "station_id": "JEEKA-01",
      "readings": [{ "station_id": "JEEKA-01", "timestamp": "2026-11-04T18:12:59Z", "co2_ppm": 1339, "temperature_c": 27.1, "humidity_pct": 50.6, "mq135_reported": 0 }]
    }

Se acepta también un arreglo directo de lecturas o el arreglo en la clave measurements. Las lecturas deben tener fecha ISO 8601 con Z u offset. La zona seleccionada en el formulario determina cómo se presenta la hora local.

## Duplicados, validación y trazabilidad

- ID único: ID de estación + fecha-hora UTC normalizada.
- Mismo ID y mismos valores: duplicado. Se omite.
- Mismo ID y otros valores: conflicto. No se sobrescribe el registro anterior.
- Hora distinta: nueva lectura, aunque las magnitudes sean iguales.
- Se descartan únicamente valores básicos imposibles: CO₂ ≤ 0, temperatura fuera de −60 a 100 °C, humedad fuera de 0 a 100 %, gas negativo, fechas imposibles o datos no numéricos.
- Se marcan para revisión, sin descartar automáticamente, CO₂ inferior a 350 o superior a 5000 ppm, temperatura inferior a −20 o superior a 60 °C y MQ135 distinto de cero. Estos criterios son controles de calidad técnicos preliminares, NO umbrales de riesgo sanitario.
- Los datos crudos válidos se conservan; las curvas se agregan por minuto para visualizar.

## Persistencia y límites

IndexedDB funciona exclusivamente en el navegador usado y bajo el origen de la webapp. No se sincroniza entre dispositivos; limpiar los datos del sitio puede borrar el historial. JEEKA no transmite los CSV a un servidor en esta versión. El respaldo JSON exporta lecturas, lotes e incidencias; al reimportarlo, las lecturas se restauran pero las bitácoras previas aún no.

Con SCD40 (CO₂, temperatura y humedad) y MQ135 sin calibración especificada, no hay datos suficientes para establecer un AQI oficial o inferir condiciones de contaminación por barrio. Los ceros del MQ135 no garantizan aire libre de contaminantes. La ubicación del marcador del mapa es ilustrativa.

## Conexión automática futura

Monitor -> colector local autorizado -> normalizador HTTPS -> almacén central protegido -> API de agregados -> visor JEEKA.

Antes de automatizar: registrar station_id, timestamp, zona horaria, ubicación verificada, interior/exterior, calibración, conectividad y revisión de calidad. No acceder directamente desde GitHub Pages HTTPS a la IP HTTP privada 10.10.120.171.

## Comprobaciones

- Importar el CSV inicial: 849 lecturas válidas y 5 incidencias SinRed.
- Reimportar el mismo CSV: 0 lecturas nuevas, 849 duplicadas.
- Importar un CSV ampliado: se agregan solo timestamps nuevos.
- Cambiar el valor de un timestamp existente: debe aparecer como conflicto, sin reemplazo.
- Refrescar la webapp en el mismo navegador: comprobar persistencia.
- Exportar historial JSON y comprobar que contiene readings, batches e incidents.

Versión: 2026-11-04.