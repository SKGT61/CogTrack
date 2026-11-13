import {
  LearningDomain,
  PedagogicalSession,
  WeeklyStudyPlan,
  WeeklyStudyPlanDay,
  EvaluationResult,
  BloomLevel,
  CoreExamProblem,
  CoreMCQQuestion,
  WarmupQuestion,
  TestCase,
  ConceptItem,
  DifficultyLevel,
  DifficultyLessonItem,
  DomainDifficultyTrack,
  PrecisionRubricScore,
} from '../types/learning';

// Helper to determine if a day is Sunday
export function isSunday(dayName: string): boolean {
  return dayName.toLowerCase().includes('domingo');
}

// Curated domain templates for rich offline/deterministic generation
interface DomainPedagogicalPreset {
  warmups: WarmupQuestion[];
  coreProblems: CoreExamProblem[];
}

const DOMAIN_PRESETS: Record<string, DomainPedagogicalPreset> = {
  'dom-math-calc': {
    warmups: [
      {
        id: 'w-m-1',
        question: '¿Cuál es la derivada de $f(x) = \\ln(x^2 + 1)$ con respecto a $x$?',
        conceptTested: 'Regla de la cadena en diferenciación básica',
        options: [
          '$\\frac{2x}{x^2 + 1}$',
          '$\\frac{1}{x^2 + 1}$',
          '$\\frac{2}{x^2 + 1}$',
          '$\\frac{x}{x^2 + 1}$',
        ],
        correctAnswer: '$\\frac{2x}{x^2 + 1}$',
        explanation: 'Por regla de la cadena: $\\frac{d}{dx}[\\ln(u)] = \\frac{1}{u} \\cdot \\frac{du}{dx}$. Como $u = x^2 + 1$, $\\frac{du}{dx} = 2x$.',
      },
      {
        id: 'w-m-2',
        question: 'Sea la matriz $A = \\begin{pmatrix} 2 & 0 \\\\ 0 & 5 \\end{pmatrix}$. ¿Cuáles son sus autovalores (eigenvalues)?',
        conceptTested: 'Autovalores de matriz diagonal',
        options: ['$\\lambda_1 = 2, \\lambda_2 = 5$', '$\\lambda_1 = 10, \\lambda_2 = 0$', '$\\lambda = 7$', '$\\lambda_1 = -2, \\lambda_2 = -5$'],
        correctAnswer: '$\\lambda_1 = 2, \\lambda_2 = 5$',
        explanation: 'Para cualquier matriz diagonal, los autovalores corresponden exactamente a los elementos de la diagonal principal.',
      },
      {
        id: 'w-m-3',
        question: '¿Qué condición garantiza que un campo vectorial $\\vec{F} = (P, Q)$ en $\\mathbb{R}^2$ sea conservativo en un dominio simplemente conexo?',
        conceptTested: 'Criterio de campo conservativo',
        options: ['$\\frac{\\partial P}{\\partial y} = \\frac{\\partial Q}{\\partial x}$', '$\\frac{\\partial P}{\\partial x} = \\frac{\\partial Q}{\\partial y}$', '$\\nabla \\cdot \\vec{F} = 1$', '$P^2 + Q^2 = 0$'],
        correctAnswer: '$\\frac{\\partial P}{\\partial y} = \\frac{\\partial Q}{\\partial x}$',
        explanation: 'La igualdad de las derivadas cruzadas $\\frac{\\partial P}{\\partial y} = \\frac{\\partial Q}{\\partial x}$ es la condición necesaria y suficiente de rotacional nulo.',
      },
    ],
    coreProblems: [
      {
        title: 'Cálculo de Flujo y Teorema de Gauss en $\\mathbb{R}^3$',
        problemStatement: 'Dado el campo vectorial $\\vec{F}(x,y,z) = (2x + y) \\hat{i} + (z^2 - 3y) \\hat{j} + (4z + x) \\hat{k}$, evalúa el flujo neto saliente $\\iint_S \\vec{F} \\cdot d\\vec{S}$ a través de la superficie cerrada $S$ que encierra el cilindro sólido $x^2 + y^2 \\le 4$, con $0 \\le z \\le 3$. Justifica cada paso aplicando el Teorema de la Divergencia de Gauss: $$\\iint_S \\vec{F} \\cdot d\\vec{S} = \\iiint_V (\\nabla \\cdot \\vec{F}) dV$$',
        bloomLevel: 4,
        domainContext: 'Cálculo Vectorial Multivariable y Física Matemática',
        guidingQuestions: [
          'Calcula explícitamente la divergencia $\\nabla \\cdot \\vec{F} = \\frac{\\partial F_x}{\\partial x} + \\frac{\\partial F_y}{\\partial y} + \\frac{\\partial F_z}{\\partial z}$.',
          'Determina el volumen del cilindro $V = \\pi r^2 h$.',
          'Realiza la integral triple en coordenadas cilíndricas.',
        ],
        expectedKeyPoints: [
          'Divergencia $\\nabla \\cdot \\vec{F} = 2 - 3 + 4 = 3$',
          'Radio $r = 2$, altura $h = 3$',
          'Volumen $V = \\pi (2^2)(3) = 12\\pi$',
          'Flujo total = $3 \\times 12\\pi = 36\\pi$',
        ],
      },
    ],
  },

  'dom-tech-prog': {
    warmups: [
      {
        id: 'w-p-1',
        question: 'En Rust, ¿cuál es la diferencia principal entre `String` y `&str`?',
        conceptTested: 'Ownership y memory representation en Rust',
        options: [
          '`String` posee memoria en el heap y es mutable; `&str` es una vista inmutable (fat pointer) a una secuencia de bytes UTF-8.',
          '`String` se almacena en el stack y `&str` siempre se reserva en el heap.',
          'No hay diferencia, son alias sintácticos.',
          '`&str` permite reasignación de tamaño dinámico en tiempo de ejecución.',
        ],
        correctAnswer: '`String` posee memoria en el heap y es mutable; `&str` es una vista inmutable (fat pointer) a una secuencia de bytes UTF-8.',
        explanation: '`String` es un vector de bytes asignado en el heap que posee sus datos, mientras que `&str` es un slice inmutable compuesto por un puntero y una longitud.',
      },
      {
        id: 'w-p-2',
        question: '¿Cuál es la complejidad temporal promedio de inserción y búsqueda en una tabla hash con resolución de colisiones adecuada?',
        conceptTested: 'Complejidad algorítmica de Hash Tables',
        options: ['$O(1)$', '$O(\\log n)$', '$O(n)$', '$O(n^2)$'],
        correctAnswer: '$O(1)$',
        explanation: 'En promedio, una función hash uniforme distribuye las llaves con factor de carga bajo logrando tiempo amortizado $O(1)$.',
      },
    ],
    coreProblems: [
      {
        title: 'Diseño de Pipeline Concurrente con Canales y Manejo de Errores',
        problemStatement: 'Escribe una función en Python/Rust/JavaScript que reciba un flujo de enteros y filtre los números primos de forma concurrente, devolviendo la suma acumulada sin provocar condiciones de carrera. Incluye el manejo de límites de memoria (backpressure) y documenta los casos de prueba esperados.',
        bloomLevel: 3,
        domainContext: 'Programación y Concurrencia',
        codeSnippet: `// Caso base en Rust / Pseudocódigo
pub fn process_stream(data: Vec<i64>) -> i64 {
    // Implementa el filtrado y acumulación concurrente
    unimplemented!()
}`,
        testCases: [
          { input: '[2, 3, 4, 5, 6, 7, 8, 9, 10]', expectedOutput: '17', explanation: 'Primos: 2 + 3 + 5 + 7 = 17' },
          { input: '[1, 4, 6, 8, 9]', expectedOutput: '0', explanation: 'Ningún primo en la lista' },
        ],
        expectedKeyPoints: [
          'Verificación de primalidad eficiente $O(\\sqrt{n})$',
          'Sincronización segura sin data races',
          'Manejo de colecciones vacías o números negativos',
        ],
      },
    ],
  },
};

