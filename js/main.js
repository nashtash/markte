 
 function main(map, filter){ 
	//choose data file and set explanation heading
	var type = getQueryParams(document.location.search).type;
	var file;
	if (type === 'christmas'){
		var file = 'data/christmas_2019.json';
		$('#explanation h1').append('Weihnachtsmärkte im Rheinland');
		$('nav h2').append('Weihnachtsmärkte 2019');
	} else if(type === 'christmas-complete'){
		var file = 'data/christmas_2019.json';
		$('#explanation h1').append('Weihnachtsmärkte im Rheinland');
		$('nav h2').append('Weihnachtsmärkte 2019');
	} else{
		var file = 'data/christmas_2019.json';
		$('#explanation h1').append('Weihnachtsmärkte in Köln<br> und im Rheinland');
		$('nav h2').append('Kölner Weihnachtsmärkte');
	}
	
	map.doubleClickZoom.disable();
	
	$.getJSON(file, function(data) {
			
			//branding
			var brandingWhitelist = ['ksta', 'express', 'kr'];
			var branding = getQueryParams(document.location.search).branding;
			if (jQuery.inArray(branding,brandingWhitelist) === -1) branding = 'ksta';

			
			//add branding class to body
			if (branding === 'ksta'){
				$('body').addClass('ksta');
			} else if (branding === 'express'){
				$('body').addClass('express');
			} else if (branding === 'kr'){
				$('body').addClass('kr');
			}
			
			var basis = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
				attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
				maxZoom: 18,
				id: 'mapbox.streets',
				accessToken: 'pk.eyJ1IjoiZHVtb250LWRhdGVuam91cm5hbGlzbXVzIiwiYSI6ImNrM2hlaDR0dDA1OGUzaG12azh6a3F6d3oifQ.xrC9nft_ScOnQ2afCl2piA'
			}).addTo(map);
		
			
			//navicon
			$(document).on('click', '#navicon', function(){
				$(this).hide();
				$('nav').show();
			});
			
			//close navigation
			$(document).on('click', 'nav #close', function(){
				$('nav').hide();
				$('#navicon').show();
				
			});
			
			
			//toggle active button
			$(document).on('click', 'button', function(){
				if ($(this).hasClass('type'))
					$('.type').not(this).removeClass('ui-button-active');
				
				$(this).toggleClass('ui-button-active');
			});
			
			
			//close popup
			$(document).on('click', '.popup .back', function(){
				closePopup();
			});
			
			
			//close explanation window
			$(document).on('click', '#explanation img', function(){
				$(this).parent().fadeOut();
			});
			
			
			
			//close notification popup onclick
			$(document).on('click', '#notification', function(){
				$(this).hide();
			});
			
			//opened filter call
			$(document).on('click', 'nav .opened', function(){
				if ('offen' in filter){
					delete filter['offen'];
				}
				else{
					filter['offen'] = true;
				}
				createDataLayer();
			});
			
			
			//type filter call
			$(document).on('click', 'nav .type', function(e){
				var value = $(this).attr('value');
				if ('typ' in filter && filter['typ'] == value){
					delete filter['typ'];
				}
				else{
					filter['typ'] = value;
				}
				createDataLayer();
			});
			
			
			//search for post code
			$('.plz').on('input', function() {
				this.value = this.value.replace(/\D/g,'');
				filter['plz'] = $(this).val();
				createDataLayer();
			});
			
		
			//create data layer
			var findings;
		
			//add district layer to map
			function createDataLayer(){
				
				//remove existing data layer
				if (map.hasLayer(findings)) map.removeLayer(findings);
		
				//define marker
				var icon = L.icon({
					iconUrl: 'img/wmarkt-icon.png',
					shadowUrl: 'img/marker-shadow.png',
					iconSize: [25, 40],
					iconAnchor: [10,40],
				});

				findings = L.geoJSON(data, {
									filter: filterData,
									onEachFeature: onEachFeature,
									pointToLayer: function (feature, latlng) { return L.marker(latlng, {icon: icon});}
								}).bindTooltip(function (layer) {
								if ($(window).width() > 420) 
									return layer.feature.properties.name;
							}).addTo(map);
			}
			
			
			
			
			//build popup on click on marker
			function onEachFeature(feature, layer){ 
				layer.on({
					click:buildPopup
				})
			}
			
			
			
			//create or show popup with district information
			function buildPopup(e){
				var info;
				if (typeof(e) === 'object'){
					info = this.feature;
				} else if (typeof(e) === 'object'){
					info = data.features[e];
				}
				
				//hide other popups
				$('.popup').hide();
				
				if (info !== undefined){
					var elementId = 'finding' + String(info.geometry.coordinates['0']).replace('.', '') + String(info.geometry.coordinates['1']).replace('.', '');
					
					//check if opened
					startObj = new Date(parseDate(info.properties.start));
					endeObj = new Date(parseDate(info.properties.ende));
					today = new Date();

					//hide explanation and notification layer
					$('#explanation').hide();
					$('#notification').hide();
					$('.leaflet-control-attribution').hide();
					$('#navicon').hide();
					$('nav').hide();
					
					if ($('#'+elementId).length){
						$('#'+elementId).fadeIn();
					}else{
						var popup = '';
						popup += '<div id="' + elementId + '" class="popup">';
						popup += '<h2>' + info.properties.name + '</h2>';
						
						//time range
						popup += '<h3>Wann?</h3>';
						if (!isNaN(parseInt(info.properties.start.charAt(0)))){
							popup += '<p>Vom ' + info.properties.start + ' bis zum ' + info.properties.ende + '</p>';
							if (today >= startObj && today <= endeObj){
								popup += '<span class="opened">Heute geöffnet</span>';
							}
							else if (today < startObj){
								popup += '<span class="closed">Noch nicht geöffnet</span>';
							}
							else if(today > endeObj){
								popup += '<span class="closed">Bereits geschlossen</span>';
							}
						} else{
							popup += info.properties.start;
						}
						
						popup += '<h3>Wo?</h3>';
						popup += '<p>' + info.properties.strasse; 
						if (info.properties.hausnummer != null && info.properties.hausnummer != '') popup += ' ' + info.properties.hausnummer;
						popup += ', ' + info.properties.plz + ' ' + info.properties.ort + '</p>';
						
						//opening time
						if (info.properties['oeffnungszeiten'] != '' && info.properties['oeffnungszeiten'] != 'null')
							popup += '<h3>Öffnungszeiten</h3><p>' + info.properties['oeffnungszeiten'];
						
						//pricing
						if (info.properties['Eintrittspreise'] != '' && info.properties['Eintrittspreise'] != 'null')
							popup += '<h3>Eintrittspreise</h3><p>' + info.properties['Eintrittspreise'];
						
						//buttons
						var website = '';
						if (info.properties.url != '' && info.properties.url != null && info.properties.url != 'null'){
							website = info.properties.url;
							/*var prefix = 'http://';
							if (website.substr(0, prefix.length) !== prefix) website = prefix + website;*/
						} else if (info.properties.url_ksta != '' && info.properties.url_ksta != null && info.properties.url_ksta != 'null'){
							
							website = info.properties.url_ksta;
						}
						
						popup += '<div>';
						if (website !== '')
							popup += '<a href="' + website + '" target="_blank" class="button">Mehr erfahren</a>';
						popup += '<a class="button back">Zurück zur Übersicht</a>';
						popup += '</div>';
						
						popup += '</div>';
						$('body').append(popup);
						
						
						
						
					}		
						//define new position and fly
						var position = [info.geometry.coordinates[1]+0.01, info.geometry.coordinates[0]];
						//map.flyTo(position, 14);
				}
			}
			

			
			function closePopup(){
				var intro = $('#intro');
				if(intro.is(':visible')){
					intro.fadeOut();
					$('#notification').fadeIn().delay(1500).fadeOut();
					$('#explanation').fadeIn();
					
				} else{
					var elem = $('.popup:visible');
					elem.fadeOut();
					$('#explanation').fadeIn();
					if ($(window).width() > 420) $('nav').fadeIn();
					if ($(window).width() <= 420) $('#navicon').fadeIn();
					
					//scroll to top
					window.scrollTo(0,0);
				}
				$('.leaflet-control-attribution').show();
			}

		
				
			$(function(){
				createDataLayer();

				//make it possible to enter something in post code input on mobile devices
				L.DomEvent.disableClickPropagation(document.getElementById('plz'));
			});
		
		return false;

	});
	
 }
 
 
 function getQueryParams(qs) {
    qs = qs.split("+").join(" ");
    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])]
            = decodeURIComponent(tokens[2]);
    }

    return params;
}

