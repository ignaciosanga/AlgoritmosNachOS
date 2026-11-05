Guia.registrar('introduccion', {
  titulo: 'Introducción', icono: 'school',
  resumen: 'Aquí aprendes qué es un algoritmo, para qué sirve y cómo se mide si es rápido o lento, con ejemplos que puedes tocar.',
  paraQue: [
    'Es el punto de partida si nunca viste estos temas. Explica qué es un algoritmo, dónde se usan, qué características debe cumplir y qué es la <b>complejidad</b> (cuánto trabajo hace cuando los datos crecen).',
    'Al final hay videos y unas preguntas para comprobar lo que aprendiste.'
  ],
  ejemplo: 'Una receta de cocina es un algoritmo: los ingredientes son la entrada, los pasos son el proceso y el plato es la salida.',
  pasos: [
    'Lee «¿Qué es un algoritmo?» y avanza el ejemplo del número mayor con «Siguiente».',
    'Mira los usos y las características.',
    'En «Complejidad», mueve el control de <b>n</b> y compara cuánto crece cada tipo.',
    'Responde las preguntas del final para comprobar lo que aprendiste.'
  ],
  controles: [
    { sel: '#i-que-es .demo', icono: 'touch_app', nombre: 'Ejemplo paso a paso', texto: 'Muestra cómo un algoritmo recorre una lista para encontrar el número mayor. El número en <b style="color:var(--verde-t)">verde</b> es el mayor hasta ahora y el borde <b style="color:var(--ambar-t)">ámbar</b> marca el que se está comparando.' },
    { sel: '#i-sig', icono: 'navigate_next', nombre: 'Siguiente', texto: 'Avanza un paso del ejemplo. «Otros números» cambia la lista para probar de nuevo.' },
    { sel: '#i-complejidad .complejidad', icono: 'speed', nombre: 'Comparador de complejidad', texto: 'Mueve el control para cambiar el tamaño de la entrada. Las barras muestran cuántas operaciones hace cada tipo y cuánto tardaría una computadora.' },
    { sel: '#i-videos', icono: 'smart_display', nombre: 'Videos de apoyo', texto: 'Videos en español en YouTube para reforzar cada tema.' },
    { sel: '[data-quiz="introduccion"]', icono: 'quiz', nombre: 'Ponte a prueba', texto: 'Preguntas rápidas: al elegir una opción se pinta de <b style="color:var(--verde-t)">verde</b> si es correcta o de <b style="color:var(--rojo-t)">rojo</b> si no, con la explicación.' }
  ],
  colores: [['verde', 'Correcto, resultado o elemento ya resuelto'], ['ambar', 'Lo que se está revisando en este momento'], ['azul', 'Información o dato importante'], ['rojo', 'Error o algo a tener cuidado'], ['violeta', 'Algo especial o una pregunta para practicar']],
  consejos: ['Si un concepto no queda claro, mira el video de ese tema y vuelve a mover el ejemplo.'],
  preguntas: [
    { p: '¿Cuál de estas NO es una característica de un algoritmo?', o: ['Es finito', 'Es preciso', 'Puede repetirse para siempre', 'Tiene una salida'], c: 2, e: 'Un algoritmo debe terminar después de un número limitado de pasos: si se repite para siempre, no es un algoritmo.' },
    { p: 'Buscar el número mayor en una lista de n números necesita n − 1 comparaciones. ¿Qué complejidad tiene?', o: ['O(1)', 'O(n)', 'O(n²)', 'O(2ⁿ)'], c: 1, e: 'El trabajo crece igual que el tamaño de la lista: si la lista se duplica, las comparaciones también. Eso es lineal, O(n).' },
    { p: 'Con n = 1000, ¿cuál hace más operaciones?', o: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'], c: 1, e: 'O(n²) con n = 1000 son 1 000 000 de operaciones; O(n log n) son unas 10 000.' }
  ]
});

Guia.registrar('grafos', {
  titulo: 'Grafos', icono: 'hub',
  resumen: 'Aquí dibujas un grafo con nodos y conexiones con peso, y ves al instante su matriz de adyacencia y cuántas conexiones entran y salen de cada nodo.',
  paraQue: [
    'Sirve para <b>dibujar relaciones</b>: ciudades y carreteras, personas y amistades, tareas que dependen de otras. Cada punto es un <b>nodo</b> y cada flecha una <b>conexión</b> con su peso (distancia, costo o tiempo).',
    'Mientras dibujas, la página arma la <b>matriz de adyacencia</b> y la tabla de <b>cardinalidad</b>, y te dice si el grafo se puede resolver con Asignación o con Johnson.'
  ],
  ejemplo: 'Un mapa de rutas: las ciudades son nodos y cada carretera es una flecha con los kilómetros como peso.',
  pasos: [
    'Elige la herramienta <b>Nodo</b> y toca el lienzo para crear nodos.',
    'Elige <b>Conectar</b>: toca el nodo de origen, luego el de destino y escribe el peso. Si tocas el mismo nodo dos veces, creas un bucle.',
    'Usa <b>Editar</b> para cambiar nombres o pesos y <b>Borrar</b> para quitar algo.',
    'Revisa abajo la matriz y la cardinalidad.',
    'Si quieres resolverlo, usa <b>Enviar a Asignación</b> o <b>Enviar a Johnson</b>.'
  ],
  controles: [
    { sel: '#g-editor .barra-herramientas', icono: 'construction', nombre: 'Herramientas', texto: '<b>Mover</b> arrastra nodos, <b>Nodo</b> crea nodos, <b>Conectar</b> une dos nodos con una flecha, <b>Editar</b> cambia nombres o pesos y <b>Borrar</b> elimina.' },
    { sel: '#g-editor .lienzo', icono: 'draw', nombre: 'Lienzo', texto: 'Aquí se dibuja el grafo. Debajo de cada nodo aparece <b>E</b> (conexiones que entran) y <b>S</b> (conexiones que salen).' },
    { sel: '#g-editor [data-acc=organizar]', icono: 'auto_awesome_mosaic', nombre: 'Organizar', texto: 'Acomoda los nodos solos: en capas si el grafo avanza en un solo sentido, o en círculo si tiene ciclos.' },
    { sel: '#g-estado', icono: 'fact_check', nombre: 'Qué algoritmos puedes usar', texto: 'Te dice si el grafo sirve para Asignación (y si la matriz es cuadrada) y para Johnson (si no tiene ciclos). <b style="color:var(--verde-t)">Verde</b> = disponible, <b style="color:var(--rojo-t)">rojo</b> = no disponible y por qué.' },
    { sel: '#g-a-asignacion', icono: 'assignment_ind', nombre: 'Enviar a Asignación / Johnson', texto: 'Pasa el grafo a esa pantalla para resolverlo. Se desactivan solos si el grafo no cumple las reglas del algoritmo.' },
    { sel: '#g-tarjeta-matriz', icono: 'grid_on', nombre: 'Matriz de adyacencia', texto: 'Fila = origen, columna = destino. <b>Solo con conexiones</b> oculta filas y columnas que solo tendrían ceros; <b>Completa</b> muestra todos los nodos. <b>Binaria</b> pone 1 si hay conexión y 0 si no.' },
    { sel: '#g-aplicar', icono: 'done', nombre: 'Aplicar matriz al grafo', texto: 'Si escribes pesos en la matriz, este botón los dibuja en el grafo. «Nuevo desde matriz» crea nodos vacíos para llenar la tabla desde cero.' },
    { sel: '#g-cardinalidad', icono: 'table_rows', nombre: 'Cardinalidad', texto: 'Cuántas conexiones entran y salen de cada nodo, si tiene bucle y su grado (entradas + salidas).' },
    { sel: '#g-guardar', icono: 'download', nombre: 'Guardar, abrir y PNG', texto: 'Guarda tu grafo como archivo .json para abrirlo después, o descárgalo como imagen.' }
  ],
  colores: [['negro', 'Nodo seleccionado como origen al conectar'], ['verde', 'Algoritmo disponible'], ['rojo', 'Algoritmo no disponible'], ['azul', 'Celda con conexión en la matriz binaria y en el ejemplo']],
  consejos: ['Entre dos nodos puede haber como máximo dos conexiones: una de ida y otra de vuelta. Al conectar, marca «ida y vuelta» para crear las dos a la vez.'],
  cuidado: ['Johnson no acepta ciclos (por ejemplo A → B → A). Si aparece en rojo, borra una de las flechas del ciclo.'],
  complejidad: 'Armar la matriz de adyacencia de V nodos es O(V²): 10 nodos son 100 celdas.',
  preguntas: [
    { p: 'En la matriz de adyacencia, ¿qué representa la celda (fila B, columna C)?', o: ['La conexión de C hacia B', 'La conexión de B hacia C', 'La suma de B y C', 'Cuántas veces aparece B'], c: 1, e: 'La fila es el origen y la columna el destino: (B, C) es la flecha que va de B a C.' },
    { p: 'Un nodo tiene 2 flechas que llegan y 1 que sale. ¿Cuál es su grado?', o: ['1', '2', '3', '4'], c: 2, e: 'Grado = entradas + salidas = 2 + 1 = 3.' },
    { p: '¿Qué es un bucle?', o: ['Una conexión de un nodo hacia sí mismo', 'Un nodo sin conexiones', 'Dos flechas entre los mismos nodos', 'Un camino muy largo'], c: 0, e: 'Un bucle sale de un nodo y vuelve al mismo nodo. En la matriz aparece en la diagonal.' }
  ]
});

Guia.registrar('asignacion', {
  titulo: 'Método de asignación', icono: 'assignment_ind',
  resumen: 'Aquí repartes tareas entre agentes al menor costo (o mayor beneficio) con el método húngaro, y ves cada paso explicado.',
  paraQue: [
    'Sirve cuando hay <b>agentes</b> (personas, máquinas) y <b>tareas</b>, y cada agente debe hacer <b>una sola tarea</b>. Cada combinación tiene un costo y se busca el reparto con el costo total más bajo (o el beneficio más alto).',
    'Si hay más agentes que tareas (o al revés), la página agrega una <b>ficticia</b> para equilibrar.'
  ],
  ejemplo: 'Tres técnicos y tres reparaciones: cada técnico tarda distinto en cada reparación. ¿Quién hace cuál para terminar en el menor tiempo total?',
  pasos: [
    'Elige si quieres trabajar con <b>Matriz</b> o con <b>Grafo</b>.',
    'Escribe los costos (o dibuja agentes y tareas conectados). Deja vacía una celda si esa asignación no se puede.',
    'Elige <b>Minimizar costo</b> o <b>Maximizar beneficio</b>.',
    'Presiona <b>Resolver</b> y revisa las asignaciones y el paso a paso.',
    'Con «Ver la solución en el grafo» la ves dibujada en verde.'
  ],
  controles: [
    { sel: '#a-modo', icono: 'swap_horiz', nombre: 'Matriz o grafo', texto: 'Puedes escribir la tabla de costos o dibujarla como grafo. Al cambiar, los datos se convierten solos y la matriz solo usa los nodos que tienen conexiones.' },
    { sel: '#a-objetivo', icono: 'swap_vert', nombre: 'Objetivo', texto: '<b>Minimizar</b> para costos o tiempos; <b>Maximizar</b> para ganancias o puntajes.' },
    { sel: '#a-panel-matriz .fila-controles', clic: '#a-modo [data-valor=matriz]', icono: 'aspect_ratio', nombre: 'Tamaño y datos', texto: 'Cambia la cantidad de agentes (filas) y tareas (columnas), carga un ejemplo, llena con números al azar o limpia la tabla.' },
    { sel: '#a-dim', icono: 'crop_square', nombre: 'Indicador de forma', texto: 'Te dice si la matriz es cuadrada. Si no lo es, te avisa cuántas filas o columnas <b style="color:var(--violeta-t)">ficticias</b> se van a agregar.' },
    { sel: '#a-tabla', icono: 'grid_on', nombre: 'Tabla de costos', texto: 'Filas = agentes y columnas = tareas. Puedes cambiar los nombres y pegar datos desde Excel. Una celda con «—» significa que esa asignación no se puede hacer.' },
    { sel: '#a-resolver', icono: 'play_arrow', nombre: 'Resolver', texto: 'Aplica el método húngaro y muestra el resultado con su paso a paso.' },
    { sel: '#a-resultado .tarjeta', icono: 'checklist', nombre: 'Resultado', texto: 'Muestra el costo total, quién hace qué tarea y cada paso del método con sus colores.' }
  ],
  colores: [['verde', 'Asignación elegida'], ['ambar', 'Ceros (candidatos a asignar)'], ['azul', 'Filas o columnas tapadas por una línea'], ['violeta', 'Fila o columna ficticia'], ['gris', 'Fila o columna eliminada por estar vacía']],
  consejos: ['Si un agente no puede hacer una tarea, deja esa celda vacía en lugar de poner un número muy grande.', 'Para maximizar, el método resta cada valor del mayor y luego minimiza: así funciona igual.'],
  cuidado: ['Las filas o columnas que no tienen ningún valor se eliminan antes de resolver: no aportan nada.'],
  complejidad: 'El método húngaro es O(n³). Para 10 agentes son unos 1 000 pasos, en vez de probar las 3 628 800 combinaciones posibles.',
  preguntas: [
    { p: 'Hay 4 agentes y 3 tareas. ¿Qué hace el método?', o: ['No se puede resolver', 'Agrega una tarea ficticia con costo 0', 'Elimina un agente al azar', 'Duplica una tarea'], c: 1, e: 'Se agrega una columna ficticia con costo 0 para que la matriz sea cuadrada. El agente que la reciba se queda sin tarea.' },
    { p: '¿Qué se hace en la reducción por filas?', o: ['Se suma 1 a cada fila', 'Se resta a cada fila su menor valor', 'Se borra la fila con más ceros', 'Se ordena cada fila'], c: 1, e: 'A cada fila se le resta su menor valor, así cada fila tiene al menos un cero.' },
    { p: '¿Cuándo se puede elegir la asignación óptima?', o: ['Cuando hay al menos un cero', 'Cuando hacen falta tantas líneas como filas para tapar los ceros', 'Después de 3 iteraciones', 'Cuando la matriz no tiene ceros'], c: 1, e: 'Si se necesitan n líneas para tapar todos los ceros en una matriz de n × n, se puede elegir un cero distinto por fila y columna.' }
  ]
});

Guia.registrar('johnson', {
  titulo: 'Algoritmo de Johnson', icono: 'route',
  resumen: 'Aquí encuentras la ruta crítica de un proyecto: los tiempos más tempranos y más tardíos de cada evento y qué actividades no pueden retrasarse.',
  paraQue: [
    'Sirve para <b>planificar proyectos</b>. Cada nodo es un evento (cuando algo empieza o termina) y cada flecha es una actividad con su duración.',
    'Calcula el <b>TE</b> (lo más pronto que ocurre cada evento), el <b>TL</b> (lo más tarde sin retrasar el final), las <b>holguras</b> y la <b>ruta crítica</b>.'
  ],
  ejemplo: 'Construir una casa: no se puede techar antes de levantar las paredes. Johnson dice cuánto dura la obra como mínimo y qué tareas no admiten retrasos.',
  pasos: [
    'Dibuja la red (o escríbela como matriz). Cada flecha lleva la duración de la actividad.',
    'Elige <b>Maximizar</b> para la ruta crítica o <b>Minimizar</b> para el camino más corto.',
    'Presiona <b>Resolver</b>.',
    'Usa <b>Ver animación de ida y vuelta</b> para ver cómo se calcula cada TE y cada TL sobre la red.',
    'Revisa las tablas de nodos y actividades: las filas en rojo son las críticas.'
  ],
  controles: [
    { sel: '#j-modo', icono: 'swap_horiz', nombre: 'Red o matriz', texto: 'Trabaja dibujando la red o escribiendo la matriz. La diagonal de la matriz está bloqueada porque un evento no se conecta consigo mismo.' },
    { sel: '#j-objetivo', icono: 'swap_vert', nombre: 'Objetivo', texto: '<b>Maximizar</b> calcula la ruta crítica (la duración del proyecto). <b>Minimizar</b> encuentra el camino más corto del inicio al final.' },
    { sel: '#j-editor .lienzo', clic: '#j-modo [data-valor=grafo]', icono: 'draw', nombre: 'Red de actividades', texto: 'Dibuja aquí los eventos y las actividades. Ya hay un ejemplo cargado para probar.' },
    { sel: '#j-resolver', icono: 'play_arrow', nombre: 'Resolver', texto: 'Calcula TE, TL, holguras y la ruta crítica.' },
    { sel: '#j-resultado .tarjeta', icono: 'checklist', nombre: 'Resultado', texto: 'Muestra la duración del proyecto, la ruta crítica en <b style="color:var(--rojo-t)">rojo</b> y las tablas de nodos y actividades.' },
    { sel: '#j-anim', icono: 'play_circle', nombre: 'Animación', texto: 'Recorre el cálculo paso a paso: el nodo en <b style="color:var(--ambar-t)">ámbar</b> es el que se está calculando, las flechas <b style="color:var(--azul-t)">azules</b> son las que se usan y los nodos ya calculados quedan en azul.' }
  ],
  colores: [['rojo', 'Ruta crítica: holgura 0'], ['ambar', 'Evento que se está calculando'], ['azul', 'Flechas que se usan en el cálculo y eventos ya calculados'], ['verde', 'Fin de la animación']],
  consejos: ['En la ida se toma el máximo porque un evento solo ocurre cuando terminan todas las actividades que llegan a él.'],
  cuidado: ['La red no puede tener ciclos ni bucles: las actividades siempre avanzan en el tiempo.'],
  complejidad: 'Johnson es O(V + E): recorre cada nodo (V) y cada actividad (E) una vez de ida y otra de vuelta.',
  preguntas: [
    { p: 'A un evento llegan dos actividades: una termina en el día 8 y otra en el día 11. ¿Cuál es su TE?', o: ['8', '11', '19', '3'], c: 1, e: 'El evento ocurre cuando terminan todas las que llegan, o sea, en el día 11 (el máximo).' },
    { p: 'Un evento tiene TE = 5 y TL = 9. ¿Cuál es su holgura?', o: ['14', '4', '0', '−4'], c: 1, e: 'Holgura = TL − TE = 9 − 5 = 4: puede retrasarse hasta 4 sin afectar el final.' },
    { p: '¿Qué tienen en común las actividades de la ruta crítica?', o: ['Son las más cortas', 'Tienen holgura 0', 'Salen del mismo nodo', 'Tienen duración 1'], c: 1, e: 'No tienen margen: si cualquiera se retrasa, todo el proyecto se retrasa.' }
  ]
});

Guia.registrar('northwest', {
  titulo: 'Northwest (esquina noroeste)', icono: 'local_shipping',
  resumen: 'Aquí resuelves problemas de transporte: cuánto enviar de cada origen a cada destino según la oferta y la demanda.',
  paraQue: [
    'Sirve para <b>repartir productos</b> desde varios orígenes (fábricas, almacenes) con una <b>oferta</b> hacia varios destinos (tiendas, ciudades) con una <b>demanda</b>, sabiendo cuánto cuesta enviar una unidad por cada ruta.',
    'Primero arma una solución inicial con el método de la <b>esquina noroeste</b> y después la mejora con el método <b>MODI</b> hasta llegar al costo mínimo (o la ganancia máxima).'
  ],
  ejemplo: 'Tres panaderías abastecen a cuatro tiendas. Cada panadería produce cierta cantidad, cada tienda necesita cierta cantidad y el costo de llevar pan varía según la distancia.',
  pasos: [
    'Define cuántos orígenes (filas) y destinos (columnas) hay y presiona <b>Aplicar tamaño</b>.',
    'Escribe el costo de cada ruta, la <b>oferta</b> de cada origen (columna azul) y la <b>demanda</b> de cada destino (fila azul).',
    'Mira el indicador de balance: si la oferta y la demanda no son iguales, se agrega un origen o destino ficticio.',
    'Presiona <b>Resolver</b>.',
    'Reproduce la animación de la esquina noroeste y luego revisa las iteraciones del método MODI.'
  ],
  controles: [
    { sel: '#n-tamano', icono: 'aspect_ratio', nombre: 'Tamaño y datos', texto: 'Cambia la cantidad de orígenes y destinos, carga un ejemplo (hay uno balanceado y uno desbalanceado), llena con números al azar o limpia.' },
    { sel: '#n-tabla', icono: 'grid_on', nombre: 'Tabla de transporte', texto: 'Cada celda es el costo de enviar <b>una unidad</b> de ese origen a ese destino. La columna <b style="color:var(--azul-t)">Oferta</b> es lo que tiene cada origen y la fila <b style="color:var(--azul-t)">Demanda</b> lo que necesita cada destino.' },
    { sel: '#n-balance', icono: 'balance', nombre: 'Balance', texto: '<b style="color:var(--verde-t)">Verde</b> si la oferta total es igual a la demanda total. Si no, se muestra en <b style="color:var(--violeta-t)">violeta</b> cuánto falta o sobra y qué ficticia se agregará.' },
    { sel: '#n-objetivo', icono: 'swap_vert', nombre: 'Objetivo', texto: '<b>Minimizar</b> si los números son costos; <b>Maximizar</b> si son ganancias.' },
    { sel: '#n-resolver', icono: 'play_arrow', nombre: 'Resolver', texto: 'Calcula la solución inicial y la optimiza.' },
    { sel: '#n-resultado .tarjeta', icono: 'checklist', nombre: 'Resultado', texto: 'El costo óptimo, cuánto mejoró respecto a la esquina noroeste y qué cantidad va por cada ruta.' },
    { sel: '#n-repro', icono: 'play_circle', nombre: 'Animación de la esquina noroeste', texto: 'Muestra celda por celda cómo se reparte la oferta. La celda <b style="color:var(--ambar-t)">ámbar</b> es la actual y las <b style="color:var(--azul-t)">azules</b> ya tienen envío.' }
  ],
  colores: [['ambar', 'Celda que se está llenando'], ['azul', 'Celda con envío, oferta y demanda'], ['violeta', 'Ficticia o 0 por degeneración'], ['verde', 'Celda que entra al optimizar, costo reducido que mejora y resultado óptimo'], ['rojo', 'Celda que sale del ciclo y signo −'], ['gris', 'Fila o columna ya agotada']],
  consejos: ['La esquina noroeste no mira los costos: es rápida pero casi nunca da el mínimo. Por eso después se optimiza con MODI.', 'Una solución válida siempre tiene m + n − 1 celdas con envío (m orígenes, n destinos). Si faltan, se agrega un 0 (degeneración).'],
  cuidado: ['La oferta y la demanda no pueden ser negativas. Las celdas de costo vacías cuentan como 0.'],
  complejidad: 'La esquina noroeste es O(m + n): avanza una celda por paso. Cada iteración de MODI es O(m · n).',
  preguntas: [
    { p: 'En la esquina noroeste, ¿cuánto se asigna a cada celda?', o: ['Siempre la oferta completa', 'El menor entre la oferta que queda y la demanda que queda', 'El costo de la celda', 'La mitad de la demanda'], c: 1, e: 'Se manda todo lo posible: el menor de los dos, para no pasarse de lo que hay ni de lo que se pide.' },
    { p: 'La oferta total es 140 y la demanda total 120. ¿Qué se hace?', o: ['Se agrega un destino ficticio con demanda 20', 'Se agrega un origen ficticio con oferta 20', 'Se borra un origen', 'No se puede resolver'], c: 0, e: 'Sobran 20 unidades: un destino ficticio las «recibe» con costo 0. En la realidad, no se envían.' },
    { p: 'En MODI (minimizando), ¿qué celda entra?', o: ['La de mayor costo', 'La de costo reducido más negativo', 'Cualquier celda vacía', 'La esquina noroeste'], c: 1, e: 'El costo reducido negativo indica cuánto baja el costo por cada unidad enviada ahí: se elige el más negativo.' }
  ]
});

Guia.registrar('sort', {
  titulo: 'Ordenamiento (Sort)', icono: 'bar_chart',
  resumen: 'Aquí ves, barra por barra, cómo distintos algoritmos ordenan una lista de números, y comparas cuánto trabajo hace cada uno.',
  paraQue: [
    'Ordenar es una de las tareas más comunes en computación: listas de contactos, precios, rankings. Hay muchas formas de hacerlo y cada una tiene ventajas.',
    'Esta pantalla anima seis algoritmos: <b>Burbuja, Selección, Inserción, Shell, Merge y Quick</b>. Muestra el pseudocódigo, cuenta comparaciones e intercambios y explica cada paso.'
  ],
  ejemplo: 'Ordenar cartas en la mano es el algoritmo de inserción: tomas una carta y la deslizas hasta su lugar entre las que ya ordenaste.',
  pasos: [
    'Elige un algoritmo y el orden (de menor a mayor o al revés).',
    'Genera números al azar o escribe los tuyos separados por comas.',
    'Presiona ▶ para ver la animación, o avanza paso a paso con las flechas.',
    'Lee la explicación de cada paso y mira qué línea del pseudocódigo se está ejecutando.',
    'Prueba otro algoritmo con la misma lista y compara los contadores.'
  ],
  controles: [
    { sel: '#s-algoritmos', icono: 'tune', nombre: 'Algoritmo', texto: 'Elige cuál de los seis algoritmos quieres ver. Al cambiar, la animación vuelve al inicio con la misma lista.' },
    { sel: '#s-orden', icono: 'sort', nombre: 'Orden', texto: 'De menor a mayor o de mayor a menor.' },
    { sel: '#s-datos', icono: 'casino', nombre: 'Datos', texto: '<b>Aleatorio</b> genera la cantidad de números que indiques (máximo 30). También puedes escribir tus números y presionar <b>Cargar</b>.' },
    { sel: '#s-escenario', icono: 'bar_chart', nombre: 'Barras', texto: 'Cada barra es un número: más alta = más grande. Los colores dicen qué está pasando en cada paso.' },
    { sel: '#s-repro', icono: 'play_circle', nombre: 'Reproductor', texto: 'Reproduce o pausa, avanza o retrocede un paso, salta al inicio o al final, y cambia la velocidad.' },
    { sel: '#s-narracion', icono: 'record_voice_over', nombre: 'Explicación', texto: 'Describe en palabras lo que hace el algoritmo en ese momento.' },
    { sel: '#s-contadores', icono: 'pin', nombre: 'Contadores', texto: 'Cuántas comparaciones e intercambios lleva. Sirven para comparar qué algoritmo trabaja menos con la misma lista.' },
    { sel: '#s-pseudo', icono: 'code', nombre: 'Pseudocódigo', texto: 'Los pasos del algoritmo escritos casi como código. La línea en <b style="color:var(--azul-t)">azul</b> es la que se está ejecutando.' },
    { sel: '#s-ficha', icono: 'info', nombre: 'Ficha del algoritmo', texto: 'Su complejidad en el mejor, promedio y peor caso, si usa memoria extra, si es estable y cuándo conviene usarlo.' }
  ],
  colores: [['ambar', 'Números que se están comparando'], ['rojo', 'Números que se intercambian (o se copian en Merge)'], ['verde', 'Número en su lugar final'], ['violeta', 'Pivote (en Quick)'], ['azul', 'Elemento marcado: el candidato en Selección o el que se inserta en Inserción'], ['verde-s', 'Parte ya ordenada, pero que todavía puede moverse'], ['gris', 'Números fuera de la parte que se está trabajando']],
  consejos: ['Prueba la misma lista con Burbuja y con Quick: verás cuántas comparaciones menos hace Quick.', 'Con una lista casi ordenada, Inserción y Burbuja terminan muy rápido.'],
  complejidad: 'Burbuja, Selección e Inserción son O(n²). Merge es O(n log n) siempre; Quick es O(n log n) en promedio.',
  preguntas: [
    { p: '¿Qué algoritmo divide la lista en mitades y luego las mezcla?', o: ['Burbuja', 'Merge', 'Selección', 'Inserción'], c: 1, e: 'Merge sort usa «divide y vencerás»: parte la lista hasta tener números sueltos y luego mezcla en orden.' },
    { p: 'En Burbuja, después de la primera pasada (de menor a mayor), ¿qué se puede asegurar?', o: ['El menor está al principio', 'El mayor está al final', 'La lista está ordenada', 'Nada'], c: 1, e: 'En cada pasada el mayor «burbujea» hasta el final y queda en su lugar.' },
    { p: '¿Cuál tiene complejidad O(n log n) en todos los casos?', o: ['Quick', 'Burbuja', 'Merge', 'Selección'], c: 2, e: 'Merge siempre divide en mitades: su peor caso también es O(n log n). Quick puede llegar a O(n²) si elige malos pivotes.' }
  ]
});

Guia.registrar('arboles', {
  titulo: 'Árboles binarios', icono: 'account_tree',
  resumen: 'Aquí creas un árbol binario de búsqueda, ves sus recorridos animados y puedes reconstruir un árbol a partir de dos recorridos.',
  paraQue: [
    'Un <b>árbol binario de búsqueda</b> guarda números de forma que encontrarlos sea rápido: en cada nodo, los <b>menores van a la izquierda</b> y los <b>mayores a la derecha</b>.',
    'Esta pantalla anima cómo se inserta, busca y elimina un valor, muestra los cuatro recorridos (preorden, inorden, postorden y por niveles) y reconstruye un árbol a partir del inorden con el preorden o el postorden.'
  ],
  ejemplo: 'Adivinar un número del 1 al 100 diciendo «más alto» o «más bajo»: cada respuesta descarta la mitad. Un árbol de búsqueda hace lo mismo.',
  pasos: [
    'Escribe un número y presiona <b>Insertar</b> (también puedes escribir varios separados por comas). Mira cómo baja por el árbol.',
    'Prueba <b>Buscar</b> y <b>Eliminar</b> con un valor del árbol.',
    'En «Recorridos», presiona <b>Animar</b> en cualquiera para ver el orden en que se visitan los nodos.',
    'En «Reconstruir árbol», escribe el inorden y el preorden (o el postorden) y presiona <b>Construir</b>.'
  ],
  controles: [
    { sel: '#t-acciones', icono: 'edit', nombre: 'Insertar, buscar y eliminar', texto: 'Escribe un valor y elige qué hacer. Al insertar varios valores separados por comas, se agregan en ese orden.' },
    { sel: '#t-extras', icono: 'casino', nombre: 'Aleatorios, ejemplo y limpiar', texto: 'Inserta números al azar (eliges cantidad y rango), carga un árbol de ejemplo o vacía el árbol.' },
    { sel: '#t-lienzo', icono: 'account_tree', nombre: 'Árbol', texto: 'El dibujo del árbol. A la izquierda se indica el nivel de cada piso (N0 es la raíz).' },
    { sel: '#t-repro', icono: 'play_circle', nombre: 'Reproductor', texto: 'Repite la última animación, la pausa o la avanza paso a paso.' },
    { sel: '#t-narracion', icono: 'record_voice_over', nombre: 'Explicación', texto: 'Dice qué comparación se hace o qué nodo se visita en cada paso.' },
    { sel: '#t-stats', icono: 'analytics', nombre: 'Datos del árbol', texto: 'Cantidad de nodos, altura, hojas (nodos sin hijos), mínimo, máximo y si cumple la regla de búsqueda.' },
    { sel: '#t-recorridos', icono: 'route', nombre: 'Recorridos', texto: 'Las cuatro formas de recorrer el árbol. «Animar» muestra el orden de visita y «Copiar» copia la lista.' },
    { sel: '#t-recon', icono: 'build', nombre: 'Reconstruir árbol', texto: 'Con el inorden y el preorden (o el postorden) se puede armar el árbol original. Se explica cada paso.' }
  ],
  colores: [['ambar', 'Nodo que se está revisando'], ['azul', 'Camino recorrido'], ['verde', 'Nodo encontrado o insertado, y nodos ya visitados'], ['rojo', 'Nodo que se va a eliminar (o valor repetido)'], ['violeta', 'Árbol que no es de búsqueda']],
  consejos: ['El inorden de un árbol de búsqueda siempre sale ordenado de menor a mayor: sirve para comprobar que el árbol está bien.', 'Para reconstruir: la raíz es el primero del preorden (o el último del postorden); en el inorden, lo que está a su izquierda forma el subárbol izquierdo.'],
  cuidado: ['No se admiten valores repetidos. Para reconstruir, cada valor debe aparecer una sola vez en cada recorrido.'],
  complejidad: 'Buscar, insertar y eliminar cuestan O(h), donde h es la altura. En un árbol equilibrado h ≈ log₂ n: con 1000 nodos, unas 10 comparaciones.',
  preguntas: [
    { p: 'Se inserta 45 en un árbol cuya raíz es 50 y su hijo izquierdo es 30. ¿Dónde queda 45?', o: ['Hijo derecho de 50', 'Hijo derecho de 30', 'Hijo izquierdo de 30', 'Como nueva raíz'], c: 1, e: '45 < 50 → izquierda (llega a 30). 45 > 30 → derecha de 30.' },
    { p: '¿Qué recorrido de un árbol de búsqueda da los valores ordenados?', o: ['Preorden', 'Postorden', 'Inorden', 'Por niveles'], c: 2, e: 'Inorden visita izquierda, raíz, derecha: como los menores están a la izquierda, sale ordenado.' },
    { p: 'En el preorden 8, 3, 1, 6, 10, ¿cuál es la raíz?', o: ['1', '8', '10', '6'], c: 1, e: 'En preorden la raíz siempre es el primer valor.' }
  ]
});