// Generate Weekly Study Plan
// Exclusively utilizing the context of:
// 1. "Nombre del Dominio / Tema" (domain.name)
// 2. "Ruta / Selector Principal" (domain.macroDomainId)
// 3. "Sub-Área o Especialidad" (domain.subArea)
// 4. "Base de Datos Conceptual" (domain.conceptDatabaseKey + databaseConcepts)
export function generateWeeklyStudyPlan(
  domain: LearningDomain,
  goalReference?: string,
  databaseConcepts: ConceptItem[] = []
): WeeklyStudyPlan {
  const daysOrder: Array<'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo'> = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo',
  ];

  // Derive topics strictly and exclusively from:
  // - Domain Name (Nombre del Dominio / Tema)
  // - SubArea (Sub-Área o Especialidad)
  // - Concept Database concepts (names, technical details, tables)
  const scopedConcepts = databaseConcepts.filter(
    (c) =>
      c.databaseKey === (domain.conceptDatabaseKey || `db-${domain.id}`) ||
      c.domainId === domain.id ||
      c.linkedDomainIds?.includes(domain.id)
  );

  const conceptTopics = scopedConcepts.map((c) => {
    const hasTable = Array.isArray(c.tableData) && c.tableData.length >= 2;
    return hasTable ? `${c.name} [Análisis de Tabla de Datos]` : c.name;
  });

  const rawTopics = [
    ...conceptTopics,
    ...(domain.topics.length > 0 ? domain.topics : []),
    `${domain.name}: ${domain.subArea}`,
  ].filter(Boolean);

  const uniqueScopedTopics = Array.from(new Set(rawTopics));
  const topicsPool = uniqueScopedTopics.length > 0 ? uniqueScopedTopics : [domain.name, domain.subArea];

  const days: WeeklyStudyPlanDay[] = daysOrder.map((dayName, idx) => {
    const isSun = dayName === 'Domingo';
    const assignedTopic = isSun
      ? `Repaso Espaciado Integral (SRS) de ${domain.name}`
      : topicsPool[idx % topicsPool.length];

    // Check if any scoped concept matching this topic has table data
    const matchedConcept = scopedConcepts.find(
      (c) => assignedTopic.includes(c.name) || c.name.includes(assignedTopic)
    );
    const hasTableData = Boolean(matchedConcept && Array.isArray(matchedConcept.tableData) && matchedConcept.tableData.length >= 2);

    // Bloom taxonomy progression throughout the week
    let bloomLevel: BloomLevel = 1;
    let isExtendedLesson = false;
    let estimatedMinutes = 20;

    if (isSun) {
      // Sunday: STRICTLY SRS / Spaced Repetition consolidation
      bloomLevel = 2; // Understand / Retrieve
      estimatedMinutes = 15;
    } else {
      switch (idx) {
        case 0: // Lunes: Fundamentos & Recordar
          bloomLevel = 1;
          estimatedMinutes = 20;
          break;
        case 1: // Martes: Comprensión conceptual
          bloomLevel = 2;
          estimatedMinutes = 25;
          break;
        case 2: // Miércoles: Aplicación de problemas
          bloomLevel = 3;
          estimatedMinutes = 30;
          break;
        case 3: // Jueves: Análisis & Depuración (Lección Larga)
          bloomLevel = 4;
          isExtendedLesson = true;
          estimatedMinutes = 45; // Plazo extendido
          break;
        case 4: // Viernes: Evaluación de Métodos / Optimización
          bloomLevel = 5;
          estimatedMinutes = 35;
          break;
        case 5: // Sábado: Modelado / Creación & Síntesis (Lección Larga)
          bloomLevel = 6;
          isExtendedLesson = true;
          estimatedMinutes = 50; // Plazo extendido
          break;
      }
    }

    const lessonObjective = isSun
      ? `Consolidación SRS de conceptos clave de ${domain.name} y ${domain.subArea} en memoria a largo plazo.`
      : hasTableData
      ? `Dominio analítico de ${assignedTopic} (${domain.subArea}) examinando registros tabulares estructurados (Nivel ${bloomLevel} de Bloom).`
      : `Dominio de ${assignedTopic} en ${domain.subArea} alcanzando el Nivel ${bloomLevel} de Bloom (${getBloomName(bloomLevel)}).`;

    const warmupDescription = isSun
      ? `Banco mixto de conceptos de ${domain.name} (${domain.conceptDatabaseKey || 'Base Conceptual'})`
      : `Activación de memoria de trabajo para ${assignedTopic}`;

    return {
      dayName,
      isSundaySRS: isSun,
      topic: assignedTopic,
      bloomLevel,
      estimatedMinutes,
      isExtendedLesson,
      objective: lessonObjective,
      warmupTopic: warmupDescription,
      completed: false,
    };
  });

  return {
    id: `plan-${domain.id}-${Date.now()}`,
    domainId: domain.id,
    domainName: domain.name,
    macroDomainId: domain.macroDomainId,
    weekTitle: `Plan de Lecciones Adaptativo: ${domain.name} (${domain.subArea})`,
    goalReference,
    createdAt: new Date().toISOString(),
    days,
  };
}

export function getBloomName(level: BloomLevel): string {
  switch (level) {
    case 1:
      return 'Recordar (Hechos y Términos)';
    case 2:
      return 'Entender (Explicación e Interpretación)';
    case 3:
      return 'Aplicar (Resolución y Ejecución)';
    case 4:
      return 'Analizar (Desglose y Depuración)';
    case 5:
      return 'Evaluar (Justificación y Optimización)';
    case 6:
      return 'Crear (Modelado y Síntesis Original)';
  }
}

// Generate the 3-step high-performance session:
// [ Warm-up / SRS (si hay conceptos previos) ] ──> [ 10-15 min: Núcleo del Examen / Práctica ] ──> [ 2 min: Retroalimentación & Métricas ]
// Calculate dynamic MCQ question count strictly between 3 and 10 based on duration and Bloom difficulty
export function calculateCoreMCQCount(
  durationMinutes: number,
  bloomLevel: BloomLevel = 3,
  isExtended: boolean = false
): number {
  // Base from duration: 15min -> 3, 20min -> 3, 25-30min -> 4-5, 35-45min -> 6-8, 50-60min+ -> 9-10
  let count = Math.round(durationMinutes / 6);
  if (isExtended || bloomLevel >= 5) {
    count += 1;
  }
  if (bloomLevel === 6) {
    count += 1;
  }
  return Math.max(3, Math.min(10, count));
}

// Generate multiple-choice questions directly from tableData of provided concepts
export function generateTableMCQQuestions(
  concepts: ConceptItem[],
  maxQuestions: number = 10
): CoreMCQQuestion[] {
  const questions: CoreMCQQuestion[] = [];
  const conceptsWithTables = (concepts || []).filter(
    (c) => Array.isArray(c.tableData) && c.tableData.length >= 2
  );

  if (conceptsWithTables.length === 0) return questions;

  for (const concept of conceptsWithTables) {
    const table = concept.tableData!;
    if (table.length < 2) continue;
    const columns = Object.keys(table[0] || {});
    if (columns.length < 2) continue;

    const primaryCol = columns[0];
    const attrCols = columns.slice(1);

    // Shuffle row indices for randomized variety on each generation
    const shuffledRowIndices = table.map((_, i) => i).sort(() => 0.5 - Math.random());

    for (let i = 0; i < shuffledRowIndices.length && questions.length < maxQuestions; i++) {
      const rIdx = shuffledRowIndices[i];
      const row = table[rIdx];
      const primaryVal = row[primaryCol];
      if (!primaryVal) continue;

      // Rotate target attribute column
      const targetCol = attrCols[(rIdx + i) % attrCols.length];
      const correctVal = row[targetCol];
      if (!correctVal) continue;

      // Extract unique values from other rows as distractors
      const otherVals = table
        .filter((_, idx) => idx !== rIdx)
        .map((r) => r[targetCol])
        .filter((v) => Boolean(v) && v !== correctVal);

      const uniqueDistractors = Array.from(new Set(otherVals));

      if (uniqueDistractors.length < 3) {
        uniqueDistractors.push(`Valor de control complementario para "${primaryVal}"`);
        uniqueDistractors.push(`Parámetro alternativo en "${concept.name}"`);
        uniqueDistractors.push(`No especificado en contexto estándar`);
      }

      const selectedDistractors = uniqueDistractors.slice(0, 3);
      const options = [correctVal, ...selectedDistractors].sort(() => 0.5 - Math.random());

      // Alternate question styles: direct lookup or reverse/analytical lookup
      const isReverse = i % 2 === 1 && table.length >= 3;
      const questionText = isReverse
        ? `[Tabla Conceptual: ${concept.name}] ¿Cuál de los siguientes elementos de **${primaryCol}** se asocia al atributo **${targetCol} = "${correctVal}"**?`
        : `En base a la tabla de **${concept.name}**: para **${primaryCol} = "${primaryVal}"**, ¿cuál es su **${targetCol}** correspondiente?`;

      const qOptions = isReverse
        ? [primaryVal, ...table.filter((_, idx) => idx !== rIdx).map((r) => r[primaryCol]).slice(0, 3)].sort(() => 0.5 - Math.random())
        : options;

      const qCorrect = isReverse ? primaryVal : correctVal;

      questions.push({
        id: `mcq-tbl-${concept.id}-${rIdx}-${Date.now()}-${i}`,
        question: questionText,
        options: qOptions,
        correctAnswer: qCorrect,
        explanation: `Dato verificado en la tabla de la Base Conceptual [${concept.name}]: el registro vincula [${primaryCol}: "${primaryVal}"] con [${targetCol}: "${correctVal}"].`,
        fromTable: true,
        sourceConceptName: concept.name,
        sourceColumn: targetCol,
      });
    }
  }

  return questions.slice(0, maxQuestions);
}

