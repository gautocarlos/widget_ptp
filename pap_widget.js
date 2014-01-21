// Wrapper para hacer render de mapa basico de usig
function BasicMap(options){
    this.id = null;
    this.width = null;
    this.dev = false;
    this.ready = false;
    this.map = null;
    this.std_weight = null;
    this.border_width = null;
    // this.styles='<link rel="stylesheet" type="text/css" media="screen" href="http://gcba.github.io/widget_ptp/fonts.css"/><link rel="stylesheet" type="text/css" media="screen" href="http://gcba.github.io/widget_ptp/pap_widget.css"/>';
    this.styles = '\
        <link rel="stylesheet" type="text/css" media="screen" href="fonts.css"/>\
        <link rel="stylesheet" type="text/css" media="screen" href="pap_widget.css"/>\
    ';
}

BasicMap.prototype.init = function(div){
    var that = this;
    that.id = div;
    that.std_width = jQuery('#' + that.id).outerWidth(true);
    jQuery('#' + that.id).append("\
        <div class='wrapper'>\
            <div class='left'></div>\
            <div class='right'></div>\
            <div class='clear'></div>\
            <div class='actions'></div>\
            <div class='clear'></div>\
        </div>\
        <style id='" + that.id + "-styles'></style>\
    ");
    jQuery('#' + that.id + ' .left').append("\
        <div class='mapwrapper'>\
            <div id='" + that.id + "-map' class='map'></div>\
        </div>\
    ");
    this.map = new usig.MapaInteractivo(
        that.id + "-map",
        {
            includeToolbar:false,
            onReady: function(){
                that.ready = true;
                jQuery("body").trigger('map-initiated', []);
            }
        }
    );
    // append stylesheet dynamically
    jQuery('head').append(that.styles);
};

RecorridosToDestinoMap.prototype = new BasicMap();

function RecorridosToDestinoMap(div, destino, extended_width){
    BasicMap.apply(this, arguments);
    this.ac = null;
    this.bounds = null;
    this.origen = null;
    this.destino = null;
    this.marker_origen = null;
    this.marker_destino = null;
    this.recorridos = [];
    this.detalles = [];
    this.extended_width = extended_width;
    this.extended_height_inc = null;
    this.div = div;
    this.points = null;
    this.initiating = false;
    this.geocodeDestinos(destino);
}

RecorridosToDestinoMap.prototype.geocodeDestinos = function(destino){
    var that = this;
    that.points = new PointCollection();
    jQuery("body").bind(
        'all-geocoded',
        function(e){
            if(!that.initiating) {
                that.initiating = true;
                // Una vez que están geocodificados todos los puntos, inicializar el mapa
                that.init(that.div);
                jQuery("body").bind(
                    'map-initiated',
                    function(ev){
                        that.pinDestino(0);
                        that.map.api.numZoomLevels = 2;
                        that.zoomToMarkers();
                        that.initActions();
                        that.initAutoComplete();
                    //that.initFocusButtons();
                    }
                );
            }
        }
    );
    for(var i = 0; i < destino.length; i++){
        that.points.addPoint(destino[i])
    }
    that.points.geocode();
};

RecorridosToDestinoMap.prototype.init = function(div){
    BasicMap.prototype.init.call(this, div);
    var that = this;
    // Add widget class to holder
    jQuery('#' + that.id).addClass('pap_widget');
    jQuery('#' + that.id).addClass('no_results');
    // create style to append .left width based on the width of the div that contains the widget and the desired expanded width
    var left_extended_width = that.extended_width - that.std_width;
    var left_extended_width_no_results = that.extended_width - 10;
    var t = "\
        #%id.expanded{ min-height:500px; }\
        #%id.expanded .left{ width: %left_extended_widthpx; }\
        #%id .right, #%id.expanded .right{ width: %std_widthpx; }\
        #%id.expanded .wrapper{ position: absolute; top: 0px; left: -%left_extended_widthpx; width: %extended_widthpx; }\
        #%id.expanded.no_results .left{ width: %extended_width_no_resultspx; }\
        #%id.expanded.no_results .right{ display:none; }\
    ";
    t = t.replace(/%id/g, that.id);
    t = t.replace(/%left_extended_width/g, left_extended_width);
    t = t.replace(/%std_width/g, that.std_width);
    t = t.replace(/%extended_width_no_results/g, left_extended_width_no_results);
    t = t.replace(/%extended_width/g, that.extended_width);
    jQuery('#' + that.id + ' #' + that.id + '-styles').text(t);
    // add expanded class to holder div on focus
};

