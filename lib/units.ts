// Unidades de medida disponibles en el sistema

export interface UnitConfig {
  id:       string;   // valor guardado en DB
  label:    string;   // texto para mostrar
  short:    string;   // abreviatura
  decimal:  boolean;  // permite cantidades decimales (0.5, 1.25, etc.)
  step:     number;   // incremento del input
}

export const UNITS: UnitConfig[] = [
  // Conteo
  { id: 'unidad',  label: 'Unidad',       short: 'u',    decimal: false, step: 1     },
  { id: 'par',     label: 'Par',          short: 'par',  decimal: false, step: 1     },
  { id: 'docena',  label: 'Docena',       short: 'doc',  decimal: false, step: 1     },
  { id: 'caja',    label: 'Caja',         short: 'cja',  decimal: false, step: 1     },
  { id: 'paquete', label: 'Paquete',      short: 'pqt',  decimal: false, step: 1     },
  { id: 'rollo',   label: 'Rollo',        short: 'roll', decimal: false, step: 1     },
  // Peso
  { id: 'lb',      label: 'Libra',        short: 'lb',   decimal: true,  step: 0.25  },
  { id: 'oz',      label: 'Onza',         short: 'oz',   decimal: true,  step: 0.5   },
  { id: 'kg',      label: 'Kilogramo',    short: 'kg',   decimal: true,  step: 0.1   },
  { id: 'g',       label: 'Gramo',        short: 'g',    decimal: true,  step: 50    },
  { id: 'arroba',  label: 'Arroba',       short: 'arr',  decimal: true,  step: 0.25  },
  { id: 'qq',      label: 'Quintal',      short: 'qq',   decimal: true,  step: 0.1   },
  // Longitud
  { id: 'metro',   label: 'Metro',        short: 'm',    decimal: true,  step: 0.1   },
  { id: 'yarda',   label: 'Yarda',        short: 'yd',   decimal: true,  step: 0.25  },
  { id: 'pie',     label: 'Pie',          short: 'pie',  decimal: true,  step: 0.5   },
  { id: 'pulgada', label: 'Pulgada',      short: 'pulg', decimal: true,  step: 0.5   },
  { id: 'vara',    label: 'Vara',         short: 'vara', decimal: true,  step: 0.25  },
  // Volumen
  { id: 'litro',   label: 'Litro',        short: 'lt',   decimal: true,  step: 0.25  },
  { id: 'galon',   label: 'Galón',        short: 'gal',  decimal: true,  step: 0.25  },
  { id: 'ml',      label: 'Mililitro',    short: 'ml',   decimal: true,  step: 100   },
  // Área
  { id: 'mts2',    label: 'Metro cuadrado', short: 'm²', decimal: true,  step: 0.1   },
  // Tiempo / servicio
  { id: 'hora',    label: 'Hora',         short: 'hr',   decimal: true,  step: 0.5   },
  { id: 'servicio',label: 'Servicio',     short: 'serv', decimal: false, step: 1     },
];

export const DEFAULT_UNIT = 'unidad';

export function getUnit(id: string): UnitConfig {
  return UNITS.find(u => u.id === id) ?? UNITS[0];
}

// Subconjunto de UNITS relevante para una plantilla de industria (Template.unitIds).
// Array vacío = sin filtrar, se muestran todas (caso de la plantilla 'custom').
export function getUnitsForTemplate(unitIds: string[]): UnitConfig[] {
  return unitIds.length ? UNITS.filter(u => unitIds.includes(u.id)) : UNITS;
}

export function formatQty(qty: number, unitId: string): string {
  const unit = getUnit(unitId);
  const formatted = unit.decimal
    ? qty.toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
    : String(qty);
  return `${formatted} ${unit.short}`;
}