// Fallback high-yield domain MCQs when table data doesn't fill the required count (3 to 10)
export function generateDomainMCQQuestions(
  domain: LearningDomain,
  topic: string,
  bloomLevel: BloomLevel,
  count: number
): CoreMCQQuestion[] {
  const isMath =
    domain.macroDomainId === 'formal_quantitative' ||
    domain.name.toLowerCase().includes('matemática') ||
    domain.name.toLowerCase().includes('cálculo') ||
    domain.name.toLowerCase().includes('física');

  const isLanguage =
    domain.macroDomainId === 'linguistic_communication' ||
    domain.name.toLowerCase().includes('japonés') ||
    domain.name.toLowerCase().includes('jlpt') ||
    domain.name.toLowerCase().includes('inglés');

  const isCode =
    domain.macroDomainId === 'technological_applied' ||
    domain.name.toLowerCase().includes('programación') ||
    domain.name.toLowerCase().includes('software');

  const bank: CoreMCQQuestion[] = [];

  if (isMath) {
    bank.push(
      {
        id: `mcq-m-1-${Date.now()}`,
        question: `En el contexto de **${topic}**, ¿cuál es la derivada de la función compuesta $g(x) = e^{3x^2 - 1}$?`,
        options: ['$6x e^{3x^2 - 1}$', '$3x e^{3x^2 - 1}$', '$e^{3x^2 - 1}$', '$\\frac{6x}{3x^2 - 1}$'],
        correctAnswer: '$6x e^{3x^2 - 1}$',
        explanation: 'Por la regla de la cadena: $\\frac{d}{dx}[e^{u(x)}] = e^{u(x)} \\cdot u\'(x) = e^{3x^2 - 1} \\cdot (6x)$.',
      },
      {
        id: `mcq-m-2-${Date.now()}`,
        question: `¿Cuál es el valor de la integral definida $\\int_0^1 (3x^2 + 2x) dx$ aplicada a **${topic}**?`,
        options: ['$2$', '$1$', '$3$', '$\\frac{5}{2}$'],
        correctAnswer: '$2$',
        explanation: 'La antiderivada es $F(x) = x^3 + x^2$. Evaluando: $F(1) - F(0) = (1 + 1) - 0 = 2$.',
      },
      {
        id: `mcq-m-3-${Date.now()}`,
        question: `Para una matriz simétrica real $A$, ¿qué propiedad fundamental cumplen sus autovalores?`,
        options: [
          'Todos sus autovalores son estrictamente reales.',
          'Sus autovalores son siempre imaginarios puros.',
          'El determinante es invariablemente cero.',
          'No posee autovectores ortogonales.',
        ],
        correctAnswer: 'Todos sus autovalores son estrictamente reales.',
        explanation: 'Por el Teorema Espectral para operadores autoadjuntos, toda matriz simétrica real tiene autovalores reales y es diagonalizable ortogonalmente.',
      },
      {
        id: `mcq-m-4-${Date.now()}`,
        question: `¿Cuál de las siguientes condiciones define que una serie de potencias $\\sum a_n (x - c)^n$ converge absolutamente en $|x - c| < R$?`,
        options: [
          'El radio de convergencia $R = \\lim_{n\\to\\infty} \\left| \\frac{a_n}{a_{n+1}} \\right|$ si el límite existe.',
          'La serie alterna de signo en cada término par.',
          'El término general $a_n$ converge a 1.',
          'La suma parcial es monótona decreciente sin cota.',
        ],
        correctAnswer: 'El radio de convergencia $R = \\lim_{n\\to\\infty} \\left| \\frac{a_n}{a_{n+1}} \\right|$ si el límite existe.',
        explanation: 'Criterio del cociente de D\'Alembert para series de potencias: $R = 1/L$ donde $L = \\lim |a_{n+1}/a_n|$.',
      },
      {
        id: `mcq-m-5-${Date.now()}`,
        question: `En cálculo multivariable para **${topic}**, el gradiente $\\nabla f(x_0, y_0)$ apunta en:`,
        options: [
          'La dirección de máxima tasa de crecimiento de la función $f$.',
          'La dirección tangente a la curva de nivel.',
          'La dirección opuesta a la derivada direccional.',
          'Una dirección ortogonal al vector normal de la superficie.',
        ],
        correctAnswer: 'La dirección de máxima tasa de crecimiento de la función $f$.',
        explanation: 'El gradiente señala la dirección de máxima pendiente ascendente y su norma es el valor de dicha tasa máxima.',
      },
      {
        id: `mcq-m-6-${Date.now()}`,
        question: `¿Cuál es el criterio de Euler para la existencia de trayectorias en grafos conexos?`,
        options: [
          'A lo sumo dos vértices tienen grado impar.',
          'Todos los vértices tienen grado primo.',
          'El número de aristas es exactamente igual al número de vértices.',
          'El grafo es necesariamente bipartito completo.',
        ],
        correctAnswer: 'A lo sumo dos vértices tienen grado impar.',
        explanation: 'Un grafo conexo admite un camino euleriano si y solo si tiene exactamente 0 o 2 vértices de grado impar.',
      }
    );
  } else if (isLanguage) {
    bank.push(
      {
        id: `mcq-l-1-${Date.now()}`,
        question: `En relación con **${topic}**, ¿cuál es la función de la partícula **で** en la oración 「電車**で**行きます」?`,
        options: [
          'Indica el medio o instrumento con el que se realiza la acción.',
          'Indica el sujeto gramatical intransitivo.',
          'Indica el punto de partida temporal.',
          'Marca el objeto directo que recibe la acción.',
        ],
        correctAnswer: 'Indica el medio o instrumento con el que se realiza la acción.',
        explanation: 'La partícula で marca el instrumento, herramienta o medio de transporte empleado.',
      },
      {
        id: `mcq-l-2-${Date.now()}`,
        question: `Para los verbos de Grupo 1 (Godan) terminados en **く** (como 書く / kaku), ¿cuál es su terminación en Forma Te (て)?`,
        options: ['〜いて (ej. 書いて / kaite)', '〜って (ej. 書って)', '〜んで (ej. 書んで)', '〜して (ej. 書して)'],
        correctAnswer: '〜いて (ej. 書いて / kaite)',
        explanation: 'Los verbos Godan que terminan en く cambian a いて (con la excepción de 行く -> 行って).',
      },
      {
        id: `mcq-l-3-${Date.now()}`,
        question: `¿Cuál es la diferencia sintáctica esencial entre las partículas **は** (wa) y **が** (ga)?`,
        options: [
          '**は** marca el tópico contextual general; **が** enfatiza el sujeto gramatical específico.',
          '**は** solo se utiliza en preguntas; **が** solo en respuestas afirmativas.',
          'No existe distinción, son intercambiables en cualquier contexto.',
          '**が** marca el tiempo cronológico y **は** el lugar.',
        ],
        correctAnswer: '**は** marca el tópico contextual general; **ga** enfatiza el sujeto gramatical específico.',
        explanation: 'は establece el tema («en cuanto a...»), mientras que が focaliza el sujeto («este es el que...»).',
      },
      {
        id: `mcq-l-4-${Date.now()}`,
        question: `¿Qué estructura gramatical se utiliza para expresar permiso («está permitido / se puede hacer»)?`,
        options: ['[Forma て] + もいいです', '[Forma ない] + でください', '[Forma Diccionario] + ことができます', '[Raíz ます] + たいです'],
        correctAnswer: '[Forma て] + もいいです',
        explanation: 'La estructura 〜てもいいです expresa permiso formal.',
      },
      {
        id: `mcq-l-5-${Date.now()}`,
        question: `En comprensión y lectura de **${topic}**, ¿qué conector discursivo expresa contraste formal («sin embargo»)?`,
        options: ['しかし (shikashi) / けれども', 'そして (soshite)', 'だから (dakara)', 'それから (sorekara)'],
        correctAnswer: 'しかし (shikashi) / けれども',
        explanation: 'しかし y けれども introducen una cláusula de contraste o concesión.',
      }
    );
  } else if (isCode) {
    bank.push(
      {
        id: `mcq-c-1-${Date.now()}`,
        question: `En el diseño de sistemas para **${topic}**, ¿cuál es la ventaja de la inmutabilidad de estructuras de datos?`,
        options: [
          'Previene efectos secundarios y facilita la concurrencia segura sin bloqueos complejos.',
          'Reduce siempre el consumo de memoria a la mitad.',
          'Elimina la necesidad de compiladores o tipado estático.',
          'Garantiza ejecución en tiempo $O(1)$ para cualquier búsqueda.',
        ],
        correctAnswer: 'Previene efectos secundarios y facilita la concurrencia segura sin bloqueos complejos.',
        explanation: 'Los datos inmutables eliminan las condiciones de carrera (data races) al ser leídos simultáneamente por múltiples hilos sin mutación compartida.',
      },
      {
        id: `mcq-c-2-${Date.now()}`,
        question: `¿Cuál es la complejidad temporal en el peor caso para la búsqueda en un Árbol Binario de Búsqueda (BST) no balanceado?`,
        options: ['$O(n)$', '$O(\\log n)$', '$O(1)$', '$O(n \\log n)$'],
        correctAnswer: '$O(n)$',
        explanation: 'Si el BST se degenera en una lista enlazada, la búsqueda recorre todos los nodos alcanzando $O(n)$. Por ello se usan árboles auto-balanceables como AVL o Red-Black ($O(\\log n)$).',
      },
      {
        id: `mcq-c-3-${Date.now()}`,
        question: `¿Qué principio SOLID establece que los módulos de alto nivel no deben depender de módulos de bajo nivel, sino de abstracciones?`,
        options: [
          'Principio de Inversión de Dependencias (DIP)',
          'Principio de Responsabilidad Única (SRP)',
          'Principio de Sustitución de Liskov (LSP)',
          'Principio de Segregación de Interfaces (ISP)',
        ],
        correctAnswer: 'Principio de Inversión de Dependencias (DIP)',
        explanation: 'El Principio de Inversión de Dependencias desacopla las capas directas mediante interfaces y contratos abstractos.',
      },
      {
        id: `mcq-c-4-${Date.now()}`,
        question: `En arquitecturas asíncronas para **${topic}**, ¿qué mecanismo previene la saturación del consumidor cuando el productor es más rápido?`,
        options: [
          'Contrapresión (Backpressure)',
          'Recursión de cola infinita',
          'Polling activo continuo sin retardo',
          'Desactivación del buffer de memoria',
        ],
        correctAnswer: 'Contrapresión (Backpressure)',
        explanation: 'El backpressure regula el flujo de emisión para que el productor ajuste su velocidad a la capacidad real de procesamiento del consumidor.',
      }
    );
  } else {
    bank.push(
      {
        id: `mcq-s-1-${Date.now()}`,
        question: `En relación con **${topic}**, ¿cuál es el criterio fundamental para evaluar la viabilidad de un proyecto bajo la métrica del Valor Actual Neto (VAN)?`,
        options: [
          'El VAN debe ser mayor que cero ($VAN > 0$), indicando que genera valor por encima de la tasa de descuento.',
          'El VAN debe ser exactamente igual a la tasa interna de retorno.',
          'El VAN solo se calcula cuando no existen costos iniciales.',
          'Un VAN negativo garantiza el retorno del capital antes del primer ciclo.',
        ],
        correctAnswer: 'El VAN debe ser mayor que cero ($VAN > 0$), indicando que genera valor por encima de la tasa de descuento.',
        explanation: 'Un VAN > 0 significa que los flujos netos descontados superan la inversión inicial a la tasa de costo de capital requerida.',
      },
      {
        id: `mcq-s-2-${Date.now()}`,
        question: `¿Cuál es el propósito del principio de debida diligencia (Due Diligence) en la gestión de **${topic}**?`,
        options: [
          'Identificar, evaluar y mitigar riesgos legales, financieros y operativos antes de tomar decisiones vinculantes.',
          'Acelerar la firma de acuerdos sin auditoría previa.',
          'Eliminar cualquier auditoría externa.',
          'Delegar la responsabilidad civil a organismos gubernamentales.',
        ],
        correctAnswer: 'Identificar, evaluar y mitigar riesgos legales, financieros y operativos antes de tomar decisiones vinculantes.',
        explanation: 'La debida diligencia asegura el conocimiento cabal del estado de cumplimiento y contingencias de una entidad o proyecto.',
      },
      {
        id: `mcq-s-3-${Date.now()}`,
        question: `En análisis normativo y metodológico, ¿qué representa el Nivel ${bloomLevel} de Bloom (${getBloomName(bloomLevel)})?`,
        options: [
          `Capacidad demostrada de ${getBloomName(bloomLevel).toLowerCase()} en escenarios complejos.`,
          'Repetición literal y pasiva de definiciones de memoria.',
          'Ausencia de contrastación empírica.',
          'Sustitución de datos por opiniones no contrastadas.',
        ],
        correctAnswer: `Capacidad demostrada de ${getBloomName(bloomLevel).toLowerCase()} en escenarios complejos.`,
        explanation: `La Taxonomía de Bloom clasifica los objetivos cognitivos; el Nivel ${bloomLevel} demanda competencia activa y fundamentada.`,
      }
    );
  }

  // Shuffle and pick needed
  return bank.sort(() => 0.5 - Math.random()).slice(0, count);
}

