// First part we load the file into the following array as just a big ol' bunch of HEX then call checkROM
var rawHex = []
var filename = '';
$('#file').on('change',function(e){
	rawHex = [];
	sprites = []; // CLear it out so we can easily re-change ROMs
	startAt = -1; // Needs to be reset, since the PRG length enevitable changes
	$('#output-container').html('<h3>Loading ROM...</h3>');
	var fileRead = new FileReader();
	filename = e.target.files[0].name;
	fileRead.onload = function(file){
		var buffer = new Uint8Array(fileRead.result);
		buffer.forEach(function(dec){
			rawHex.push(dec.toString(16).padStart(2,'0'));
		});
		checkROM();
	}
	fileRead.readAsArrayBuffer(e.target.files[0]);
});

// This function will check the headers to grab some data from it (PRG length, trainer Y/N that sorta thing) Once done it calls drawData
var romDetails = {}
function checkROM(){
	$('#output-container').html('<h3>Checking ROM headers...</h3>');
	// First we can check the headers, NES roms always start the same way.
	if(rawHex[0]+rawHex[1]+rawHex[2]+rawHex[3]=='4e45531a'){ // "NES" and a DOS line break
		romDetails.valid = true;
	}else{
		romDetails.valid = false;
	}
	// New we check if the rom has a trainer, this is stored in byte 6 in a binary format
	var flags = parseInt(rawHex[6],16).toString('2').padStart('8','0');
	if(flags.substr(5,1)=='1'){
		romDetails.trainer = true;
	}else{
		romDetails.trainer = false;
	}
	// Get the PRG and CHR lengths, these are prepersented in the header as the number of 16384 or 8192 bytes respectivly.
	romDetails['PRGlength'] = parseInt(rawHex[4],16)*16384;
	romDetails['CHRlength'] = parseInt(rawHex[6],16)*8192;
	// And we might want a simple to reference total size
	romDetails['romLength']  = rawHex.length;
	// Finally output any error messages or, if there are none, call the draw function
	if(romDetails.valid){
		draw();
	}else{
		$('#output-container').html('<h3>The uploaded file does not appear to be an NES rom.</h3>');
	}
}

