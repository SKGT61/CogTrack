import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI server-side with User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Candidate models in cascade:
// Uses modern supported Gemini models per guidelines: 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'
const GEMINI_CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];
const GEMINI_MODEL_LABEL = 'Gemini 3.8 Flash';

async function generateWithGeminiCascade(
  aiInstance: GoogleGenAI,
  options: {
    contents: any;
    systemInstruction?: string;
    responseMimeType?: string;
    responseSchema?: any;
  }
): Promise<{ text: string; modelUsed: string }> {
  let lastError: any = null;
  for (const model of GEMINI_CANDIDATE_MODELS) {
    try {
      const response = await aiInstance.models.generateContent({
        model,
        contents: options.contents,
        config: {
          systemInstruction: options.systemInstruction,
          responseMimeType: options.responseMimeType,
          responseSchema: options.responseSchema,
        },
      });
      return { text: response.text || '{}', modelUsed: model };
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed with ${err?.status || err?.message}; cascading to next candidate...`);
    }
  }
  throw lastError || new Error('All Gemini candidate models failed in cascade');
}

// API: Generate Weekly Study Plan with Bloom's Taxonomy
// Grounded EXCLUSIVELY on: 1. Nombre del Dominio / Tema, 2. Ruta / Selector Principal, 3. Sub-Área o Especialidad, 4. Base de Datos Conceptual
app.post('/api/pedagogical/generate-weekly-plan', async (req, res) => {
  try {
    const {
      domainName,
      subArea,
      macroDomainId,
      conceptDatabaseKey,
      databaseConcepts = [],
      currentLevel,
      topics,
      targetGoal,
    } = req.body;

    if (!ai) {
      return res.status(200).json({
        success: false,
        message: 'No GEMINI_API_KEY configured on server; using local pedagogical engine.',
      });
    }

    const macroTrackNames: Record<string, string> = {
      formal_quantitative: 'Sistemas Físicos y Matemáticos',
      linguistic_communication: 'Culturas e Idiomas',
      technological_applied: 'Código y Tecnología',
      conceptual_normative_social: 'Sociedad y Entorno',
    };
    const macroTrackLabel = macroTrackNames[macroDomainId] || macroDomainId || 'Ruta General';

    // Summarize database concepts and check for tabular data
    const conceptsSummary = Array.isArray(databaseConcepts) && databaseConcepts.length > 0
      ? databaseConcepts.map((c: any) => {
          const hasTable = Array.isArray(c.tableData) && c.tableData.length >= 2;
          return `- Concepto: "${c.name}" (${c.status || 'a_ver'}, Bloom: ${c.bloomLevel || 2})${hasTable ? ` [TABLA DE DATOS: ${c.tableData.length} filas]` : ''}${c.technicalDetails ? ` [Detalle técnico: ${c.technicalDetails}]` : ''}`;
        }).join('\n')
      : 'Base de datos conceptual inicial vinculada (sin conceptos previos aún).';

    const systemPrompt = `Actúa como tutor experto y diseñador curricular de alto rendimiento para una plataforma educativa de élite.
Tu objetivo es diseñar un plan de estudios semanal (Lunes a Domingo) para un tema de aprendizaje utilizando el modelo Gemini 1.5 Flash.

REGLA DE CONTEXTO EXCLUSIVO (CRÍTICA Y ESTRICTA):
El contenido de cada una de las lecciones (títulos de lección, objetivos, tópicos diarios, ejercicios y actividades) DEBE generarse UTILIZANDO EXCLUSIVAMENTE el siguiente contexto:
1. "Nombre del Dominio / Tema": "${domainName}"
2. "Ruta / Selector Principal": "${macroTrackLabel}" (${macroDomainId})
3. "Sub-Área o Especialidad": "${subArea || 'General'}"
4. "Base de Datos Conceptual": "${conceptDatabaseKey || 'db-default'}"
${conceptsSummary}

PROHIBICIÓN ESTRICTA:
- Queda rotundamente prohibido inventar conceptos ajenos, desviar la disciplina o recurrir a materias fuera de este contexto específico.
- Todas las lecciones deben responder fielmente a la especialidad "${subArea || domainName}" dentro de la ruta "${macroTrackLabel}".
- Si la base conceptual contiene tablas o detalles técnicos, programa lecciones específicas para dominarlos.
- Los calentamientos (warmupTopic) DEBEN responder directamente a los conceptos, fórmulas y términos de la base conceptual vinculada.

REGLAS DE OPERACIÓN PEDAGÓGICA:
1. TAXONOMÍA DE BLOOM REVISADA:
   Progresa a través de los 6 niveles:
   - Nivel 1 (Recordar)
   - Nivel 2 (Entender)
   - Nivel 3 (Aplicar)
   - Nivel 4 (Analizar)
   - Nivel 5 (Evaluar)
   - Nivel 6 (Crear)
2. FORMATO TÉCNICO RIGUROSO:
   - Para matemáticas, física e ingeniería: LaTeX limpio ($..$).
   - Para programación: fragmentos de código y casos de prueba.
   - Para idiomas: kanji, partículas, reglas gramaticales y contexto sintáctico.
3. LECCIONES LARGAS:
   - Lecciones de análisis o síntesis pueden requerir plazos extendidos (isExtendedLesson: true, estimatedMinutes: 45-60 min).
4. DOMINGO EXCLUSIVO DE REPASO ESPACIADO (SRS):
   - El domingo (isSundaySRS: true) debe ser ÚNICAMENTE repaso espaciado de los conceptos vistos en la semana.
5. FORMATO DE SALIDA ESTRICTO:
   - Responde ÚNICAMENTE con el objeto JSON estandarizado.`;

    const userPrompt = `Genera el plan de lecciones semanal para el tema "${domainName}", sub-área "${subArea || ''}", ruta "${macroTrackLabel}", base conceptual "${conceptDatabaseKey || ''}". Nivel: "${currentLevel || 'Universitario / Profesional'}".
Tópicos y conceptos base: ${Array.isArray(topics) && topics.length > 0 ? topics.join(', ') : domainName}.`;

    const cascadeResult = await generateWithGeminiCascade(ai, {
      contents: userPrompt,
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          weekTitle: { type: Type.STRING },
          days: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dayName: { type: Type.STRING },
                isSundaySRS: { type: Type.BOOLEAN },
                topic: { type: Type.STRING },
                bloomLevel: { type: Type.INTEGER },
                estimatedMinutes: { type: Type.INTEGER },
                isExtendedLesson: { type: Type.BOOLEAN },
                objective: { type: Type.STRING },
                warmupTopic: { type: Type.STRING },
              },
              required: ['dayName', 'isSundaySRS', 'topic', 'bloomLevel', 'estimatedMinutes', 'isExtendedLesson', 'objective', 'warmupTopic'],
            },
          },
        },
        required: ['weekTitle', 'days'],
      },
    });

    const jsonText = cascadeResult.text || '{}';
    const planData = JSON.parse(jsonText);

    return res.json({
      success: true,
      data: planData,
    });
  } catch (error: any) {
    console.error('Error generating weekly plan via Gemini 1.5 Flash:', error);
    return res.status(200).json({
      success: false,
      error: error?.message || 'Error executing AI generation',
    });
  }
});

// API: Regenerate Questions AND Core Problem inside Lessons with Gemini 1.5 Flash
// Grounded strictly on 1. Nombre del Dominio, 2. Selector Principal, 3. Sub-Área, 4. Base Conceptual
app.post('/api/pedagogical/regenerate-questions', async (req, res) => {
  try {
    const {
      domainName,
      macroDomainId,
      subArea,
      conceptDatabaseKey,
      topic,
      bloomLevel = 3,
      sessionMinutes = 25,
      isExtended = false,
      databaseConcepts = [],
    } = req.body;

    if (!ai) {
      return res.status(200).json({
        success: false,
        message: 'No GEMINI_API_KEY configured on server; using local pedagogical engine.',
      });
    }

    // Dynamic MCQ calculation strictly between 3 and 10 based on duration and Bloom level
    let targetMCQCount = Math.round(sessionMinutes / 6);
    if (isExtended || bloomLevel >= 5) targetMCQCount += 1;
    if (bloomLevel === 6) targetMCQCount += 1;
    targetMCQCount = Math.max(3, Math.min(10, targetMCQCount));

    // Filter concepts with tableData
    const conceptsWithTables = (databaseConcepts || []).filter(
      (c: any) => Array.isArray(c.tableData) && c.tableData.length >= 2
    );

    const macroTrackNames: Record<string, string> = {
      formal_quantitative: 'Sistemas Físicos y Matemáticos',
      linguistic_communication: 'Culturas e Idiomas',
      technological_applied: 'Código y Tecnología',
      conceptual_normative_social: 'Sociedad y Entorno',
    };
    const macroTrackLabel = macroTrackNames[macroDomainId] || macroDomainId || 'Ruta General';

    const domainDirectives = {
      formal_quantitative: 'Sistemas Físicos y Matemáticos: Todas las preguntas, opciones, expresiones y el problema deben estar en LaTeX limpio ($..$ o $$..$$). Incluye cálculo diferencial/integral, matrices o física teórica.',
      linguistic_communication: 'Culturas e Idiomas: Preguntas y problema enfocados exclusivamente en análisis sintáctico, kanji, partículas, vocabulario, lectura contextual o traducción. PROHIBIDO fórmulas matemáticas o código.',
      technological_applied: 'Código y Tecnología: Desafíos de algoritmos, estructuras de datos, firmas de funciones, consultas o depuración con código.',
      conceptual_normative_social: 'Sociedad y Entorno: Casos normativos (ISO, NOM), diagnósticos clínicos, finanzas corporativas (VAN, TIR) o derecho.',
    }[macroDomainId as string] || 'Enfócate con el máximo rigor en el tema indicado.';

    let tableInstruction = '';
    if (conceptsWithTables.length > 0) {
      tableInstruction = `ACCESO A TABLAS DE DATOS CONCEPTUALES:
${JSON.stringify(conceptsWithTables.map((c: any) => ({ name: c.name, tableData: c.tableData })), null, 2)}
Debes acceder a estas tablas estructuradas para formular preguntas de selección múltiple directas basadas en sus filas y columnas (ej. identificar atributos, emparejar propiedades o deducir valores). Marca 'fromTable: true' y 'sourceConceptName' con el nombre del concepto correspondiente.`;
    }

    const systemPrompt = `Actúa como tutor evaluador de élite impulsado por Gemini 1.5 Flash.
Tu misión es regenerar un conjunto completamente nuevo y fresco para la lección activa:
1. "PROBLEMA APLICADO EN": Un problema central aplicado de alta calidad pedagógica con rúbrica detallada.
2. PREGUNTAS DE SELECCIÓN MÚLTIPLE: Exactamente ${targetMCQCount} preguntas de selección múltiple (MCQ) para el examen del núcleo.

REGLA DE CONTEXTO EXCLUSIVO (CRÍTICA Y ESTRICTA):
Genera tanto el "Problema aplicado en" como las preguntas utilizando EXCLUSIVAMENTE el siguiente contexto:
1. "Nombre del Dominio / Tema": "${domainName}"
2. "Ruta / Selector Principal": "${macroTrackLabel}" (${macroDomainId})
3. "Sub-Área o Especialidad": "${subArea || 'General'}"
4. "Base de Datos Conceptual": "${conceptDatabaseKey || 'db-default'}"

${domainDirectives}
${tableInstruction}

REGLAS PARA "PROBLEMA APLICADO EN":
- El título debe titularse "Problema Aplicado en: ${topic || domainName}".
- Statement desafiante adaptado al nivel Bloom ${bloomLevel}.
- Incluye guidingQuestions y expectedKeyPoints claros para la autoevaluación.

REGLAS DE PREGUNTAS MCQ:
- Genera exactamente ${targetMCQCount} preguntas de selección múltiple en el array 'mcqQuestions'.
- Nivel de Bloom objetivo: Nivel ${bloomLevel}.
- Cada pregunta debe tener exactamente 4 opciones de respuesta distintas y verosímiles.
- El campo 'correctAnswer' debe ser idéntico a una de las opciones.
- Cada pregunta debe incluir una 'explanation' concisa, sólida y pedagógica.
- Responde ÚNICAMENTE en JSON válido según el esquema.`;

    const userPrompt = `Regenera con Gemini 1.5 Flash el "Problema aplicado en" y las ${targetMCQCount} preguntas de selección múltiple para la lección "${topic || domainName}", en el contexto de "${domainName}" (Sub-área: "${subArea || ''}", Ruta: "${macroTrackLabel}"). Nivel Bloom ${bloomLevel}.`;

    const cascadeResult = await generateWithGeminiCascade(ai, {
      contents: userPrompt,
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          problem: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              problemStatement: { type: Type.STRING },
              bloomLevel: { type: Type.INTEGER },
              domainContext: { type: Type.STRING },
              codeSnippet: { type: Type.STRING },
              guidingQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              expectedKeyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['title', 'problemStatement', 'bloomLevel', 'domainContext', 'expectedKeyPoints'],
          },
          mcqQuestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
                fromTable: { type: Type.BOOLEAN },
                sourceConceptName: { type: Type.STRING },
              },
              required: ['id', 'question', 'options', 'correctAnswer', 'explanation'],
            },
          },
        },
        required: ['problem', 'mcqQuestions'],
      },
    });

    const parsed = JSON.parse(cascadeResult.text || '{}');
    const questions = parsed.mcqQuestions || [];
    const problem = parsed.problem || null;

    return res.json({
      success: true,
      data: {
        problem,
        mcqQuestions: questions,
        model: GEMINI_MODEL_LABEL,
        internalModel: cascadeResult.modelUsed,
        count: questions.length,
        regeneratedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error regenerating problem and questions via Gemini 1.5 Flash:', error);
    return res.status(200).json({
      success: false,
      error: error?.message || 'Error executing AI question regeneration',
    });
  }
});

// API: Generate Domain-Specific Concepts with AI (Strictly isolated by selector)
app.post('/api/concepts/generate', async (req, res) => {
  try {
    const { domainName, subArea, macroDomainId, level, topics, count = 6 } = req.body;

    if (!ai) {
      return res.status(200).json({
        success: false,
        message: 'No GEMINI_API_KEY configured on server; using local pedagogical concept generator.',
      });
    }

    const domainInstructions = {
      formal_quantitative: 'Sistemas Físicos y Matemáticos: Enfócate exclusivamente en fórmulas matemáticas rigurosas, teoremas, integrales, ecuaciones diferenciales, circuitos o leyes físicas. Expresa detalles técnicos en LaTeX limpio ($..$).',
      linguistic_communication: 'Culturas e Idiomas: Enfócate exclusivamente en gramática, kanji/vocabulario, partículas, estructuras oracionales, comprensión lectora y fonética/traducción. PROHIBIDO incluir fórmulas matemáticas o código.',
      technological_applied: 'Código y Tecnología: Enfócate exclusivamente en algoritmos, sintaxis, estructuras de datos, comandos, arquitectura de software, bases de datos o pipelines. Incluye fragmentos de código o firmas de funciones.',
      conceptual_normative_social: 'Sociedad y Entorno: Enfócate exclusivamente en normas (ISO, IEC, NOM), derecho, medicina/fisiología clínica, evaluación de proyectos financieros (VAN, TIR) o economía. Sin fórmulas matemáticas descontextualizadas.',
    }[macroDomainId as string] || 'Enfócate estrictamente en el contexto y objetivos formativos del tema indicado.';

    const systemPrompt = `Actúa como diseñador curricular y tutor pedagógico de alto rendimiento.
Genera una base de datos conceptual de ${count} conceptos clave para el tema: "${domainName}" (${subArea || ''}).
Nivel del estudiante: ${level || 'Universitario / Profesional'}.
Tópicos de referencia: ${Array.isArray(topics) ? topics.join(', ') : 'Temario general'}.

DIRECTRICES POR RUTA DE APRENDIZAJE:
${domainInstructions}

REGLAS DE CLASIFICACIÓN DE ESTADO:
Distribuye los conceptos generados entre los 4 estados pedagógicos:
- 'a_ver': Conceptos fundamentales avanzados o siguientes en el temario.
- 'visto': Conceptos que el estudiante ya ha estudiado al menos una vez.
- 'a_reforzar': Conceptos críticos propensos a errores conceptuales o con sutilezas técnicas.
- 'dominado': Conceptos clave consolidados en la memoria a largo plazo.

Responde ÚNICAMENTE en JSON válido según el esquema.`;

    const userPrompt = `Genera ${count} conceptos especializados para "${domainName}". Asegúrate de que las preguntas y términos pertenezcan 100% a este dominio.`;

    const cascadeResult = await generateWithGeminiCascade(ai, {
      contents: userPrompt,
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          databaseName: { type: Type.STRING },
          concepts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                status: {
                  type: Type.STRING,
                  enum: ['a_ver', 'visto', 'a_reforzar', 'dominado'],
                },
                bloomLevel: { type: Type.INTEGER, description: 'Nivel 1 a 6 de Bloom' },
                technicalDetails: { type: Type.STRING, description: 'Fórmula LaTeX, código, kanji o estándar técnico' },
                notes: { type: Type.STRING, description: 'Consejo mnemotécnico o advertencia clave' },
              },
              required: ['name', 'description', 'status', 'bloomLevel'],
            },
          },
        },
        required: ['databaseName', 'concepts'],
      },
    });

    const parsed = JSON.parse(cascadeResult.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error generating concepts via Gemini 1.5 Flash:', error);
    return res.status(200).json({ success: false, error: error?.message });
  }
});

// API: Generate High Performance Session with Gemini 1.5 Flash
// [ 3 min: Warm-up / SRS ] ──> [ 10-15 min: Núcleo del Examen con 3-10 MCQs y Práctica ] ──> [ 2 min: Retroalimentación & Métricas ]
app.post('/api/pedagogical/generate-session', async (req, res) => {
  try {
    const {
      domainName,
      subArea,
      macroDomainId,
      dayName,
      isSundaySRS,
      customTopic,
      targetBloomLevel,
      isExtended,
      priorConcepts = [],
      associatedConcepts = [],
      conceptDatabaseKey,
    } = req.body;

    if (!ai) {
      return res.status(200).json({
        success: false,
        message: 'No GEMINI_API_KEY configured on server; using local pedagogical engine.',
      });
    }

    const hasPriorConcepts = Array.isArray(priorConcepts) && priorConcepts.length > 0;
    const sessionMinutes = isExtended ? 45 : (isSundaySRS ? 18 : 25);
    const bloom = targetBloomLevel || (isSundaySRS ? 2 : 3);

    // Calculate MCQ count strictly between 3 and 10 based on duration and Bloom level
    let targetMCQCount = Math.round(sessionMinutes / 6);
    if (isExtended || bloom >= 5) targetMCQCount += 1;
    if (bloom === 6) targetMCQCount += 1;
    targetMCQCount = Math.max(3, Math.min(10, targetMCQCount));

    // Check for concepts with tables
    const allConceptsPool = [...associatedConcepts, ...priorConcepts];
    const conceptsWithTables = allConceptsPool.filter(
      (c: any) => Array.isArray(c.tableData) && c.tableData.length >= 2
    );

    const macroTrackNames: Record<string, string> = {
      formal_quantitative: 'Sistemas Físicos y Matemáticos',
      linguistic_communication: 'Culturas e Idiomas',
      technological_applied: 'Código y Tecnología',
      conceptual_normative_social: 'Sociedad y Entorno',
    };
    const macroTrackLabel = macroTrackNames[macroDomainId] || macroDomainId || 'Ruta General';

    const domainDirectives = {
      formal_quantitative: 'Sistemas Físicos y Matemáticos: El problema debe involucrar derivaciones rigurosas, resolución analítica, modelos físicos o cálculo. Fórmulas estrictamente en LaTeX ($..$).',
      linguistic_communication: 'Culturas e Idiomas: El problema debe involucrar análisis sintáctico, redacción, traducción contextual o lectura (ej. oraciones japonesas con kanji/partículas, redacción avanzada). PROHIBIDO plantear problemas matemáticos.',
      technological_applied: 'Código y Tecnología: El problema debe ser un desafío de desarrollo de software, algoritmos, consultas SQL o depuración con código y casos de prueba explícitos.',
      conceptual_normative_social: 'Sociedad y Entorno: El problema debe ser un caso práctico de análisis normativo, diagnóstico clínico de síntomas o evaluación de rentabilidad/VAN de proyectos.',
    }[macroDomainId as string] || 'El problema debe enfocarse rigurosamente en el dominio indicado.';

    // REGLA ESTRICTA DE WARM-UP (CALENTAMIENTO):
    // El warm-up debe ser generado de acuerdo al contexto de:
    // 1. "Nombre del Dominio / Tema"
    // 2. "Ruta / Selector Principal"
    // 3. "Sub-Área o Especialidad"
    // 4. "Base de Datos Conceptual"
    const warmupInstruction = hasPriorConcepts
      ? `ACTIVAR WARM-UP (3 min): Genera 2 preguntas cortas de recuperación activa (warmup.questions) formuladas EXCLUSIVAMENTE a partir del contexto de:
1. "Nombre del Dominio / Tema": "${domainName}"
2. "Ruta / Selector Principal": "${macroTrackLabel}" (${macroDomainId})
3. "Sub-Área o Especialidad": "${subArea || 'General'}"
4. "Base de Datos Conceptual": "${conceptDatabaseKey || 'db-default'}" (conceptos previos vinculados: ${priorConcepts.map((c: any) => `${c.name}: ${c.technicalDetails || c.description}`).join(' | ')}).
Cada pregunta de calentamiento debe examinar directamente las fórmulas, términos, tablas o definiciones de estos conceptos específicos.`
      : `WARM-UP INACTIVO (0 min): Como el estudiante NO tiene conceptos previos vistos/dominados en este tema, NO generes preguntas de calentamiento (warmup.questions = [] y warmup.durationMinutes = 0). La sesión iniciará directo en el núcleo.`;

    let tableInstruction = '';
    if (conceptsWithTables.length > 0) {
      tableInstruction = `ACCESO A TABLAS DE DATOS: Existen conceptos con datos tabulares disponibles:
${JSON.stringify(conceptsWithTables.map((c: any) => ({ name: c.name, tableData: c.tableData })), null, 2)}
Debes acceder a estas tablas y formular preguntas de selección múltiple directas basadas en las filas y columnas de dichas tablas (por ejemplo: identificar el valor correspondiente a una fila/columna, conjugación verbal, cálculo derivado o propiedad). Marca 'fromTable: true' y 'sourceConceptName' con el nombre del concepto correspondiente.`;
    }

    const systemPrompt = `Actúa como tutor experto y evaluador de alto rendimiento para el dominio: "${domainName}" (${subArea || ''}) impulsado por Gemini 1.5 Flash.
Genera una sesión de estudio estricta con la siguiente arquitectura:
[ Warm-up / SRS ] ──> [ Núcleo del Examen: ${targetMCQCount} Preguntas de Selección Múltiple (MCQ) + Problema Práctico ] ──> [ Retroalimentación & Métricas ].

REGLAS PEDAGÓGICAS ESTRICTAS:
1. TAXONOMÍA DE BLOOM: Nivel objetivo ${bloom}.
2. REGLA DE WARM-UP ESTRICTAMENTE CONTEXTUALIZADO:
${warmupInstruction}
3. CONTEXTUALIZACIÓN TOTAL:
${domainDirectives}
4. PREGUNTAS DE SELECCIÓN MÚLTIPLE (MCQ) EN EL NÚCLEO:
Genera exactamente ${targetMCQCount} preguntas de opción múltiple (core.mcqQuestions), calculadas para una duración de ${sessionMinutes} minutos y nivel Bloom ${bloom} (estrictamente entre 3 y 10 preguntas).
${tableInstruction}
Si no hay suficientes datos en tablas para las ${targetMCQCount} preguntas, genera preguntas de selección múltiple de alto nivel adaptadas al dominio "${domainName}".
Cada pregunta debe tener exactamente 4 opciones (1 correcta y 3 distractores convincentes), la respuesta correcta idéntica a una de las opciones y una explicación fundamentada.
5. DOMINGO (SRS): Si isSundaySRS es true, la sesión es de REPASO ESPACIADO de consolidación.
6. FORMATO DE SALIDA ESTRICTO: Responde ÚNICAMENTE en JSON válido según el esquema.`;

    const userPrompt = `Genera con Gemini 1.5 Flash la sesión de estudio para el día "${dayName || 'lunes'}" (${isSundaySRS ? 'DOMINGO DE REPASO ESPACIADO SRS' : 'Sesión Regular'}). Tópico: "${customTopic || domainName}". Lección extendida: ${isExtended ? 'Sí' : 'No'}. Duración: ${sessionMinutes} min. Genera exactamente ${targetMCQCount} preguntas de selección múltiple en core.mcqQuestions.`;

    const cascadeResult = await generateWithGeminiCascade(ai, {
      contents: userPrompt,
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bloomFocus: { type: Type.INTEGER },
          estimatedMinutes: { type: Type.INTEGER },
          isWarmupActive: { type: Type.BOOLEAN },
          warmup: {
            type: Type.OBJECT,
            properties: {
              durationMinutes: { type: Type.INTEGER },
              instructions: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    conceptTested: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                  required: ['id', 'question', 'conceptTested', 'options', 'correctAnswer', 'explanation'],
                },
              },
            },
            required: ['durationMinutes', 'instructions', 'questions'],
          },
          core: {
            type: Type.OBJECT,
            properties: {
              durationMinutes: { type: Type.INTEGER },
              problem: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  problemStatement: { type: Type.STRING },
                  bloomLevel: { type: Type.INTEGER },
                  domainContext: { type: Type.STRING },
                  codeSnippet: { type: Type.STRING },
                  guidingQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  expectedKeyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['title', 'problemStatement', 'bloomLevel', 'domainContext', 'expectedKeyPoints'],
              },
              mcqQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    fromTable: { type: Type.BOOLEAN },
                    sourceConceptName: { type: Type.STRING },
                  },
                  required: ['id', 'question', 'options', 'correctAnswer', 'explanation'],
                },
              },
            },
            required: ['durationMinutes', 'problem', 'mcqQuestions'],
          },
        },
        required: ['bloomFocus', 'estimatedMinutes', 'warmup', 'core'],
      },
    });

    const sessionData = JSON.parse(cascadeResult.text || '{}');
    sessionData.isWarmupActive = hasPriorConcepts;
    return res.json({ success: true, data: sessionData });
  } catch (error: any) {
    console.error('Error generating session via Gemini 1.5 Flash:', error);
    return res.status(200).json({ success: false, error: error?.message });
  }
});

// API: Evaluate Student Submission (evaluating Warmup, Core MCQs and Open Problem)
app.post('/api/pedagogical/evaluate-submission', async (req, res) => {
  try {
    const { session, studentAnswer, warmupAnswers, mcqAnswers = {}, timeSpentMinutes } = req.body;

    if (!ai) {
      return res.status(200).json({
        success: false,
        message: 'No GEMINI_API_KEY configured on server; using local evaluation engine.',
      });
    }

    const coreQuestions = session.core?.mcqQuestions || [];
    let mcqCorrect = 0;
    coreQuestions.forEach((q: any) => {
      if (mcqAnswers[q.id] === q.correctAnswer) {
        mcqCorrect++;
      }
    });

    const systemPrompt = `Actúa como evaluador experto y tutor pedagógico de alto rendimiento impulsado por Gemini 1.5 Flash.
Evalúa rigurosamente la respuesta del alumno para el examen y el problema propuesto considerando:
1. TAXONOMÍA DE BLOOM REVISADA: Determina qué nivel demostró realmente (1 a 6).
2. PREGUNTAS DE SELECCIÓN MÚLTIPLE: El estudiante obtuvo ${mcqCorrect} de ${coreQuestions.length} aciertos. Pondera este rendimiento objetivamente.
3. FORMATO MATEMÁTICO: Analiza la exactitud de fórmulas y rigor en LaTeX si corresponde.
4. PROGRAMACIÓN / LINGÜÍSTICA: Analiza corrección sintáctica, semántica o complejidad.
5. RETROALIMENTACIÓN: Explica fortalezas, errores conceptuales y paso de repaso espaciado (SRS).
6. FORMATO DE SALIDA ESTRICTO: Responde ÚNICAMENTE en JSON con el esquema definido.`;

    const userPrompt = `Problema evaluado: ${JSON.stringify(session.core?.problem || {})}
Preguntas de Selección Múltiple del Núcleo: ${JSON.stringify(coreQuestions)}
Respuestas del estudiante a Selección Múltiple: ${JSON.stringify(mcqAnswers)}
Aciertos en Selección Múltiple: ${mcqCorrect}/${coreQuestions.length}.
Respuesta del alumno al problema de desarrollo:
${studentAnswer || '(Sin respuesta de desarrollo abierta)'}
Respuestas del calentamiento Warm-up: ${JSON.stringify(warmupAnswers || {})}
Tiempo empleado: ${timeSpentMinutes || 15} minutos.`;

    const cascadeResult = await generateWithGeminiCascade(ai, {
      contents: userPrompt,
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER, description: 'Calificación total de 0 a 100' },
          bloomMastery: { type: Type.INTEGER, description: 'Nivel 1 a 6 de Bloom demostrado' },
          summary: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          areasToReinforce: { type: Type.ARRAY, items: { type: Type.STRING } },
          latexExplanation: { type: Type.STRING },
          recommendedNextStep: { type: Type.STRING },
          srsRepetitionIntervalDays: { type: Type.INTEGER, description: 'Días recomendados para el próximo repaso espaciado' },
        },
        required: ['score', 'bloomMastery', 'summary', 'strengths', 'areasToReinforce', 'recommendedNextStep', 'srsRepetitionIntervalDays'],
      },
    });

    const evalData = JSON.parse(cascadeResult.text || '{}');
    if (coreQuestions.length > 0) {
      evalData.mcqScore = {
        total: coreQuestions.length,
        correct: mcqCorrect,
        percentage: Math.round((mcqCorrect / coreQuestions.length) * 100),
      };
    }

    return res.json({ success: true, data: evalData });
  } catch (error: any) {
    console.error('Error evaluating submission via Gemini 1.5 Flash:', error);
    return res.status(200).json({ success: false, error: error?.message });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