// Core Problem Generator strictly respecting:
// 1. "Nombre del Dominio / Tema" (domain.name)
// 2. "Ruta / Selector Principal" (domain.macroDomainId)
// 3. "Sub-Área o Especialidad" (domain.subArea)
// 4. "Base de Datos Conceptual" (domain.conceptDatabaseKey, concepts)
export function generateCoreProblemForTopic(
  domain: LearningDomain,
  topic: string,
  bloomLevel: BloomLevel,
  isSun: boolean = false,
  concepts: ConceptItem[] = []
): CoreExamProblem {
  const selectedTopic = topic || (domain.topics[0] || domain.name);
  const bloom = isSun ? 2 : (bloomLevel || 3);

  const isMathOrPhysics =
    domain.macroDomainId === 'formal_quantitative' ||
    domain.name.toLowerCase().includes('matemática') ||
    domain.name.toLowerCase().includes('física') ||
    domain.name.toLowerCase().includes('cálculo') ||
    domain.name.toLowerCase().includes('álgebra');

  const isLanguageOrLinguistics =
    domain.macroDomainId === 'linguistic_communication' ||
    domain.name.toLowerCase().includes('japonés') ||
    domain.name.toLowerCase().includes('jlpt') ||
    domain.name.toLowerCase().includes('inglés') ||
    domain.name.toLowerCase().includes('idioma') ||
    domain.name.toLowerCase().includes('lingüística');

  const isCode =
    domain.macroDomainId === 'technological_applied' ||
    domain.name.toLowerCase().includes('programación') ||
    domain.name.toLowerCase().includes('software') ||
    domain.name.toLowerCase().includes('sistemas') ||
    domain.name.toLowerCase().includes('c++') ||
    domain.name.toLowerCase().includes('python');

  if (isSun) {
    return {
      title: `Consolidación de Memoria Espaciada (SRS): ${selectedTopic}`,
      problemStatement: isMathOrPhysics
        ? `Realiza una reconstrucción analítica y esquemática de los conceptos estudiados en **${selectedTopic}** (${domain.subArea}). Formula las ecuaciones principales en formato LaTeX ($..$), deduce los teoremas centrales y analiza los errores comunes de cálculo.`
        : isLanguageOrLinguistics
        ? `Realiza un repaso espaciado de consolidación para **${selectedTopic}** (${domain.subArea}). Escribe 3 oraciones completas aplicando las estructuras gramaticales, kanji o vocabulario clave estudiados esta semana, explicando la función de cada partícula.`
        : isCode
        ? `Reflexión técnica y análisis de memoria sobre **${selectedTopic}** (${domain.subArea}). Resume la complejidad asintótica Big-O, las estructuras de datos óptimas y los casos de prueba críticos para evitar regresiones.`
        : `Síntesis conceptual y estudio de casos en **${selectedTopic}** (${domain.subArea}). Desglosa los 3 principios o estándares normativos principales y sus implicaciones prácticas.`,
      bloomLevel: 2,
      domainContext: `Repaso Espaciado de Domingo - ${domain.name} (${domain.subArea})`,
      expectedKeyPoints: [
        'Recuperación activa sin consultar notas de apoyo',
        'Identificación de los 3 puntos de error recurrentes',
        'Síntesis estructurada y rigurosa en el contexto del tema',
      ],
    };
  }

  if (isMathOrPhysics) {
    // Generate varied math problem archetypes with dynamic numbers
    const k1 = Math.floor(Math.random() * 4) + 2;
    const k2 = Math.floor(Math.random() * 3) + 1;
    const mathArchetypes: CoreExamProblem[] = [
      {
        title: `Problema Aplicado en: ${selectedTopic} - Teorema Fundamental y Leibniz`,
        problemStatement: `Sea la función acumuladora definida para **${selectedTopic}** en la sub-área **${domain.subArea}**:\n$$G(x) = \\int_{${k1}x}^{x^2 + ${k2}} \\frac{e^{-t^2}}{\\sqrt{t^2 + 1}} dt$$\nAplica la regla de derivación bajo el signo integral de Leibniz y el Teorema Fundamental del Cálculo para deducir analíticamente $G'(x)$. Demuestra detalladamente cada paso expresando las derivadas en notación LaTeX ($..$ y $$..$$).`,
        bloomLevel: bloom,
        domainContext: `${domain.name} - ${domain.subArea} / ${selectedTopic}`,
        guidingQuestions: [
          'Identifica formalmente los límites variables superior $u(x) = x^2 + ' + k2 + '$ e inferior $v(x) = ' + k1 + 'x$.',
          'Aplica la fórmula general $\\frac{d}{dx}\\int_{v(x)}^{u(x)} f(t)dt = f(u(x))u\'(x) - f(v(x))v\'(x)$.',
          'Simplifica algebraicamente la expresión resultante y analiza su comportamiento asintótico.',
        ],
        expectedKeyPoints: [
          `Identificación de $u'(x) = 2x$ y $v'(x) = ${k1}$`,
          `Sustitución en el integrando: $f(u(x)) = \\frac{e^{-(x^2+${k2})^2}}{\\sqrt{(x^2+${k2})^2 + 1}}$`,
          `Expresión final simplificada en LaTeX sin omitir la derivada interna`,
        ],
      },
      {
        title: `Problema Aplicado en: ${selectedTopic} - Optimización Multivariable`,
        problemStatement: `Para el modelado de **${selectedTopic}** en **${domain.subArea}**, se busca extremar la función analítica:\n$$f(x, y, z) = ${k1}x^2 + ${k2}y^2 + z^2$$\nsujeta a la restricción geométrica esférica:\n$$g(x, y, z) = x^2 + y^2 + z^2 - ${k1 * 4} = 0$$\nFormula el sistema de multiplicadores de Lagrange $\\nabla f = \\lambda \\nabla g$, halla todos los puntos críticos y clasifica los extremos absolutos justificando la compacidad del dominio.`,
        bloomLevel: bloom,
        domainContext: `${domain.name} - ${domain.subArea} / ${selectedTopic}`,
        guidingQuestions: [
          'Calcula los vectores gradiente $\\nabla f$ y $\\nabla g$ en coordenadas cartesianas.',
          'Plantea y resuelve el sistema algebraico desacoplando cada variable respecto al multiplicador $\\lambda$.',
          'Evalúa la función objetivo en los candidatos encontrados y determina el valor máximo y mínimo.',
        ],
        expectedKeyPoints: [
          'Gradientes colineales $\\nabla f = \\lambda \\nabla g$ bien expresados',
          'Resolución completa de los casos singulares para cada coordenada',
          'Identificación de los valores extremos absolutos en la esfera',
        ],
      },
      {
        title: `Problema Aplicado en: ${selectedTopic} - Teorema de la Divergencia de Gauss`,
        problemStatement: `Dado el campo vectorial tridimensional formulado en **${selectedTopic}**:\n$$\\vec{F}(x,y,z) = (${k1}x + y) \\hat{i} + (${k2}z - y) \\hat{j} + (4z + x^2) \\hat{k}$$\nCalcula el flujo saliente neto $\\iint_S \\vec{F} \\cdot d\\vec{S}$ a través de la superficie cerrada $S$ del sólido acotado por $x^2 + y^2 \\le ${k1 * k1}$ y $0 \\le z \\le ${k2 + 2}$. Compara la integral de superficie directa con la integral de volumen utilizando el Teorema de Gauss: $$\\iiint_V (\\nabla \\cdot \\vec{F}) dV$$`,
        bloomLevel: bloom,
        domainContext: `${domain.name} - ${domain.subArea} / ${selectedTopic}`,
        guidingQuestions: [
          'Calcula la divergencia escalar $\\nabla \\cdot \\vec{F} = \\frac{\\partial F_x}{\\partial x} + \\frac{\\partial F_y}{\\partial y} + \\frac{\\partial F_z}{\\partial z}$.',
          'Parametriza el volumen del cilindro en coordenadas cilíndricas.',
          'Concluye con el valor numérico exacto en múltiplos de $\\pi$.',
        ],
        expectedKeyPoints: [
          `Divergencia calculada: $\\nabla \\cdot \\vec{F} = ${k1} - 1 + 4 = ${k1 + 3}$`,
          `Volumen del cilindro: $V = \\pi r^2 h$ con $r = ${k1}$, $h = ${k2 + 2}$`,
          'Flujo total exacto derivado del teorema',
        ],
      },
      {
        title: `Problema Aplicado en: ${selectedTopic} - Diagonalización y Teorema Espectral`,
        problemStatement: `En el estudio algebraico de **${selectedTopic}** en **${domain.subArea}**, se analiza la transformación lineal representada por la matriz simétrica:\n$$A = \\begin{pmatrix} ${k1} & ${k2} \\\\ ${k2} & ${k1} \\end{pmatrix}$$\n1. Deduce los autovalores $\\lambda_1, \\lambda_2$ resolviendo el polinomio característico $\\det(A - \\lambda I) = 0$.\n2. Halla los autovectores normalizados correspondientes.\n3. Construye la matriz ortogonal $P$ tal que $P^T A P = D$ y calcula la exponencial matricial $e^{At}$.`,
        bloomLevel: bloom,
        domainContext: `${domain.name} - ${domain.subArea} / ${selectedTopic}`,
        guidingQuestions: [
          'Plantea la ecuación cuadrática característica.',
          'Verifica la ortogonalidad de los autovectores mediante el producto interno.',
          'Expresa la solución matricial en notación limpia de LaTeX.',
        ],
        expectedKeyPoints: [
          `Autovalores exactos: $\\lambda_1 = ${k1 + k2}$, $\\lambda_2 = ${k1 - k2}$`,
          'Base ortonormal de autovectores en $\\mathbb{R}^2$',
          'Matriz diagonal $D$ y aplicación del Teorema Espectral',
        ],
      },
    ];

    const chosenIdx = Math.floor(Math.random() * mathArchetypes.length);
    return mathArchetypes[chosenIdx];
  }

  if (isLanguageOrLinguistics) {
    const isJLPT = domain.name.toUpperCase().includes('JLPT') || domain.name.toLowerCase().includes('japonés');
    if (isJLPT) {
      const jpArchetypes: CoreExamProblem[] = [
        {
          title: `Problema Aplicado en: ${selectedTopic} - Análisis Sintáctico y Partículas`,
          problemStatement: `Analiza y completa el siguiente ejercicio de ${domain.name} (Sub-área: ${domain.subArea}) enfocado en **${selectedTopic}**:\n\n1. Traduce y desglosa la función de cada marcador gramatical en la siguiente oración contextual:\n「田中さんは部長**に**新しいプロジェクトのリーダーを**引き受けさせられた**。」\n2. Explica la estructura de voz causativo-pasiva (使役受身形) y por qué se emplea la partícula **に** para marcar al agente que impone la acción.\n3. Redacta 2 oraciones originales de nivel ${domain.level || 'avanzado'} aplicando esta misma construcción en un contexto laboral formal.`,
          bloomLevel: bloom,
          domainContext: `${domain.name} - ${domain.subArea} / ${selectedTopic}`,
          guidingQuestions: [
            '¿Quién realiza la acción material y quién experimenta la obligación involuntaria?',
            '¿Cómo se transforma el verbo 引き受ける a su forma causativo-pasiva?',
            '¿Qué matiz psicológico o discursivo aporta esta conjugación frente a la pasiva simple?',
          ],
          expectedKeyPoints: [
            'Identificación precisa de la causativo-pasiva (引き受けさせられる)',
            'Análisis sintáctico del agente causante marcado por に',
            'Producción de dos oraciones gramaticalmente impecables y contextualizadas',
          ],
        },
        {
          title: `Problema Aplicado en: ${selectedTopic} - Honoríficos y Registro Keigo`,
          problemStatement: `En el ámbito de ${domain.subArea} para **${selectedTopic}**, un cliente corporativo envía una solicitud de reunión. Transforma el siguiente borrador informal en un mensaje formal en registro Keigo impecable:\n\n*Borrador:* 「明日3時にあなたのオフィスに行って、契約書を見せます。」\n\n1. Convierte los verbos 行く (ir) y 見せる (mostrar) a sus correspondientes formas de humildad (Kenjougo / 謙譲語) y cortesía (Teineigo).\n2. Aplica las fórmulas de saludo corporativo y cierre protocolar estándar japonés.\n3. Explica detalladamente por qué el uso de Sonkeigo sería incorrecto para las acciones propias del emisor.`,
          bloomLevel: bloom,
          domainContext: `${domain.name} - ${domain.subArea} / ${selectedTopic}`,
          guidingQuestions: [
            '¿Cuál es la forma humilde adecuada para 行く (ej. 伺う o 参る)?',
            '¿Cómo se convierte 見せる en expresión de servicio (ご覧に入れる o お見せする)?',
            '¿Cómo se sustituye あなた por el término honorífico corporativo (御社 / 貴社)?',
          ],
          expectedKeyPoints: [
            'Uso correcto de Kenjougo para las acciones del propio hablante (伺います / お目にかかります)',
            'Distinción rigurosa entre Sonkeigo y Kenjougo sin errores de "doble honorífico"',
            'Redacción corporativa natural y pulcra',
          ],
        },
        {
          title: `Problema Aplicado en: ${selectedTopic} - Discriminación de Condicionales`,
          problemStatement: `Examina el uso de las 4 formas condicionales en **${selectedTopic}** (〜たら, 〜ば, 〜なら, 〜と). Para cada uno de los siguientes enunciados, justifica cuál condicional es el único gramaticalmente admisible y por qué:\n\n1. 「春になる**［？］**、桜の花が咲きます。」 (Fenómeno natural inevitable)\n2. 「東京へ行く**［？］**、新幹線が一番便利ですよ。」 (Consejo basado en la intención del interlocutor)\n3. Redacta un párrafo continuo integrando al menos dos de estas estructuras con precisión semántica.`,
          bloomLevel: bloom,
          domainContext: `${domain.name} - ${domain.subArea} / ${selectedTopic}`,
          guidingQuestions: [
            '¿Qué restricción tiene 〜と respecto a mandatos o sugerencias en la cláusula principal?',
            '¿Por qué 〜なら toma como premisa el plan o tópico expresado por el oyente?',
            '¿Qué valor aporta 〜たら en la posterioridad temporal de la acción?',
          ],
          expectedKeyPoints: [
            'Identificación de 〜と para consecuencias naturales automáticas',
            'Identificación de 〜なら para asesoramiento condicionado al tópico',
            'Párrafo demostrativo con cohesión gramatical coherente',
          ],
        },
      ];
      return jpArchetypes[Math.floor(Math.random() * jpArchetypes.length)];
    } else {
      return {
        title: `Problema Aplicado en: ${selectedTopic} - Análisis y Cohesión Textual`,
        problemStatement: `Desarrolla un análisis crítico y redacta una composición estructurada de 2 párrafos sobre **${selectedTopic}** en el ámbito de ${domain.subArea}. Demuestra dominio de conectores discursivos de concesión, causa y consecuencia, precisión léxica y coherencia sintáctica avanzada sin ambigüedades.`,
        bloomLevel: bloom,
        domainContext: `${domain.name} - ${domain.subArea} / ${selectedTopic}`,
        guidingQuestions: [
          '¿Qué marcadores de cohesión y subordinación emplearás para asegurar la fluidez?',
          '¿Cómo se estructuran la tesis, los argumentos y la conclusión?',
        ],
        expectedKeyPoints: [
          'Uso correcto de marcadores discursivos formales',
          'Riqueza léxica y ausencia de redundancias',
          'Cohesión interparrafal impecable',
        ],
      };
    }
  }

  if (isCode) {
    const codeArchetypes: CoreExamProblem[] = [
      {
        title: `Problema Aplicado en: ${selectedTopic} - Pipeline Concurrente y Canales`,
        problemStatement: `Diseña e implementa una canalización concurrente para **${selectedTopic}** en **${domain.subArea}**. El sistema debe procesar un flujo continuo de paquetes de datos a través de trabajadores (worker pool) con canal acotado (bounded buffer) para garantizar contrapresión (backpressure), evitando bloqueos y fugas de memoria.`,
        bloomLevel: bloom,
        domainContext: `${domain.name} - ${domain.subArea} / ${selectedTopic}`,
        codeSnippet: `// Interfaz de procesamiento para ${selectedTopic}
async function processPipeline(stream: AsyncIterable<DataPacket>, concurrency: number): Promise<SummaryReport> {
  // Implementa el pool de trabajadores y manejo de backpressure
  return { processed: 0, errors: [] };
}`,
        testCases: [
          { input: 'stream = [p1, p2, p3], concurrency = 2', expectedOutput: '{ processed: 3, errors: [] }', explanation: 'Flujo nominal con sincronización correcta' },
          { input: 'stream = [], concurrency = 4', expectedOutput: '{ processed: 0, errors: [] }', explanation: 'Manejo de flujo vacío sin excepciones' },
        ],
        expectedKeyPoints: [
          'Manejo de concurrencia acotada sin saturación de memoria',
          'Sincronización segura de estados compartidos (locks / channels)',
          'Propagación y captura de errores sin interrupción catastrófica',
        ],
      },
      {
        title: `Problema Aplicado en: ${selectedTopic} - Caché LRU con Tiempo Constante`,
        problemStatement: `Implementa una estructura de almacenamiento en memoria caché con política de desalojo Least Recently Used (LRU) para **${selectedTopic}** en **${domain.subArea}**. Las operaciones \`get(key)\` y \`put(key, value)\` deben ejecutarse estrictamente en tiempo amortizado $O(1)$. Justifica la elección de estructuras de datos combinadas.`,
        bloomLevel: bloom,
        domainContext: `${domain.name} - ${domain.subArea} / ${selectedTopic}`,
        codeSnippet: `class LRUCache<K, V> {
  private capacity: number;
  constructor(capacity: number) { this.capacity = capacity; }
  get(key: K): V | undefined { /* O(1) */ return undefined; }
  put(key: K, value: V): void { /* O(1) con desalojo LRU */ }
}`,
        testCases: [
          { input: 'cache(2); put(1, A); put(2, B); get(1); put(3, C); get(2);', expectedOutput: 'undefined', explanation: 'La llave 2 es desalojada al ser la menos recientemente usada' },
        ],
        expectedKeyPoints: [
          'Combinación de Hash Map con Lista Doblemente Enlazada',
          'Actualización de nodos al frente en tiempo $O(1)$',
          'Desalojo correcto del nodo final al exceder la capacidad',
        ],
      },
      {
        title: `Problema Aplicado en: ${selectedTopic} - Ordenación Topológica y Detección de Ciclos`,
        problemStatement: `Para el grafo de dependencias de **${selectedTopic}** en **${domain.subArea}**, escribe una función que determine el orden de ejecución válido o señale la existencia de una dependencia circular (ciclo). Analiza la complejidad en tiempo y memoria $O(V + E)$.`,
        bloomLevel: bloom,
        domainContext: `${domain.name} - ${domain.subArea} / ${selectedTopic}`,
        codeSnippet: `function findExecutionOrder(numTasks: number, prerequisites: [number, number][]): number[] {
  // Retorna el orden lineal o un arreglo vacío si hay ciclo
  return [];
}`,
        testCases: [
          { input: 'numTasks = 4, prereqs = [[1,0],[2,0],[3,1],[3,2]]', expectedOutput: '[0, 1, 2, 3] (o [0, 2, 1, 3])', explanation: 'Orden topológico admisible' },
          { input: 'numTasks = 2, prereqs = [[1,0],[0,1]]', expectedOutput: '[]', explanation: 'Ciclo detectado' },
        ],
        expectedKeyPoints: [
          'Algoritmo de Kahn con grados de entrada (in-degree) o DFS con 3 estados',
          'Detección exhaustiva de componentes cíclicos',
          'Complejidad óptima $O(V + E)$ demostrada',
        ],
      },
    ];
    return codeArchetypes[Math.floor(Math.random() * codeArchetypes.length)];
  }

  // Normative / Social / Corporate
  const socialArchetypes: CoreExamProblem[] = [
    {
      title: `Problema Aplicado en: ${selectedTopic} - Auditoría de Conformidad y Riesgos`,
      problemStatement: `Analiza críticamente el escenario aplicado para **${selectedTopic}** dentro de la sub-área **${domain.subArea}**. Desglosa los factores normativos y operativos involucrados, evalúa las alternativas de acción con base en los estándares vigentes y formula una resolución ejecutiva fundamentada en matriz de riesgos.`,
      bloomLevel: bloom,
      domainContext: `${domain.name} - ${domain.subArea} / ${selectedTopic}`,
      guidingQuestions: [
        '¿Cuáles son los principios rectores aplicables a este caso?',
        '¿Qué riesgos o contingencias surgen al omitir el estándar correspondiente?',
        '¿Cuál es la estrategia de mitigación más eficiente?',
      ],
      expectedKeyPoints: [
        'Identificación de los principios teóricos rectores',
        'Justificación basada en evidencia o normativa vigente',
        'Propuesta conclusiva coherente y aplicable',
      ],
    },
    {
      title: `Problema Aplicado en: ${selectedTopic} - Evaluación Financiera y VAN/TIR`,
      problemStatement: `Para un proyecto estratégico en **${selectedTopic}** (${domain.subArea}), formula el flujo neto descontado proyectado a 5 años considerando una tasa de costo de capital $WACC = 10\\%$. Evalúa la viabilidad si el $VAN > 0$ y discute la sensibilidad frente a una desviación del $15\\%$ en costos operativos.`,
      bloomLevel: bloom,
      domainContext: `${domain.name} - ${domain.subArea} / ${selectedTopic}`,
      guidingQuestions: [
        'Plantea la ecuación matemática del $VAN = \\sum_{t=1}^n \\frac{F_t}{(1+r)^t} - I_0$.',
        'Analiza cómo la Tasa Interna de Retorno (TIR) interactúa con la tasa de descuento.',
        'Emite una recomendación de inversión fundamentada.',
      ],
      expectedKeyPoints: [
        'Fórmula analítica del VAN bien planteada',
        'Análisis de sensibilidad y margen de seguridad',
        'Recomendación ejecutiva con sustento cuantitativo',
      ],
    },
  ];
  return socialArchetypes[Math.floor(Math.random() * socialArchetypes.length)];
}

