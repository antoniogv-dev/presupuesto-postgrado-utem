# Verificación de la entrega

## Verificaciones ejecutadas

- Compilación TypeScript del motor financiero puro: correcta.
- Validación sintáctica de la aplicación autónoma: correcta.
- Nueve pruebas automatizadas: 9 aprobadas, 0 fallidas.
- Análisis básico del HTML: correcto.
- Carga de `demo/index.html` mediante servidor HTTP local: respuesta 200.
- Integridad del archivo ZIP: sin errores.

## Reglas cubiertas por las pruebas

1. Años activos sin periodos anteriores al inicio.
2. Prorrateo anual 0,5 / 1,0 / 0,5.
3. Descuentos asociados a grupos de estudiantes.
4. Incobrabilidad posterior a beneficios.
5. Overhead sobre ingreso neto por arancel.
6. Ingresos externos reconocidos sólo en el año configurado.
7. Arrastre del acumulado anterior.
8. Viabilidad profesional y normalización de costos compartidos.
9. Prioridad del arancel propio del programa sobre la plantilla institucional.

## Limitación del entorno de construcción

El registro de paquetes npm disponible en el entorno no contiene Next.js ni sus dependencias. Por esta razón no se ejecutó `npm install` ni el `next build` completo. La demostración autónoma no depende de npm; el proyecto Next.js queda preparado para instalarse y compilarse en un entorno con acceso normal al registro público de npm.
