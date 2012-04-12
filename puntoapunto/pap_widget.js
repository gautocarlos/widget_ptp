function BasicMap(){
	this.id=null;
	this.width;
	this.ready=false;
	this.map=null;
	this.std_weight=null;
	this.border_width=null;
	this.styles='<link rel="stylesheet" type="text/css" media="screen" href="fonts.css"/><link rel="stylesheet" type="text/css" media="screen" href="pap_widget.css"/>';
}
BasicMap.prototype.init=function(div){
	var cp=this;
	cp.id=div;
	cp.std_width=$('#'+cp.id).outerWidth(true);
	$('#'+cp.id).append("<div class='wrapper'><div class='left'></div><div class='right'></div><div class='clear'></div><div class='actions'></div><div class='clear'></div></div><style id='"+cp.id+"-styles'></style>");
	$('#'+cp.id+' .left').append("<div class='mapwrapper'><div id='"+cp.id+"-map' class='map'></div></div>");
	this.map=new usig.MapaInteractivo(cp.id+"-map",{
		includeToolbar:false,
		onReady: function(){
			cp.ready=true;
			jQuery("body").trigger('map-initiated',[]);
		}
	});
	// append stylesheet dynamically
	$('head').append(cp.styles);
};

RecorridosToDestinoMap.prototype=new BasicMap();