// Generate Warmup Retrieval Questions Strictly using the 4 Context Anchors:
// 1. "Nombre del Dominio / Tema"
// 2. "Ruta / Selector Principal"
// 3. "Sub-Área o Especialidad"
// 4. "Base de Datos Conceptual" (including definitions, formulas, terms, and table data)
export function generateWarmupQuestionsFrom4Contexts(
  domain: LearningDomain,
  topic: string,
  concepts: ConceptItem[] = []
): WarmupQuestion[] {
  const relevantConcepts = concepts.filter(
    (c) =>
      c.domainId === domain.id ||
      c.databaseKey === (domain.conceptDatabaseKey || `db-${domain.id}`) ||
      c.linkedDomainIds?.includes(domain.id)
  );

  const warmups: WarmupQuestion[] = [];

  // 1. Check if any concept has tableData
  const conceptsWithTables = relevantConcepts.filter(
    (c) => Array.isArray(c.tableData) && c.tableData.length >= 2
  );

  if (conceptsWithTables.length > 0) {
    const cTable = conceptsWithTables[0];
    const tbl = cTable.tableData!;
    const cols = Object.keys(tbl[0] || {});
    if (cols.length >= 2) {
      const primaryCol = cols[0];
      const targetCol = cols[1];
      const row0 = tbl[0];
      const pVal = row0[primaryCol];
      const tVal = row0[targetCol];
      const distractors = tbl.slice(1, 4).map((r) => r[targetCol]).filter((v) => Boolean(v) && v !== tVal);
      while (distractors.length < 3) {
        distractors.push(`Valor de control inverso para ${pVal}`);
      }
      warmups.push({
        id: `w-tbl-${cTable.id}`,
        question: `[Recuperación de Tabla Conceptual - ${cTable.name}] En la sub-área "${domain.subArea}": para **${primaryCol} = "${pVal}"**, ¿cuál es el valor registrado de **${targetCol}**?`,
        conceptTested: `${cTable.name} (${targetCol})`,
        options: [tVal, ...distractors.slice(0, 3)].sort(() => 0.5 - Math.random()),
        correctAnswer: tVal,
        explanation: `Verificado directamente en la tabla de la Base Conceptual [${cTable.name}]: [${primaryCol}: "${pVal}"] se empareja con [${targetCol}: "${tVal}"].`,
      });
    }
  }

  // 2. Next, use concept items with technicalDetails or descriptions
  for (const c of relevantConcepts) {
    if (warmups.length >= 3) break;
    const isAlreadyTested = warmups.some((w) => w.conceptTested.includes(c.name));
    if (isAlreadyTested) continue;

    const correct = c.technicalDetails || `Dominio exacto de ${c.name} en ${domain.subArea}`;
    warmups.push({
      id: `w-ctx-${c.id}`,
      question: `[Activación Conceptual: ${domain.name} / ${domain.subArea}] Respecto a **${c.name}**: ${c.description}`,
      conceptTested: c.name,
      options: [
        correct,
        `Contradicción conceptual directa para ${c.name}`,
        `Definición alternativa desfasada de ${c.name}`,
        `Aproximación empírica errónea de ${c.name}`,
      ].sort(() => 0.5 - Math.random()),
      correctAnswer: correct,
      explanation: `Concepto en la Base de Datos Conceptual (${c.databaseName || domain.name}): ${c.name}. ${c.notes || ''}`,
    });
  }

  // 3. If still fewer than 2, generate domain & sub-area specific retrieval questions
  if (warmups.length < 2) {
    const macroTrackNames: Record<string, string> = {
      formal_quantitative: 'Sistemas Físicos y Matemáticos',
      linguistic_communication: 'Culturas e Idiomas',
      technological_applied: 'Código y Tecnología',
      conceptual_normative_social: 'Sociedad y Entorno',
    };
    const trackLabel = macroTrackNames[domain.macroDomainId] || 'Ruta General';

    warmups.push({
      id: `w-dom-1-${domain.id}`,
      question: `[Calentamiento Previo: ${domain.name}] En la sub-área "${domain.subArea}" (${trackLabel}), ¿cuál es el principio organizador para abordar "${topic || domain.name}"?`,
      conceptTested: `${domain.name} - ${domain.subArea}`,
      options: [
        `Identificar variables fundamentales, axiomas y restricciones específicas de ${domain.subArea}.`,
        `Memorizar resultados sin verificar condiciones de contorno.`,
        `Omitir la nomenclatura estándar de ${domain.name}.`,
        `Aplicar heurísticas no fundamentadas teóricamente.`,
      ],
      correctAnswer: `Identificar variables fundamentales, axiomas y restricciones específicas de ${domain.subArea}.`,
      explanation: `La ruta "${trackLabel}" en ${domain.name} exige rigor conceptual y validación metódica previa.`,
    });
  }

  return warmups;
}

