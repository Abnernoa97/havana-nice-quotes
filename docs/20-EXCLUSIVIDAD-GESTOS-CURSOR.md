# Exclusividad de gestos y cursor Android

La fuente del error era la escucha de eventos de página completa en `useCarolinaGesture`. El fondo recibía gestos que empezaban sobre texto seleccionado.

Se elimina esa captura global: ahora **solo la capa sobre la que comienza el gesto** puede mover, ampliar o girar. Las demás capas no participan. Se mantiene la pulsación prolongada y la interacción desde Capas.

Un toque sobre texto ya seleccionado para transformar permite editarlo directamente. La escucha global de confirmaciones no interrumpe ese toque. Al editar, el nodo usa selección DOM nativa y admite colocación del caret por coordenadas (Android/iPhone). La zona táctil para texto seleccionado es invisible y más grande; el tamaño de las letras no cambia.

No se modifican registros, D1, R2, Scroll ni PageFlip. Prueba física pendiente: texto sobre fondo con foto, pinza solo texto, mover solo foto, posición del caret dentro de palabras y selección táctil.