function RecorridosToDestinoMap(div,destino,extended_width){
	BasicMap.apply(this,arguments);
	this.ac=null;
	this.bounds=null;
	this.origen=null;
	this.destino=null;
	this.marker_origen=null;
	this.marker_destino=null;
	this.recorridos=[];
	this.detalles=[];
	this.extended_width=extended_width;
	this.extended_height_inc=null;
	this.div=div;
	this.points=null;
	this.geocodeDestinos(destino);
}
RecorridosToDestinoMap.prototype.geocodeDestinos=function(destino){
    var cp=this;
    cp.points=new PointCollection();
    jQuery("body").bind('all-geocoded',function(e){
        // Una vez que están geocodificados todos los puntos, inicializar el mapa
        cp.init(cp.div);
        jQuery("body").bind('map-initiated',function(ev){
            cp.pinDestino(0);
	    cp.map.api.numZoomLevels=2;
            cp.zoomToMarkers();
	    cp.initActions();
            cp.initAutoComplete();
            //cp.initFocusButtons();
        });
    });
    for(var i=0;i<destino.length;i++){
        cp.points.addPoint(destino[i])
    }
    cp.points.geocode();
};
RecorridosToDestinoMap.prototype.init=function(div){
	BasicMap.prototype.init.call(this,div);
	var cp=this;
	// Add widget class to holder
	$('#'+cp.id).addClass('pap_widget');
	$('#'+cp.id).addClass('no_results');
	// create style to append .left width based on the width of the div that contains the widget and the desired expanded width
	var left_extended_width=cp.extended_width-cp.std_width;
	var left_extended_width_no_results=cp.extended_width-10;
	var t="#%id.expanded{min-height:500px;} #%id.expanded .left{width:%left_extended_widthpx;} #%id .right, #%id.expanded .right{width:%std_widthpx;} #%id.expanded .wrapper{position:absolute; top:0px; left:-%left_extended_widthpx; width:%extended_widthpx;} #%id.expanded.no_results .left{width:%extended_width_no_resultspx;} #%id.expanded.no_results .right{display:none}";
	t=t.replace(/%id/g,cp.id).replace(/%left_extended_width/g,left_extended_width).replace(/%std_width/g,cp.std_width).replace(/%extended_width_no_results/g,left_extended_width_no_results).replace(/%extended_width/g,cp.extended_width);
	$('#'+cp.id+' #'+cp.id+'-styles').text(t);
	// add expanded class to holder div on focus
};
RecorridosToDestinoMap.prototype.reposition_dialog=function(){
	var dialog=$('#usig_acv_search-value');
	var ac=$('#widget_punto_a_punto #search-value');
	var x = ac.offset();
    dialog.css({left: x.left + "px"});    
}
RecorridosToDestinoMap.prototype.initActions=function(){
	var cp=this;
	$("#"+cp.id+' .actions').append("<div class='search close'>\
	    <a href='#'>contraer</a>\
	</div>");
	$("#"+cp.id+' .actions').append("<div class='search open'>\
	    <a href='#'>expandir</a>\
	</div>");
	$("#"+cp.id+' .actions').append("<div class='clear'></div>");
	$('.open.search').click(function(e){
		if(!$('#'+cp.id).hasClass('expanded')){
		    if(cp.extended_height_inc==null){
			var widget_height=$('#'+cp.id+' .wrapper').outerHeight();
			cp.extended_height_inc=$('#'+cp.id).height();
			$('#'+cp.id).addClass('expanded');
			cp.extended_height_inc-=$('#'+cp.id+' .wrapper').outerHeight();
			var map_height=$('#'+cp.id+" .mapwrapper .map").height();
			map_height+=cp.extended_height_inc;
			var t="#"+cp.id+".expanded{min-height:"+widget_height+"px} #"+cp.id+".expanded .map{height:"+map_height+"px;}"+"#"+cp.id+" .recorridos{height:"+map_height+"px;}";
			$('#'+cp.id+' #'+cp.id+'-styles').append(t);
		    }
		    else{
			$('#'+cp.id).addClass('expanded');
		    }
		    cp.reposition_dialog();
		    cp.zoomToMarkers();
		}
	    e.preventDefault();
	    e.stopPropagation();
	    $("#"+cp.id).addClass('expanded');
	    cp.reposition_dialog();
	});
	$('.close.search').click(function(e){
	    e.preventDefault();
	    e.stopPropagation();
	    $("#"+cp.id).removeClass('expanded');
	    cp.reposition_dialog();
	});
};
RecorridosToDestinoMap.prototype.initAutoComplete=function(){
	var cp=this;
	var options='';
	
	for(var i=0;i<cp.points.points.length;i++) {
		options = options+'<option>'+cp.points.points[i].id+'</option>';
	}
	

	$("#"+cp.id+' .left').prepend("\
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
			<select name='search-value-dest' id='search-value-dest' title='Destino' class='text'>"+options.toUpperCase()+" \
			</select> \
		</form> \
	</div> \
	<div class='clear'></div> \
	");
	
	$('.destino.search #search-value-dest').change(function(){
	    var select=$(this).children('option');
	    $(this).children('option:selected').each(function(){
	        cp.pinDestino(select.index(this));
	        cp.zoomToMarkers();
	    });
	    if(cp.origen!=null){
	        cp.resetRecorridos();
	        cp.buscarRecorridos();
	    }
	});
	$('.search form').submit(function(){
		return false;
	});
	cp.ac= new usig.AutoCompleter('search-value', {
       		skin: 'usig2',
       		onReady: function() {
       			$('#search-value').val('').removeAttr('disabled').focus();	        			
       		},
       		afterSelection: function(option) {
       			if (option instanceof usig.Direccion) {
       				cp.origen = option;
       			}
       		},
       		afterGeoCoding: function(pt){
			if(pt instanceof usig.Punto && cp.origen instanceof usig.Direccion){
			    cp.resetRecorridos();
				cp.origen.setCoordenadas(pt);
				cp.pinOrigen();
				cp.zoomToMarkers();
				$('.focus').each(function(i){
					$(this).removeClass('hidden');
				});
				cp.buscarRecorridos();
			}
		}
    });
	$('#'+cp.id+' .right').append("\
	<h3>Se hallaron las siguientes opciones</h3> \
	<ul id='recorridos' class='recorridos'> \
	\
	</ul> \
	");
};
RecorridosToDestinoMap.prototype.initFocusButtons=function(){
	var cp=this;
	var button="\
	<div class='focus %target'>\
		<a href='#'>%legend</a>\
	</div>";
	var wrapper="\
	<div class='focusbuttons'>\
		%origin \
		%destination \
		%both \
	</div>";
	$('#'+cp.id+' .left').append(wrapper.replace('%origin',button.replace('%target','origin hidden').replace('%legend','Zoom origen')).replace('%destination',button.replace('%target','destination').replace('%legend','Zoom destino')).replace('%both',button.replace('%target','both hidden').replace('%legend','Zoom ambos')));
	$('.focus.origin').click(function(e){w
		cp.zoomToOrigin();
	});
	$('.focus.destination').click(function(e){
		cp.zoomToDestination();
	});
	$('.focus.both').click(function(e){
		cp.zoomToMarkers();
	});
};
RecorridosToDestinoMap.prototype.pinDestino=function(index){
    var l=this.points.points.length
    if(l>0&&index<l){
        if(this.marker_destino!=null){
            this.map.removeMarker(this.marker_destino);
        }
        this.marker_destino=this.map.addMarker(
            this.points.points[index].pt,
            false,
            function(e){
                // Si quieren algun tipo de comportamiento ante el click del marker, este es el lugar
                e.preventDefault();
            }
        );
        this.destino=this.points.points[index].pt;
    }
};
RecorridosToDestinoMap.prototype.pinOrigen=function(){
    if(this.origen!=null){
        if(this.marker_origen!=null){
            this.map.removeMarker(this.marker_origen);
        }
        this.marker_origen=this.map.addMarker(
            this.origen,
            false,
            function(e){
                // Si quieren algun tipo de comportamiento ante el click del marker, este es el lugar
                e.preventDefault();
            }
        );
    }
};
RecorridosToDestinoMap.prototype.zoomToOrigin=function(){
	if(this.markers.length==2){
		this.map.goTo(this.origen,true);
	}
};
RecorridosToDestinoMap.prototype.zoomToDestination=function(){
	if(this.markers.length>=1){
		this.map.goTo(this.destino,true);
	}
};
RecorridosToDestinoMap.prototype.zoomToMarkers=function(){
	var left=right=top=bottom=0;
	var ms=this.map.getMarkers().markers;
	this.bounds = new OpenLayers.Bounds();
	for(i=0;i<ms.length;i++){
		this.bounds.extend(ms[i].lonlat);
	}
	this.map.api.zoomToExtent(this.bounds,true);
	if(this.map.api.zoom>6){
	    this.map.api.zoomTo(6);
	}
};
RecorridosToDestinoMap.prototype.buscarRecorridos=function(){
	var cp=this;
	usig.Recorridos.buscarRecorridos(
		cp.origen, 
		cp.destino,
		function(recorridos){
			var html='';
			var styles='';
			var template="\
			<li class='recorrido'> \
				<div class='label'>%label</div> \
				<div class='references'> \
					<div class='time'>%time</div> \
					<div class='color'></div> \
				</div> \
				<ol class='detalle'></ol> \
			</li> \
			";
			cp.recorridos=recorridos;
			if(cp.recorridos.length>0){	
			    $('#'+cp.id).removeClass('no_results');
			    $('#'+cp.id+' .open.search').click();
			    
    			var style='#'+cp.id+' .right .recorridos .recorrido.active:nth-child(%index) .references .color{background-color:%color;}';
    			for (var i=0,n=cp.recorridos.length; i<n; i++) {
    				var recorrido=cp.recorridos[i];
    				styles+=style.replace('%index',i+1).replace('%color',recorrido.getColor());
    				html+=template.replace('%label',recorrido.toHtmlString()).replace('%time',recorrido.getTime()+'\'');;
    			}
    			html+="\
    			<div class='aclaraciones'> \
    				<span class=''></span> \
    			</div> \
    			<style>%styles</style> \
    			";
    			html=html.replace('%styles',styles);
    			$('#'+cp.id+' .right #recorridos').html(html);
    			$('#'+cp.id).find('#recorridos .recorrido').each(function(i){
    					$(this).click(function(e){
    						if($(this).hasClass('active')){
    							$(this).removeClass('active');
    							cp.borrarRecorrido(i);
    						}else{
    							$(this).addClass('active');
    							cp.mostrarRecorrido(i);
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
RecorridosToDestinoMap.prototype.borrarRecorrido=function(i){
	var cp=this;
	$('#'+cp.id).find('#recorridos .recorrido .detalle').each(
		function(j){
			if(i==j){
				$(this).html('');
			}
		}
	);
	cp.map.borrarRecorrido(cp.recorridos[i]);
		
};
RecorridosToDestinoMap.prototype.resetRecorridos=function(){
    var cp=this;
    $('#'+cp.id).addClass('no_results');
	if(cp.recorridos.length>0) {
	    if(cp.origen!=null){
           $('#'+cp.id+' .right #recorridos').html('');
        }
	    while(cp.recorridos.length>0){
	        try{
	            cp.map.borrarRecorrido(cp.recorridos.pop());
	        }catch(err){
	            console.log(err);
	        }
	    }
	}
};
RecorridosToDestinoMap.prototype.mostrarRecorrido=function(i){
	var cp=this;
	if(!cp.detalles[i]){
    	cp.recorridos[i].getDetalle(
    		function(detalle) {
    		    var r_detalle='';
    		    for(var k=0,l=detalle.length;k<l;k++){
    		        r_detalle+='<li>'+detalle[k]+'</li>';
    		    }
    			cp.detalles[i]=r_detalle;
    			cp.renderDetalle(i);
    			cp.map.mostrarRecorrido(cp.recorridos[i]);
    		},
    		function(){
    		    console.log('Se produjo un error al intentar cargar los detalles del recorrido.');
    		}
    	);
	}else{
	    cp.renderDetalle(i);
	    cp.map.mostrarRecorrido(cp.recorridos[i]);
	}

};
RecorridosToDestinoMap.prototype.renderDetalle=function(i){
    var cp=this;
    $('#'+cp.id).find('#recorridos .recorrido .detalle').each(
		function(j){
			var html='';
			if(i==j){
				$(this).html(cp.detalles[i]);
			}
		}
	);
};