export interface RegeneratedLessonPackage {
  problem: CoreExamProblem;
  mcqQuestions: CoreMCQQuestion[];
}

// Local regeneration of questions AND applied problem (grounded strictly on concept tables and domain context)
export function regenerateLessonQuestionsLocally(
  domain: LearningDomain,
  topic: string,
  bloomLevel: BloomLevel,
  durationMinutes: number,
  isExtended: boolean,
  concepts: ConceptItem[] = []
): RegeneratedLessonPackage {
  const targetCount = calculateCoreMCQCount(durationMinutes, bloomLevel, isExtended);
  const tableQuestions = generateTableMCQQuestions(concepts, targetCount);
  let mcqQuestions: CoreMCQQuestion[] = [];
  if (tableQuestions.length >= targetCount) {
    mcqQuestions = tableQuestions.slice(0, targetCount);
  } else {
    const domainQuestions = generateDomainMCQQuestions(
      domain,
      topic,
      bloomLevel,
      targetCount - tableQuestions.length
    );
    mcqQuestions = [...tableQuestions, ...domainQuestions].slice(0, targetCount);
  }

  const problem = generateCoreProblemForTopic(domain, topic, bloomLevel, false, concepts);

  return {
    problem,
    mcqQuestions,
  };
}

// Generate the 3-step high-performance session with 3-10 MCQs in the core exam
// [ Warm-up / SRS (si hay conceptos previos) ] ──> [ 10-15 min: Núcleo del Examen con MCQs y Problema ] ──> [ 2 min: Retroalimentación & Métricas ]
export function generateHighPerformanceSession(
  domain: LearningDomain,
  dayName: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo' = 'lunes',
  customTopic?: string,
  targetBloomLevel?: BloomLevel,
  isExtended: boolean = false,
  priorConcepts: ConceptItem[] = [],
  associatedConcepts: ConceptItem[] = []
): PedagogicalSession {
  const isSun = dayName === 'domingo';
  const bloom: BloomLevel = isSun ? 2 : (targetBloomLevel || 3);
  const selectedTopic = customTopic || (domain.topics[0] || domain.name);

  // Pool all available concepts for the 4 contexts
  const allPool = [...associatedConcepts, ...priorConcepts];

  // Warmup condition: Strictly generated from the 4 contexts
  const hasPriorConcepts = Array.isArray(priorConcepts) && priorConcepts.length > 0;

  let warmupQuestions: WarmupQuestion[] = [];
  let warmupInstructions = '';

  if (hasPriorConcepts || allPool.length > 0) {
    warmupInstructions = isSun
      ? '3 minutos de recuperación activa: Afianza y reactiva los conceptos clave almacenados en tu memoria a largo plazo.'
      : '3 minutos de calentamiento: Reactivación de conceptos previos vistos o a reforzar antes del desafío central.';

    warmupQuestions = generateWarmupQuestionsFrom4Contexts(
      domain,
      selectedTopic,
      hasPriorConcepts ? priorConcepts : allPool
    );
  } else {
    warmupInstructions = 'Calentamiento desactivado: No existen conceptos vistos, dominados o a reforzar en este tema. Se inicia directo en el Núcleo de Práctica.';
  }

  // Core problem setup (10-15 min, or longer for extended)
  const coreProblem = generateCoreProblemForTopic(
    domain,
    selectedTopic,
    bloom,
    isSun,
    allPool
  );

  const sessionMinutes = isExtended ? 45 : (isSun ? 18 : 20);

  // Dynamic calculation: Question count strictly between 3 and 10 based on session duration & Bloom level
  const targetMCQCount = calculateCoreMCQCount(sessionMinutes, bloom, isExtended);

  // Pool concepts for table questions (associated concepts take priority, followed by prior concepts)
  const candidateConcepts = [
    ...(associatedConcepts || []),
    ...(priorConcepts || []),
  ];

  // Deduplicate candidate concepts
  const uniqueCandidateMap = new Map<string, ConceptItem>();
  candidateConcepts.forEach((c) => {
    if (c && c.id) uniqueCandidateMap.set(c.id, c);
  });
  const uniqueCandidates = Array.from(uniqueCandidateMap.values());

  // 1. First generate from concept table data if available
  const tableQuestions = generateTableMCQQuestions(uniqueCandidates, targetMCQCount);

  // 2. If needed, supplement with domain-calibrated MCQs to hit targetMCQCount exactly (3 to 10)
  const neededMore = targetMCQCount - tableQuestions.length;
  const domainQuestions = neededMore > 0
    ? generateDomainMCQQuestions(domain, selectedTopic, bloom, neededMore)
    : [];

  const coreMCQQuestions = [...tableQuestions, ...domainQuestions].slice(0, targetMCQCount);

  return {
    id: `sess-${domain.id}-${Date.now()}`,
    domainId: domain.id,
    domainName: domain.name,
    macroDomainId: domain.macroDomainId,
    dayOfWeek: dayName,
    isSundaySRS: isSun,
    isExtendedLesson: isExtended,
    estimatedMinutes: sessionMinutes,
    bloomFocus: bloom,
    isWarmupActive: hasPriorConcepts,
    warmup: {
      durationMinutes: hasPriorConcepts ? 3 : 0,
      instructions: warmupInstructions,
      questions: warmupQuestions,
    },
    core: {
      durationMinutes: isExtended ? 35 : (isSun ? 12 : 15),
      problem: coreProblem,
      mcqQuestions: coreMCQQuestions,
    },
    feedbackTemplate: {
      durationMinutes: 2,
      rubricPoints: [
        domain.macroDomainId === 'formal_quantitative'
          ? `Rigor analítico y demostración matemática formal en LaTeX`
          : domain.macroDomainId === 'linguistic_communication'
          ? `Exactitud sintáctica, precisión de partículas/kanji y naturalidad comunicativa`
          : domain.macroDomainId === 'technological_applied'
          ? `Corrección algorítmica, complejidad Big-O y casos de prueba`
          : `Fundamentación conceptual, aplicación de estándares y claridad expositiva`,
        `Demostración del nivel ${bloom} de la Taxonomía de Bloom (${getBloomName(bloom)})`,
        `Identificación de supuestos, limitaciones y justificación de decisiones`,
      ],
    },
  };
}

