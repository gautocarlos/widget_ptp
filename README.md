# Widget Punto a Punto

Widget Mapa sobre API JavaScript de la Unidad de Sistemas de Información geográfica de la Agencia de Sistemas de Información del Gobierno de la Ciudad de Buenos Aires (USIG). *Al momento está usando la versión 2.3 de la misma* -> [documentación](http://servicios.usig.buenosaires.gov.ar/usig-js/2.3/doc/)

Se desarrollaron 2 abstracciones sobre la API para poder trabajar con más facilidad sobre las necesidades del desarrollo del [sitio de gobierno](http://buenosaires.gob.ar):

## PointCollection

Abstracción para facilitar geocoding de un arreglo de direcciones literales con manejo de latencia de los pedidos a los servicios de USIG. Normaliza direcciones, hace geocoding de las mismas y dispara un evento cuando la tarea se completa. *Ejemplo de uso*:

  ``` javascript
  $(document).ready(function() {
    var dirs=Array('maipu y santa fe','lavalle 2304','9 de julio y tucuman');
    var points = new PointCollection();
    for(var i=0;i<dirs.lenght;i++){
      points.addPoint(dirs[i]);
    }
    jQuery("body").bind('all-geocoded',function(e){
      console.log('all points geocoded');
    });
    points.geocode();
  };
  ```

## RecorridosToDestinoMap

Inicializa un widget a partir un arreglo de destinos posibles, un div target para hacer render del mapa. Utiza PointCollection internamente. Al momento está preparado para expandirse a partir de un sidebar sobre la derecha por lo que recibe el ancho total al cual se expande. A futuro, tenemos considerado separar lógica de layout de tal manera de facilitar nuevas aplicaciones utilizando y manteniendo comunes las abstracciones sobre la API de USIG.

  ``` javascript
  $(document).ready(function() {
	  new RecorridosToDestinoMap(
	    "id_target_div",
	    Array('maipu 986','florida 448','Cabral 804'),
	    940);
	});
  ```
