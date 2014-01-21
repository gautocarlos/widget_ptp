function PointCollection(){
    this.points = [];
    this.geocoding = false;
    this.geocoded = false;
    this.norm_ready = false;
    this.init();
}

PointCollection.prototype.init = function(){
    var that = this;
    /*
    cuando un punto hace el triger de 'point-geocoded'
    se evalua si todos estan geocodificados correctamente
    y de ser el caso se hace un trigger de 'all-geocoded'
    */
    jQuery("body").bind('point-geocoded',function(e){
        that.geocoded = true;
        for(var i = 0; i < that.points.length; i++){
            if(!that.points[i].geocoded){
                that.geocoded = false;
                break;
            }
        }
        if(that.geocoded){
            jQuery("body").trigger('all-geocoded', []);
        }
    });

    /*
    inicializando normalizador de direcciones de usig
    */
    new usig.NormalizadorDirecciones.init({
        onReady:function(e){
            if(!that.norm_ready){
                that.norm_ready = true;
                if(that.geocoding){
                    that.geocoding = false;
                    that.geocode();
                }
            }
        }
    });
};

PointCollection.prototype.addPoint = function(street_n_number){
    /*
    Agrega GCPoint al arreglo de puntos a geocodificar 
    */
    var point = new GCPoint(street_n_number);
    this.points.push(point);
};

PointCollection.prototype.geocode = function(){
    /*
    Recorre los puntos a geocodificar. 
    Si no pasan el normalizador de direcciones
    (direccion mal escrita) los saca de la lista
    */
    var that = this;
    if(!that.geocoding){
        that.geocoding = true;
        if(that.norm_ready){
            var remove_points = Array();
            for(var i = 0; i < that.points.length; i++){
                if(that.points[i].geocode() === null){
                  remove_points.push(i);
                }
            }
            for(var j = 0; j < remove_points.length; j++){
              that.points.splice(remove_points[j], 1);
            }
        }
    }
};


function GCPoint(street_n_number){
    /*
    Wrapper class para facilitar la creacion de un punto geometrico 
    a partir de un string.
    */
    this.id = street_n_number;
    this.pt = null;
    this.geocoded = false;
    this.street = street_n_number;
    if(GCPoint.gc === undefined) {
        GCPoint.gc = new usig.GeoCoder();
    }
}
GCPoint.prototype.geocode = function(){
  /*
  Lanza geocodificacion del punto y si no pasa el normalizador de 
  direcciones retorna null
  */
  var that = this;
  try{
    direccion = usig.NormalizadorDirecciones.normalizar(that.street,1)[0];
    that.id = that.street;
    GCPoint.gc.geoCodificarDireccion(
        direccion,
        function(response){
            if(response instanceof usig.Punto) {
                that.pt = response;
                that.geocoded = true;
                jQuery("body").trigger('point-geocoded',[]);
            }
            else {
              console.log(that.id + " " + response);
            }
        },
        function(error){
          console.log(error);
        }
    );
    return that;
  }
  catch(err){
    return null;
  }
};