RecorridosToDestinoMap.prototype.reposition_dialog = function(){
    var dialog = jQuery('#usig_acv_search-value');
    var ac = jQuery('#widget_punto_a_punto #search-value');
    var x = ac.offset();
    dialog.css({left: x.left + "px"});    
}

RecorridosToDestinoMap.prototype.initActions = function(){
    var that=this;
    jQuery("#"+that.id+' .actions').append("\
        <div class='search close'>\
            <a href='#'>contraer</a>\
        </div>\
    ");
    jQuery("#"+that.id+' .actions').append("\
        <div class='search open'>\
            <a href='#'>expandir</a>\
        </div>\
    ");
    jQuery("#"+that.id+' .actions').append("\
        <div class='clear'></div>\
    ");
    jQuery('.open.search').click(function(e){
        if(!jQuery('#' + that.id).hasClass('expanded')){
            if(that.extended_height_inc == null){
                var widget_height = jQuery('#' + that.id + ' .wrapper').outerHeight();
                that.extended_height_inc = jQuery('#' + that.id).height();
                jQuery('#' + that.id).addClass('expanded');
                that.extended_height_inc -= jQuery('#' + that.id + ' .wrapper').outerHeight();
                var map_height = jQuery('#' + that.id + " .mapwrapper .map").height();
                map_height += that.extended_height_inc;
                var t = "\
                    #" + that.id + ".expanded{ min-height: " + widget_height + "px}\
                    #" + that.id + ".expanded .map{ height: " + map_height + "px; }\
                    #" + that.id + " .recorridos{ height: " + map_height + "px; }\
                ";
                jQuery('#' + that.id + ' #' + that.id + '-styles').append(t);
               }
            else {
                jQuery('#' + that.id).addClass('expanded');
            }
            that.reposition_dialog();
            that.zoomToMarkers();
        }
        e.preventDefault();
        e.stopPropagation();
        jQuery("#" + that.id).addClass('expanded');
        that.reposition_dialog();
    });
    jQuery('.close.search').click(function(e){
        e.preventDefault();
        e.stopPropagation();
        jQuery("#" + that.id).removeClass('expanded');
        that.reposition_dialog();
    });
};