// Generate tailored Concept Items locally for any domain
export function generateConceptsLocally(domain: LearningDomain): ConceptItem[] {
  const dbKey = domain.conceptDatabaseKey || `db-${domain.id}`;
  const dbName = `Base Conceptual: ${domain.name}`;
  const now = new Date().toISOString().split('T')[0];

  const topics = domain.topics.length > 0
    ? domain.topics
    : ['Concepto Fundamental I', 'Metodología y Análisis', 'Técnicas de Aplicación', 'Evaluación de Rendimiento', 'Modelado Avanzado'];

  const statuses: ('dominado' | 'visto' | 'a_reforzar' | 'a_ver')[] = [
    'dominado',
    'visto',
    'a_reforzar',
    'visto',
    'a_ver',
    'a_ver',
  ];

  return topics.slice(0, 6).map((topic, idx) => {
    const status = statuses[idx % statuses.length];
    const bloom = (((idx % 5) + 2) as BloomLevel);

    let technicalDetails: string | undefined;
    if (domain.macroDomainId === 'formal_quantitative') {
      technicalDetails = `$\\int_0^\\infty e^{-st} f(t) dt \\quad \\text{o} \\quad \\det(A - \\lambda I) = 0$`;
    } else if (domain.macroDomainId === 'linguistic_communication') {
      technicalDetails = `Estructura: [Tópico は] [Lugar で] [Objeto を] [Verbo]; Vocabulario clave de ${domain.name}`;
    } else if (domain.macroDomainId === 'technological_applied') {
      technicalDetails = `const result = await processInput(data); // Complejidad: O(n log n)`;
    } else {
      technicalDetails = `Estándar de referencia: Cumplimiento de especificaciones y cálculo de viabilidad`;
    }

    return {
      id: `c-gen-${domain.id}-${Date.now()}-${idx}`,
      name: topic,
      description: `Definición y aplicación operativa de ${topic} dentro del dominio ${domain.name}.`,
      macroDomainId: domain.macroDomainId,
      databaseKey: dbKey,
      databaseName: dbName,
      domainId: domain.id,
      linkedDomainIds: [domain.id],
      status,
      bloomLevel: bloom,
      technicalDetails,
      notes: `Concepto esencial para alcanzar la meta en ${domain.name}.`,
      createdAt: now,
    };
  });
}

// Client-side / Offline evaluation engine supporting Core MCQs (3-10 questions)
export function evaluateStudentSubmissionLocally(
  session: PedagogicalSession,
  studentAnswer: string,
  warmupAnswers: Record<string, string>,
  timeSpentMinutes: number,
  mcqAnswers: Record<string, string> = {}
): EvaluationResult {
  const trimmed = studentAnswer.trim();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

  // 1. Evaluate Warmup
  let warmupCorrectCount = 0;
  session.warmup.questions.forEach((q) => {
    if (warmupAnswers[q.id] === q.correctAnswer) {
      warmupCorrectCount++;
    }
  });

  const warmupScore = session.warmup.questions.length > 0
    ? (warmupCorrectCount / session.warmup.questions.length) * 20
    : 20;

  // 2. Evaluate Core MCQs (3-10 questions)
  const coreQuestions = session.core.mcqQuestions || [];
  let mcqCorrectCount = 0;
  coreQuestions.forEach((q) => {
    if (mcqAnswers[q.id] === q.correctAnswer) {
      mcqCorrectCount++;
    }
  });

  const mcqPercentage = coreQuestions.length > 0
    ? Math.round((mcqCorrectCount / coreQuestions.length) * 100)
    : 100;

  const coreMCQScore = coreQuestions.length > 0
    ? (mcqCorrectCount / coreQuestions.length) * 45
    : 45;

  // 3. Evaluate Core Problem Solution (Text / Code / LaTeX)
  let coreDevScore = 0;
  const hasLatex = trimmed.includes('$') || trimmed.includes('\\');
  const hasCode = trimmed.includes('{') || trimmed.includes('function') || trimmed.includes('def') || trimmed.includes('let') || trimmed.includes('return');
  const hitsKeyPoints = session.core.problem.expectedKeyPoints.filter((kp) => {
    const words = kp.toLowerCase().split(/\s+/).slice(0, 3);
    return words.some((w) => w.length > 3 && trimmed.toLowerCase().includes(w));
  }).length;

  if (wordCount >= 20) coreDevScore += 15;
  if (wordCount >= 50) coreDevScore += 10;
  if (hasLatex || hasCode) coreDevScore += 5;
  coreDevScore += Math.min(5, hitsKeyPoints) * 1;

  const totalScore = Math.min(100, Math.round(warmupScore + coreMCQScore + coreDevScore));

  let achievedBloom: BloomLevel = 1;
  if (totalScore >= 90) achievedBloom = Math.min(6, session.bloomFocus + 1) as BloomLevel;
  else if (totalScore >= 75) achievedBloom = session.bloomFocus;
  else if (totalScore >= 55) achievedBloom = Math.max(1, session.bloomFocus - 1) as BloomLevel;
  else achievedBloom = 1;

  const srsDays = totalScore >= 85 ? 5 : totalScore >= 70 ? 3 : 1;

  const mcqSummary = coreQuestions.length > 0
    ? `Examen de Selección Múltiple: ${mcqCorrectCount}/${coreQuestions.length} aciertos (${mcqPercentage}%).`
    : '';

  return {
    score: totalScore,
    bloomMastery: achievedBloom,
    summary: totalScore >= 80
      ? `Excelente desempeño alcanzando el nivel de Bloom ${achievedBloom} (${getBloomName(achievedBloom)}). ${mcqSummary} Tu desarrollo demuestra comprensión sólida y aplicación precisa.`
      : totalScore >= 60
      ? `Buen intento con bases reconocibles. ${mcqSummary} Alcanzaste el nivel ${achievedBloom} (${getBloomName(achievedBloom)}), pero se requiere mayor precisión analítica y consolidación de conceptos clave.`
      : `El ejercicio requiere consolidación urgente de prerrequisitos. ${mcqSummary} Repasa las tablas conceptuales y definiciones fundamentales antes de intentar problemas de orden superior.`,
    strengths: [
      coreQuestions.length > 0
        ? `Resolución en el núcleo del examen: ${mcqCorrectCount} de ${coreQuestions.length} preguntas correctas`
        : 'Compromiso con el tiempo de práctica deliberada',
      warmupCorrectCount > 0 ? `Activación efectiva de memoria de trabajo (${warmupCorrectCount}/${session.warmup.questions.length} en warm-up)` : 'Enfoque y perseverancia durante la sesión',
      hasLatex ? 'Uso correcto de notación matemática en LaTeX' : hasCode ? 'Estructuración de bloques de código' : 'Claridad expositiva en la respuesta',
    ],
    areasToReinforce: [
      mcqCorrectCount < coreQuestions.length
        ? `Revisar los conceptos evaluados en las ${coreQuestions.length - mcqCorrectCount} pregunta(s) fallada(s) del núcleo`
        : 'Profundizar en la justificación y desglose de casos de frontera',
      wordCount < 30 ? 'Desarrollar con mayor amplitud la justificación analítica o síntesis personal' : 'Mantener la práctica espaciada continua',
    ],
    latexExplanation: session.core.problem.expectedKeyPoints.join(' · '),
    recommendedNextStep: session.isSundaySRS
      ? 'Excelente sesión de domingo: descanso mental y consolidación de memoria antes de iniciar el ciclo semanal.'
      : `Programar sesión de refuerzo en ${srsDays} día${srsDays > 1 ? 's' : ''} para mantener la curva de retención de Ebbinghaus.`,
    srsRepetitionIntervalDays: srsDays,
    mcqScore: coreQuestions.length > 0 ? {
      total: coreQuestions.length,
      correct: mcqCorrectCount,
      percentage: mcqPercentage,
    } : undefined,
  };
}

// -------------------------------------------------------------
// DIFFICULTY LEVELS & PRECISION RUBRIC ENGINE (NON-BLOOM)
// -------------------------------------------------------------

export function getDifficultyName(level: DifficultyLevel): string {
  switch (level) {
    case 'basico':
      return 'Básico';
    case 'intermedio':
      return 'Intermedio';
    case 'avanzado':
      return 'Avanzado';
    case 'experto':
      return 'Experto';
    default:
      return level;
  }
}

export function getDifficultyDescription(level: DifficultyLevel): string {
  switch (level) {
    case 'basico':
      return 'Fundamentos esenciales, conceptos base, sintaxis elemental y definiciones clave';
    case 'intermedio':
      return 'Aplicación procedimental, resolución guiada de problemas y relaciones conceptuales';
    case 'avanzado':
      return 'Análisis crítico, resolución no trivial, optimización y casos de frontera';
    case 'experto':
      return 'Síntesis global de dominio, demostraciones rigurosas, diseño arquitectónico o refutación analítica';
    default:
      return '';
  }
}