function parseDate(input) {
	var parts = input.match(/(\d+)/g);
	if (parts !== null)
		return new Date(parts[2], parts[1]-1, parts[0]);
	else{
		return input;
	}
}


function filterData(feature){
	var filtered = false;
	
	startObj = new Date(parseDate(feature.properties.start));
	endeObj = new Date(parseDate(feature.properties.ende));
	today = new Date();
	
	
	
	
	if ('plz' in filter && filter['plz'] !== ''){
		var length = filter['plz'].toString().length;
		var piece = '' + feature.properties.plz; 
		piece = piece.slice(0,length);
	}
	
	//opened and type and postcode
	if ('offen' in filter && 'plz' in filter && filter['plz'] !== '' && 'typ' in filter){
		if (feature.properties.typ === filter['typ'] && piece === filter['plz'] && today >= startObj && today <= endeObj) return true;
		filtered = true;
	}
	
	//type and postcode
	if ('offen' in filter === false && 'plz' in filter && filter['plz'] !== '' && 'typ' in filter){
		if (feature.properties.typ === filter['typ'] && piece === filter['plz']) return true;
		filtered = true;
	}
	
	//opened and postcode
	if ('offen' in filter && 'plz' in filter && filter['plz'] !== '' && 'typ' in filter === false){
		if (today >= startObj && today <= endeObj && piece === filter['plz']) return true;
		filtered = true;
	}
	
	//opened and type
	if ('offen' in filter && 'typ' in filter && 'plz' in filter === false){
		if (today >= startObj && today <= endeObj && feature.properties.typ === filter['typ']) return true;
		filtered = true;
	}
	
	//only opened
	if ('offen' in filter && 'typ' in filter === false && 'plz' in filter === false){
		if (today >= startObj && today <= endeObj) return true;
		filtered = true;
	}
	
	//only type
	if ('typ' in filter && 'offen' in filter === false && 'plz' in filter === false){
		if (feature.properties.typ === filter['typ']) return true;
		filtered = true;
	}
	
	//only postcode
	if ('plz' in filter && filter['plz'] !== '' && 'offen' in filter === false && 'typ' in filter === false){
		if (piece === filter['plz']) return true;
		filtered = true;
	}
	
	
	if (filtered === false) return true;
	
}