RecorridosToDestinoMap.prototype.initAutoComplete = function(){
    var that = this;
    var options = '';
    
    for(var i = 0; i < that.points.points.length; i++) {
        options = options + '<option>' + that.points.points[i].id + '</option>';
    }
    

    jQuery("#" + that.id + ' .left').prepend("\
        <div class='origen search autocomplete'> \
            <form accept-charset='iso-8859-1'> \
                <label for='search-value'>Origen</label> \
                <input type='text' size='40' name='search-value' id='search-value' title='Lugar a buscar' class='text'/> \
                <span id='ejemplo'>ej.: Callao y Corrientes, Florida 550, etc.</span> \
            </form> \
        </div> \
        <div class='destino search'> \
            <form accept-charset='iso-8859-1'> \
                <label for='search-value-dest'>Destino</label> \
                <select name='search-value-dest' id='search-value-dest' title='Destino' class='text'>" + options.toUpperCase() + " \
                </select> \
            </form> \
        </div> \
        <div class='clear'></div> \
    ");
    
    jQuery('.destino.search #search-value-dest').change(function(){
        var select = jQuery(this).children('option');
        jQuery(this).children('option:selected').each(function(){
            that.pinDestino(select.index(this));
            that.zoomToMarkers();
        });
        if(that.origen != null){
            that.resetRecorridos();
            that.buscarRecorridos();
        }
    });
    jQuery('.search form').submit(function(){
        return false;
    });
    that.ac = new usig.AutoCompleter('search-value', {
               skin: 'usig2',
               onReady: function() {
                   jQuery('#search-value').val('').removeAttr('disabled').focus();                        
               },
               afterSelection: function(option) {
                   if (option instanceof usig.Direccion) {
                       that.origen = option;
                   }
               },
               afterGeoCoding: function(pt){
            if(pt instanceof usig.Punto && that.origen instanceof usig.Direccion){
                that.resetRecorridos();
                that.origen.setCoordenadas(pt);
                that.pinOrigen();
                that.zoomToMarkers();
                jQuery('.focus').each(function(i){
                    jQuery(this).removeClass('hidden');
                });
                that.buscarRecorridos();
            }
        }
    });
    jQuery('#' + that.id + ' .right').append("\
        <h3>Se hallaron las siguientes opciones</h3>\
        <ul id='recorridos' class='recorridos'></ul>\
    ");
};

RecorridosToDestinoMap.prototype.initFocusButtons = function(){
    var that = this;
    var button = "\
        <div class='focus %target'>\
            <a href='#'>%legend</a>\
        </div>\
    ";
    var wrapper = "\
        <div class='focusbuttons'>\
            %origin\
            %destination\
            %both\
        </div>\
    ";
    jQuery('#'+that.id+' .left').append(
        wrapper.replace('%origin',button.replace('%target','origin hidden').replace('%legend','Zoom origen')).replace('%destination',button.replace('%target','destination').replace('%legend','Zoom destino')).replace('%both',button.replace('%target','both hidden').replace('%legend','Zoom ambos')));
    jQuery('.focus.origin').click(function(e){w
        that.zoomToOrigin();
    });
    jQuery('.focus.destination').click(function(e){
        that.zoomToDestination();
    });
    jQuery('.focus.both').click(function(e){
        that.zoomToMarkers();
    });
};

RecorridosToDestinoMap.prototype.pinDestino = function(index){
    var l = this.points.points.length
    if(l > 0 && index < l){
        if(this.marker_destino != null){
            this.map.removeMarker(this.marker_destino);
        }
        this.marker_destino = this.map.addMarker(
            this.points.points[index].pt,
            false,
            function(e){
                // Si quieren algun tipo de comportamiento ante el click del marker, este es el lugar
                e.preventDefault();
            }
        );
        this.destino = this.points.points[index].pt;
    }
};

RecorridosToDestinoMap.prototype.pinOrigen = function(){
    if(this.origen != null){
        if(this.marker_origen != null){
            this.map.removeMarker(this.marker_origen);
        }
        this.marker_origen = this.map.addMarker(
            this.origen,
            false,
            function(e){
                // Si quieren algun tipo de comportamiento ante el click del marker, este es el lugar
                e.preventDefault();
            }
        );
    }
};

RecorridosToDestinoMap.prototype.zoomToOrigin = function(){
    if(this.markers.length==2){
        this.map.goTo(this.origen,true);
    }
};

RecorridosToDestinoMap.prototype.zoomToDestination = function(){
    if(this.markers.length>=1){
        this.map.goTo(this.destino,true);
    }
};

RecorridosToDestinoMap.prototype.zoomToMarkers = function(){
    var left = right = top = bottom = 0;    
    this.bounds = new OpenLayers.Bounds();
    if(this.origen) {
        this.bounds.extend(new OpenLayers.Geometry.Point(this.origen.x, this.origen.y));
    }
    if(this.destino){
        this.bounds.extend(new OpenLayers.Geometry.Point(this.destino.x, this.destino.y));
    }
    this.map.api.zoomToExtent(this.bounds, true);
    // if(this.map.api.zoom > 6){
    //     this.map.api.zoomTo(6);
    // }
};

