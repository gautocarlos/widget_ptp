# Widget Punto a Punto

Widget Mapa sobre API JavaScript de la Unidad de Sistemas de Información geográfica de la Agencia de Sistemas de Información del Gobierno de la Ciudad de Buenos Aires (USIG). Al momento está usando la versión 2.3 de la misma -> [documentación](http://servicios.usig.buenosaires.gov.ar/usig-js/2.3/doc/)

Se desarrollaron 2 abstracciones sobre la API para poder trabajar con más facilidad sobre las necesidades:

## PointCollection
Abstracción para facilitar geocoding de un arreglo de direcciones literales con manejo de latencia de los pedidos a los servicios de USIG. Normaliza direcciones, hace geocoding de las mismas y dispara un evento cuando la tarea se completa. Ejemplo de uso:

  ``` javascript
  var dirs=Array('maipu y santa fe','lavalle 2304','9 de julio y tucuman');
  var points = new PointCollection();
  for(var i=0;i<dirs.lenght;i++){
    points.addPoint(dirs[i]);
  }
  points.geocode();
  ```

## RecorridosToDestinoMap
``` javascript
```