export function getDifficultyBadgeColor(level: DifficultyLevel): { bg: string; text: string; border: string } {
  switch (level) {
    case 'basico':
      return { bg: 'bg-emerald-950/70', text: 'text-emerald-300', border: 'border-emerald-800' };
    case 'intermedio':
      return { bg: 'bg-sky-950/70', text: 'text-sky-300', border: 'border-sky-800' };
    case 'avanzado':
      return { bg: 'bg-indigo-950/70', text: 'text-indigo-300', border: 'border-indigo-800' };
    case 'experto':
      return { bg: 'bg-amber-950/70', text: 'text-amber-300', border: 'border-amber-800' };
    default:
      return { bg: 'bg-slate-900', text: 'text-slate-300', border: 'border-slate-800' };
  }
}

export function generateDifficultyTrackForDomain(
  domain: LearningDomain,
  allConcepts: ConceptItem[] = []
): DomainDifficultyTrack {
  const dbKey = domain.conceptDatabaseKey || `db-${domain.id}`;
  const domainConcepts = allConcepts.filter(
    (c) =>
      c.domainId === domain.id ||
      c.databaseKey === dbKey ||
      c.linkedDomainIds?.includes(domain.id)
  );

  const topicsList = domain.topics && domain.topics.length > 0
    ? domain.topics
    : [domain.name, `${domain.subArea || domain.name} Aplicado`, `Técnicas de ${domain.name}`, `Modelos Avanzados de ${domain.name}`];

  const levels: DifficultyLevel[] = ['basico', 'intermedio', 'avanzado', 'experto'];

  const buildLessonsForLevel = (lvl: DifficultyLevel): DifficultyLessonItem[] => {
    const levelIdx = levels.indexOf(lvl);
    const count = 3; // 3 lessons per level = 12 lessons total per track
    const items: DifficultyLessonItem[] = [];

    // Map difficulty level to approximate Bloom for question generation
    const bloomMap: Record<DifficultyLevel, BloomLevel> = {
      basico: 2,
      intermedio: 3,
      avanzado: 4,
      experto: 5,
    };
    const approxBloom = bloomMap[lvl];

    for (let i = 0; i < count; i++) {
      const topicIndex = (levelIdx * count + i) % topicsList.length;
      const baseTopic = topicsList[topicIndex] || domain.name;

      const titleSuffix = lvl === 'basico'
        ? (i === 0 ? 'Fundamentos y Definiciones' : i === 1 ? 'Estructura Inicial' : 'Ejemplos Prácticos')
        : lvl === 'intermedio'
        ? (i === 0 ? 'Aplicación Procedimental' : i === 1 ? 'Resolución de Casos' : 'Relaciones Conceptuales')
        : lvl === 'avanzado'
        ? (i === 0 ? 'Análisis Crítico y Casos Límite' : i === 1 ? 'Optimización y Diagnóstico' : 'Integración de Conceptos')
        : (i === 0 ? 'Síntesis y Demostración Rigurosa' : i === 1 ? 'Diseño de Soluciones Complejas' : 'Maestría y Refutación');

      const fullTopic = `${baseTopic}: ${titleSuffix}`;
      const estimatedMinutes = lvl === 'basico' ? 20 : lvl === 'intermedio' ? 25 : lvl === 'avanzado' ? 35 : 45;
      const isExtended = estimatedMinutes >= 35;

      const preparedProblem = generateCoreProblemForTopic(
        domain,
        fullTopic,
        approxBloom,
        false,
        domainConcepts
      );

      const preparedMcqs = regenerateLessonQuestionsLocally(
        domain,
        fullTopic,
        approxBloom,
        estimatedMinutes,
        isExtended,
        domainConcepts
      ).mcqQuestions;

      const rubricCriteria = [
        `Rigor Conceptual: Definición clara de principios de ${baseTopic}`,
        `Metodología: Desarrollo paso a paso y justificación analítica`,
        `Exactitud: Resolución rigurosa del problema y validación de casos`,
      ];

      items.push({
        id: `diff-les-${domain.id}-${lvl}-${i + 1}`,
        domainId: domain.id,
        title: fullTopic,
        level: lvl,
        estimatedMinutes,
        isExtendedLesson: isExtended,
        objective: `Dominar los criterios del nivel ${getDifficultyName(lvl)} para ${baseTopic}.`,
        conceptIds: domainConcepts.slice(i * 2, i * 2 + 2).map((c) => c.id),
        completed: false,
        preparedProblem,
        preparedMcqQuestions: preparedMcqs,
        rubricCriteria,
      });
    }

    return items;
  };

  return {
    domainId: domain.id,
    domainName: domain.name,
    macroDomainId: domain.macroDomainId,
    levels: {
      basico: buildLessonsForLevel('basico'),
      intermedio: buildLessonsForLevel('intermedio'),
      avanzado: buildLessonsForLevel('avanzado'),
      experto: buildLessonsForLevel('experto'),
    },
  };
}

// Evaluate Student Submission with Precision Rubric (Percentage of Mastery & Analytical Precision)
export function evaluateStudentSubmissionWithRubric(
  session: PedagogicalSession,
  studentAnswer: string,
  warmupAnswers: Record<string, string>,
  timeSpentMinutes: number,
  mcqAnswers: Record<string, string> = {}
): EvaluationResult {
  const trimmed = studentAnswer.trim();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const targetLevel = session.difficultyLevel || 'intermedio';

  // 1. Evaluate Core MCQs
  const coreQuestions = session.core.mcqQuestions || [];
  let mcqCorrectCount = 0;
  coreQuestions.forEach((q) => {
    if (mcqAnswers[q.id] === q.correctAnswer) {
      mcqCorrectCount++;
    }
  });

  const mcqRatio = coreQuestions.length > 0 ? mcqCorrectCount / coreQuestions.length : 1;
  const mcqPercentage = Math.round(mcqRatio * 100);

  // 2. Precision Rubric 3-Axis Scoring
  // Axis A: Rigor Conceptual (0 - 30 pts)
  let conceptualRigor = 0;
  const hasKeyWords = session.core.problem.expectedKeyPoints.some((kp) => {
    const kw = kp.toLowerCase().slice(0, 5);
    return trimmed.toLowerCase().includes(kw);
  });
  if (wordCount >= 20) conceptualRigor += 12;
  if (wordCount >= 50) conceptualRigor += 10;
  if (hasKeyWords) conceptualRigor += 8;
  conceptualRigor = Math.min(30, conceptualRigor);

  // Axis B: Metodología y Procedimiento Analítico (0 - 40 pts)
  let methodology = 0;
  const hasLatex = trimmed.includes('$') || trimmed.includes('\\');
  const hasCode = trimmed.includes('{') || trimmed.includes('function') || trimmed.includes('def') || trimmed.includes('let') || trimmed.includes('return');
  if (wordCount >= 30) methodology += 15;
  if (hasLatex || hasCode) methodology += 15;
  if (wordCount >= 70) methodology += 10;
  methodology = Math.min(40, methodology);

  // Axis C: Exactitud y Verificación (0 - 30 pts)
  const accuracy = Math.round(mcqRatio * 30);

  // Total Mastery Score (0 - 100 pts)
  const totalScore = Math.min(100, Math.max(10, conceptualRigor + methodology + accuracy));

  const rubricScore: PrecisionRubricScore = {
    conceptualRigor,
    methodology,
    accuracy,
    feedbackCriteria: [
      {
        criterion: 'Rigor Conceptual y Definición de Principios',
        score: conceptualRigor,
        maxScore: 30,
        status: conceptualRigor >= 24 ? 'cumplido' : conceptualRigor >= 15 ? 'parcial' : 'no_cumplido',
      },
      {
        criterion: 'Metodología, Procedimiento y Justificación Paso a Paso',
        score: methodology,
        maxScore: 40,
        status: methodology >= 32 ? 'cumplido' : methodology >= 20 ? 'parcial' : 'no_cumplido',
      },
      {
        criterion: 'Exactitud Analítica y Aciertos de Validación',
        score: accuracy,
        maxScore: 30,
        status: accuracy >= 24 ? 'cumplido' : accuracy >= 15 ? 'parcial' : 'no_cumplido',
      },
    ],
  };

  const isApproved = totalScore >= 70;
  const diffName = getDifficultyName(targetLevel);
  const srsDays = totalScore >= 85 ? 6 : totalScore >= 70 ? 4 : 2;

  return {
    score: totalScore,
    bloomMastery: session.bloomFocus || 3,
    evaluationType: 'precision_rubric',
    difficultyAchieved: targetLevel,
    precisionRubric: rubricScore,
    summary: isApproved
      ? `¡Dominio satisfactorio en Nivel ${diffName}! Obtuviste ${totalScore}% de precisión global. Tu desarrollo metodológico y rigor conceptual cumplen con los estándares esperados.`
      : `El ejercicio en Nivel ${diffName} requiere mayor precisión procedimental (${totalScore}% obtenido). Te recomendamos reforzar los fundamentos antes de avanzar a lecciones de mayor complejidad.`,
    strengths: [
      `Exactitud de validación: ${mcqCorrectCount} de ${coreQuestions.length} aciertos (${mcqPercentage}%)`,
      conceptualRigor >= 20 ? 'Comprensión conceptual sólida y empleo pertinente de vocabulario técnico' : 'Compromiso y persistencia en la resolución',
      hasLatex ? 'Uso riguroso de formulación analítica LaTeX' : hasCode ? 'Estructuración algorítmica clara' : 'Claridad expositiva en la argumentación',
    ],
    areasToReinforce: [
      accuracy < 24 ? `Repasar los puntos evaluados en las ${coreQuestions.length - mcqCorrectCount} pregunta(s) falladas` : 'Reforzar comprobación de casos límite',
      methodology < 30 ? 'Estructurar con mayor detalle el paso a paso metodológico' : 'Mantener la disciplina de resolución analítica',
    ],
    latexExplanation: session.core.problem.expectedKeyPoints.join(' · '),
    recommendedNextStep: isApproved
      ? `Avanzar a la siguiente lección de Nivel ${diffName} o poner a prueba tus habilidades en el nivel superior.`
      : `Reintentar este problema aplicando la rúbrica de precisión y verificando cada paso intermedio.`,
    srsRepetitionIntervalDays: srsDays,
    mcqScore: coreQuestions.length > 0 ? {
      total: coreQuestions.length,
      correct: mcqCorrectCount,
      percentage: mcqPercentage,
    } : undefined,
  };
}