// This does the acutal drawing, this is what will be re-called every time a color or settings is changed.
var colors = ['#FFFFFF','#555555','#AAAAAA','#000000'];
// These settings are not user editable like the above colors one, this is because canvase limitations dictate limitations, perhaps some fancy dynamic adjustments can be allowed in the future.
var pixelSize = 4;
var spriteCols = 16; // The number of sprites per chunk, 16 seems to work well for most games
var sheetCols = 1; // The number of chunk cols, this adjusted to prevent oversizing the canvas
var chunkSize = 512; // The size per chunk, most time two are places side-by-side
var canvasSize = [0,0]; // Width, Height
var startAt = -1;
var sprites = [];
function draw(){
	var htmlMessage = ''; // This is used if there is a message to place above the ROM, like for ROMs missing CHR data

	// Make sure we got some rawHex to work with
	if(rawHex.length==0){
		return false;
		// Do nothing, they are changing color or something without a rom file
	}

	// Calculate the starting position
	if(startAt < 0){
		startAt = 16; // Thats the header space
		if(romDetails.trainer){
			startAt += 512; // If there is a trainer block it is 512bytes
		}
		startAt += romDetails['PRGlength'];
	}
	// In some cases there is no CHR data, get a message ready and output the PRG instead (best we can do)
	if(startAt==romDetails['romLength']){
		startAt -= romDetails['PRGlength'];
		htmlMessage = '<p>This rom down not have an CHR data, loading all PRG data. The sprite data is <i>probably</i> in there, along with a bunch of code.</p>';
	}

	// How many chunks of data do we have, thats also how many wide and tall
	var chrSize = Math.ceil((rawHex.length-startAt)/8192);
	if(chrSize <= 3){ // Short enough to be a single column
		sheetCols = 1;
	}else if(chrSize == 5){ // Still short enough
		sheetCols = 1;
	}else{ // Better compacted into 2 columns
		sheetCols = 2;
	}

	// Now we need to grab the sprite data, combinine it in the NES way
	if(sprites.length==0){
		sprites = []
		for(var i = startAt; i <= romDetails.romLength; i+=16){
			var spriteCache = [[],[],[],[],[],[],[],[]];
			if(rawHex[i]!=undefined){
				// Store the data into the spriteCache, loading the value 8 bits high and combining them togethe the NES way
				for(var b = 0; b<8; b++){
					var byte1 = parseInt(rawHex[i+b],16).toString(2).padStart(8,0).split('');
					var byte2 = parseInt(rawHex[i+b+8],16).toString(2).padStart(8,0).split('');
					byte1.forEach(function(bit,pos){
						spriteCache[b].push( parseInt(byte1[pos]) + parseInt((byte2[pos]*2)) );
					});
				}
				sprites.push(spriteCache);
			}
		}
	}

	// Calculate the canvas size and get it ready for drawing
	if($('canvas').length==0){
		canvasSize[0] = spriteCols*8*pixelSize*sheetCols;
		canvasSize[1] = ((sprites.length/spriteCols)/sheetCols)*8*pixelSize;
		if(canvasSize[1]==0){
			$('#output-container').html('Something has gone wrong and ther sprite sheet can not be loaded, let me know so I can sort it out.'); 
			return false;
		}else{
			$('#output-container').html(htmlMessage+'<canvas width="'+canvasSize[0]+'" height="'+canvasSize[1]+'" id="canvas"/><br/><a href="#" class="download" download>Download Spite Sheet</a>'); 
		}
	}
	var canvasEl = document.getElementById('canvas');
	var canvas = canvasEl.getContext('2d');

	// Loop through the sprirtes and draw those little boxes, start with a bunch of vars were gonna need.
	var chunkOffsetX = 0;
	var chunkOffsetY = 0;
	var spriteOffsetX = 0;
	var spriteOffsetY = 0;
	var pixelOffsetX = 0;
	var pixelOffsetY = 0;
	// Now some moth for chunk columns and such
	sprites.forEach(function(sprite,sn){
		pixelOffsetX = 0;
		pixelOffsetY = 0;
		if(sn!=0 && sheetCols>1){
			if(sn%chunkSize==0){
				if(chunkOffsetX==0){
					chunkOffsetX += 8*spriteCols*pixelSize;
				}else{
					chunkOffsetX = 0;
					chunkOffsetY += 8*spriteCols*pixelSize+chunkSize;
				}
				spriteOffsetX = 0;
				spriteOffsetY = 0;
			}
		}
		// now the actual drawing, with a little more math for sprites and pixels
		sprite.forEach(function(row,rn){
			row.forEach(function(pixel,pn){
				canvas.fillStyle = colors[pixel];
				canvas.fillRect(chunkOffsetX+spriteOffsetX+pixelOffsetX , chunkOffsetY+spriteOffsetY+pixelOffsetY , pixelSize,pixelSize);
				pixelOffsetX += pixelSize;
			});
			pixelOffsetX  = 0;
			pixelOffsetY += pixelSize;
		});
		pixelOffsetX  = 0;
		pixelOffsetY  = 0;
		if(spriteOffsetX<pixelSize*8*(spriteCols-1)){
			spriteOffsetX += 8*pixelSize
		}else{
			spriteOffsetX  = 0;
			spriteOffsetY += 8*pixelSize
		}
	});

	// Prep that download link
	var downloadName = filename.split('.').slice(0,filename.split('.').length-1).join('.')+' sprite sheet.png';
	$('a.download').attr('href',canvasEl.toDataURL()).attr('download',downloadName);
}

// This little bit of code simple update the drawOptions and re-does the draw command when you change something
$('fieldset input[type="color"]').on('change',function(){
	var colorNum = parseInt($(this).attr('name').substr(7,1));
	colors[colorNum] = $(this).val();
	localStorage['color-'+colorNum] = $(this).val();
	draw();
});

// Load the saved colors over the defaults, then update the inputs with those values
$(document).ready(function(){
	for(var c=0;c<=3;c++){
		if(localStorage['color-'+c]!=undefined){
			colors[c] = localStorage['color-'+c];
		}
	}
	colors.forEach(function(color,n){
		$('[name="colors['+n+']"]').val(color);
	});
});

// The reset option simply sets the colors back to what they were and clears the localStorage
$('fieldset button').on('click',function(){
	localStorage.clear();
	colors = ['#FFFFFF','#555555','#AAAAAA','#000000'];
	colors.forEach(function(color,n){
		$('[name="colors['+n+']"]').val(color);
	});
	draw();
});
