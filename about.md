“VersoRefuerzo” es una web app que ayuda al usuario a memorizar versos bíblicos cristianos con una sobresaliente UX/UI. “Memory Flashcards Game”.

La app es moderna, simple de usar, con un gran enfoque en practicidad, 100% gratis para los usuarios, sin fines lucrativos. Las funcionalidades principales son las siguientes:

- Log-in con Google.
- Cada usuario tiene su colección de versos 100% privada. Los usuarios no pueden ver las colecciones de otros usuarios.
- La app tiene un diseño hermoso de UI, pero es minimalista, simple de usar, altamente intuitiva.
- La app le permite al usuario agregar un verso, despliega un pequeño form para ingresar una cita bíblica, e.g “Juan 14:6”. El form también incluye un dropdown para seleccionar una versión de la biblia, las siguientes opciones deberían estar presentes: “NBLA”, “NVI”, “Reina Valera 1960”. La app permite al usuario escoger un ícono y color de tarjeta. (está científicamente comprobado que el uso de “visual queues” ayuda con la memorización), la app tiene una larga lista de íconos svgs que pueden ser útiles, e.g por defecto puede ser un ícono de biblia, pero el usuario tendrá opciones de cambiar eso por un ícono de oveja, león, peces y pan por ejemplo, íconos que podrían ser relevantes al verso que el usuario está tratando de memorizar. El usuario también puede agregar un texto “pista/ayuda”, e.g “camino, verdad, vida”. el texto pista solo será visible en la tarjeta una vez que el usuario se “rinda/no se acuerde” del verso y quiera una pequeña ayuda.
- La app permite al usuario crear colecciones de versos, carpetas/grupos de versos. un verso podría ser miembro de múltiples grupos. y el uso de visual queues de colores deberán de estar presentes claramente. ejemplo: si un usuario agrega varios versos que son del libro de Romanos, el usuario podría crear una carpeta llamada “Romanos” y meter todos esos versos ahí. Después de agregar esos versos, las tarjetas de memorización de dichos versos tendrán algún tipo de indicador, ya sea color, o “tag/label” que claramente muestren que dicha tarjeta pertenece al grupo “Romanos”. Hay que tener en cuenta que una tarjeta podría pertenecer a múltiples colecciones.
- La app claramente usa “science based proven memorization technics”.
- La app permite varios modos de juego, ejemplos:
  - Random. (saldrán tarjetas aleatorias de todas las existentes)
  - Por Grupo/Colección. solo saldrán tarjetas de manera aleatorias que solo pertenezcan al grupo seleccionado.
  - Personalizada, tú puedes seleccionar los versos que quieres practicar específicamente.
  - Adicionalmente me gustaría implementar mini juegos, (acá debemos de ser creativos), se me ocurren los siguientes juegos: "Palabras revueltas", "Empareja Versos", "Completa el verso".
- La app le facilita mucho al usuario la experiencia, ya que el usuario nunca tiene que directamente escribir y agregar manualmente el contenido del verso deseado en las diferentes versiones de la biblia, eso lo hace la app automáticamente.
- La app hace uso de las siguiente herramientas:
  - [bible-passage-reference-parser](https://github.com/openbibleinfo/Bible-Passage-Reference-Parser)
  - [API.Bible](http://API.Bible)

    De esta manera nos aseguramos de respetar los derechos de autor y copyright.

- La app tiene muy buena experiencia de usuario, con muchas animaciones 2D, degradados, svg style. transiciones, animaciones, y sonidos, adicionalmente tenemos bonitos y minimalistas efectos de audio para mejorar la UX.
- La app guarda/persiste todos los versos de cada usuario. La app está altamente optimizada para que una vez que un verso ha sido obtenido mediante la API, ese verso queda guardado para siempre. De esta forma la app se vuelve rápida, da una sensación de una app rápida.
- La app es eficiente en espacio y tiempo.
- La app se ve genial en dispositivos móbiles y también en PC. La app es “responsive”

Dado que este proyecto es sin fines de lucro, y no se cobrará nada… es importante que mantengamos los costos los más bajos posibles, de preferencia “under free tier range”. lo único que se deberá de comprar es el dominio web.

El uso de servicios google e.g: cloud, firebase, cloudrun es preferido sobre servicios de amazon o microsoft.

Este proyecto deberá estar “low budget”, de preferencia 100% gratis. Para bases de datos se puede usar Neon por ejemplo.

Fetch this design file, read its readme, and implement the relevant aspects of the design. <https://api.anthropic.com/v1/design/h/oKBC_lK0rFwKEp6N1Psfpg?open_file=VersoRefuerzo.html>
Implement: VersoRefuerzo.html