RecorridosToDestinoMap.prototype.buscarRecorridos = function(){
    var that = this;
    usig.Recorridos.buscarRecorridos(
        that.origen, 
        that.destino,
        function(recorridos){
            var html = '';
            var styles = '';
            var template = "\
            <li class='recorrido'> \
                <div class='label'>%label</div> \
                <div class='references'> \
                    <div class='time'>%time</div> \
                    <div class='color'></div> \
                </div> \
                <ol class='detalle'></ol> \
            </li> \
            ";
            that.recorridos = recorridos;
            console.log(that.recorridos);
            if(that.recorridos.length > 0){    
                jQuery('#' + that.id).removeClass('no_results');
                jQuery('#' + that.id + ' .open.search').click();
                
                var style = '#' + that.id + ' .right .recorridos .recorrido.active:nth-child(%index) .references .color{background-color:%color;}';
                for (var i = 0, n = that.recorridos.length; i < n; i++) {
                    var recorrido = that.recorridos[i];
                    styles += style.replace('%index', i+1).replace('%color', recorrido.getColor());
                    html += template.replace(
                        '%label',
                        recorrido.toHtmlString()
                    ).replace(
                        '%time',
                        recorrido.getTime() + '\''
                    );
                }
                html += "\
                    <div class='aclaraciones'> \
                        <span class=''></span> \
                    </div> \
                    <style>%styles</style> \
                ";
                html = html.replace('%styles',styles);
                jQuery('#' + that.id + ' .right #recorridos').html(html);
                jQuery('#' + that.id).find('#recorridos .recorrido').each(function(i){
                    jQuery(this).click(function(e){
                        if(jQuery(this).hasClass('active')) {
                            jQuery(this).removeClass('active');
                            that.borrarRecorrido(i);
                        }
                        else {
                            jQuery(this).addClass('active');
                            that.mostrarRecorrido(i);
                        }
                        e.preventDefault();
                    });
                });
            }
        },
        function(){
            console.log('Error');
        }
    );
};

RecorridosToDestinoMap.prototype.borrarRecorrido = function(i){
    var that=this;
    jQuery('#'+that.id).find('#recorridos .recorrido .detalle').each(
        function(j){
            if(i==j){
                jQuery(this).html('');
            }
        }
    );
    that.map.borrarRecorrido(that.recorridos[i]);
        
};

RecorridosToDestinoMap.prototype.resetRecorridos = function(){
    var that=this;
    jQuery('#'+that.id).addClass('no_results');
    if(that.recorridos.length>0) {
        if(that.origen!=null){
           jQuery('#'+that.id+' .right #recorridos').html('');
        }
        while(that.recorridos.length>0){
            try{
                that.map.borrarRecorrido(that.recorridos.pop());
            }catch(err){
                console.log(err);
            }
        }
    }
};

RecorridosToDestinoMap.prototype.mostrarRecorrido = function(i){
    var that=this;
    if(!that.detalles[i]){
        that.recorridos[i].getDetalle(
            function(detalle) {
                var r_detalle='';
                for(var k=0,l=detalle.length;k<l;k++){
                    r_detalle+='<li>'+detalle[k].text+'</li>';
                }
                that.detalles[i]=r_detalle;
                that.renderDetalle(i);
                that.map.mostrarRecorrido(that.recorridos[i]);
            },
            function(){
                console.log('Se produjo un error al intentar cargar los detalles del recorrido.');
            }
        );
    }else{
        that.renderDetalle(i);
        that.map.mostrarRecorrido(that.recorridos[i]);
    }
};

RecorridosToDestinoMap.prototype.renderDetalle = function(i){
    var that=this;
    jQuery('#'+that.id).find('#recorridos .recorrido .detalle').each(
        function(j){
            var html='';
            if(i==j){
                jQuery(this).html(that.detalles[i]);
            }
        }
    );
};
