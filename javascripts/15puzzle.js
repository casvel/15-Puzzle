Array.prototype.swap = function (i, j)
{
	var tmp = this[i];
	this[i] = this[j];
	this[j] = tmp;
}

jQuery.fn.scrollTo = function(elem, speed) { 
    $(this).animate({
        scrollLeft: $(this).scrollLeft() + $(elem).offset().left + $(elem).width()/2 - $(window).width()/2
    }, speed == undefined ? 500 : speed); 
    return this; 
};

var num = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];
var pos = [15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
var degrees = 0;
var imageSource = "";
var lastImage;

// var num = [7, 12, 8, 2, 11, 1, 6, 3, 10, 5, 4, 0, 9, 13, 14, 15];
// var pos = [11, 5, 3, 7, 10, 9, 6, 0, 2, 12, 8, 4, 1, 13, 14, 15];

var totalWidth = 0, totalHeight = 0;
var allImages;
var imagePosition = 0;

$(document).ready(function(){

	// Init();

	$.ajax({
		url: "/images",
		type: "GET"
	}).done(function(resp){
		console.log(resp);
		allImages = JSON.parse(resp);
		for (var i = 0; i < allImages.length; ++i) {
			var slide = $(document.createElement('div'));
			slide.addClass("slide");
			var img = new Image();
			img.src = allImages[i];
			img.width = 70;
			img.height = 70;
			slide.append(img);
			slide.attr("id", "slide-"+i);
			slide.click(function() {
				imagePosition = parseInt(this.id.split("-")[1], 10);
				var image = $(this).children('img')[0];
				imageSource = image.src;
				lastImage.width = 70;
				lastImage.height = 70;
				image.width = 90;
				image.height = 90;
				lastImage = image;
				$("#carousel").scrollTo(this);
				Init();
			})
			$("#carousel").append(slide);

			if (i == 0) {
				lastImage = img;
				img.width = 90;
				img.height = 90;
				imageSource = img.src;
				Init();
			}
		}
	});

	// eventos

	$('#grid').delegate('.square', 'click', function(e){
		var tile = this.id;
		var idx  = pos[tile];
		var dX   = [0, 1, 0, -1], dY = [1, 0, -1, 0];
		var dir = [{left: '+=25%'}, {top: '+=25%'}, {left: '-=25%'}, {top: '-=25%'}];

		var i = Math.floor(idx / 4);
		var j = idx % 4;

		for (var k = 0; k < 4; k++)
		{
			var ni = i + dX[k], nj = j + dY[k];

			if (ni < 0 || ni > 3 || nj < 0 || nj > 3 || num[ni*4 + nj] != 0)
				continue; 

			num.swap(pos[tile], pos[0]);
			pos.swap(tile, 0);	
			console.log("num:", num);
			console.log("pos", pos);
			$('#' + tile).animate(dir[k]);
		}
	});

	$('#solve').click(function()
	{
		$.ajax({
			url: "/solve",
			type: "POST",
			dataType: "json",
			data: {grid: num}
		}).done(function(resp){
			console.log(resp);
			autoSolve(resp);
		});
	});

	$('#shuffle').click(function()
	{
		shuffleEasy();
		Init();
	});

	$('#rotate').click(function() {
		degrees = (degrees + 90) % 360;
		Init();
	});

	$('#prev,#next').click(function() {
		lastImage.width = 70;
		lastImage.height = 70;

		if (this.id == "next") {
			imagePosition = (imagePosition + 1) % allImages.length;
		} else {
			imagePosition = imagePosition == 0 ? allImages.length - 1 : imagePosition - 1;
		}

		image = $("#slide-"+imagePosition).children('img')[0];
		image.width = 90;
		image.height = 90;
		lastImage = image;

		$("#carousel").scrollTo(image);

		imageSource = allImages[imagePosition];
		Init();
	});

	// funciones

	function autoSolve(sAns)
	{
		var dir  = [{left: '-=25%'}, {top: '-=25%'}, {left: '+=25%'}, {top: '+=25%'}];
		var delt = [1, 4, -1, -4];
		var seq  = [];

		for (var i = 0; i < sAns.length; i++)
		{
			var idxTile = pos[0]+delt[sAns[i]];
			var k = sAns[i];
			var tile = num[idxTile];

			num.swap(pos[tile], pos[0]);
			pos.swap(tile, 0);

			seq.push(['#' + tile, dir[k]]);

		}

		(function move(i){
			$(seq[i][0]).animate(seq[i][1], 200, function(){
				i+1 < seq.length && move(i+1); 
			})
		})(0);
	}

	function Init()
	{
		console.log("num:", num);
		console.log("pos:", pos);

		totalWidth = 0;
		totalHeight = 0;
		$('#grid').empty();
		var img = new Image();
		img.onload = function() {
			EXIF.getData(img, function() {
		        var make = EXIF.getTag(this, "Make");
		        var model = EXIF.getTag(this, "Model");
		        var orientation = EXIF.getTag(this, "Orientation")
		        console.log(make, model, orientation);

		        if (orientation == 1) {
		        	degrees = 0
		        } else if (orientation == 6) {
		        	degrees = 90;
		        } else if (orientation == 3) {
		        	degrees = 180;
		        } else if (orientation == 8) {
		        	degrees = 270;
		        }

		        for (var i = 0; i < 16; ++i) {
					var positionInImage = (num[i] == 0 ? 15 : num[i]-1);
					var imageColumn = positionInImage % 4;
					var imageRow = Math.floor(positionInImage/4);
					var puzzleColumn = true ? pos[num[i]] % 4 :  Math.floor(i/4);
					var puzzleRow = true ? Math.floor(pos[num[i]]/4) : i % 4;
					draw(img, degrees, imageRow, imageColumn, puzzleRow, puzzleColumn, 4, 4, "grid");
				}
				$("#grid").width(totalWidth);
				$("#grid").height(totalHeight);

				$("#preview").attr("src", imageSource);
				$("#preview").width(degrees == 0 || degrees == 180 ? totalWidth/3 : totalHeight/3);
				$("#preview").height(degrees == 0 || degrees == 180 ? totalHeight/3 : totalWidth/3);
				$("#preview").css("transform", "rotate("+degrees+"deg)");
		    });
		}

		img.src = imageSource
	}

	function isPossible(aConfig)
	{
		var N = 0, e = 0;
		for(var i = 0; i < 16; i++)
		{
			if (aConfig[i] == 0)
			{
				e = Math.floor(i / 4) + 1;
				continue;
			}

			var ni = 0;
			for(var j = i+1; j < 16; j++)
			{
				if (aConfig[j] == 0)
					continue;
				
				ni += (aConfig[i] > aConfig[j]);
			}

			N += ni;
		}

		return ((N + e) % 2) == 0;
	}


	function imprime(aConfig)
	{
		for(var i = 0; i < 4; i++)
		{
			var a = [];
			for(var j = 0; j < 4; j++)
				a.push(aConfig[i*4 + j]);
			console.log(a);
		}
	}

	function shuffleEasy() {
		var dX = [0, 1, 0, -1];
		var dY = [1, 0, -1, 0];
		var N = 70;
		while (N-- > 0) {
			var newZeroPos;
			while (true) {
				var k = Math.floor(Math.random()*4);
				var newZeroRow = Math.floor(pos[0]/4) + dX[k];
				var newZeroCol = (pos[0]%4) + dY[k];
				if (newZeroRow >= 0 && newZeroRow < 4 && newZeroCol >= 0 && newZeroCol < 4) {
					newZeroPos = newZeroRow*4 + newZeroCol;
					break;
				}
			}

			var tile = num[newZeroPos];
			num.swap(pos[tile], pos[0]);
			pos.swap(tile, 0);
		}
	}

	function rotateCoord(r, c, degrees, totalRows, totalColumns) {
		if (degrees == 0) {
			return {row: r, column: c};
		} if (degrees == 90) {
			return {row: totalColumns-1-c, column: r};
		} else if (degrees == 180) {
			return {row: totalRows-1-r, column: totalColumns-1-c};
		} else {
			return {row: c, column: totalRows-1-r};
		}
	}

	function draw(image, degrees, imageRow, imageColumn, puzzleRow, puzzleColumn, totalRows, totalColumns) {
		var shouldSwapWidthAndHeight = degrees == 90 || degrees == 270;

	    var maxTotalWidth = 648;
		var canvasWidth = image.width > maxTotalWidth ? maxTotalWidth : image.width;
		var aspectRatio = canvasWidth / image.width;
		var canvasHeight = image.height * aspectRatio;
		canvasWidth /= totalColumns;
		canvasHeight /= totalRows;

		totalWidth += (shouldSwapWidthAndHeight ? canvasHeight : canvasWidth) / totalColumns;
	    totalHeight += (shouldSwapWidthAndHeight ? canvasWidth : canvasHeight) / totalRows;

	    var tileId = true ? imageRow * totalColumns + imageColumn : imageColumn * totalRows + imageRow;
	    if (tileId == 15) {
	    	return;
	    }

		var canvasJQuery = $(document.createElement("canvas"));
		canvasJQuery.addClass("square");
	    canvasJQuery.attr("id", tileId+1);

	    // Don't know why you can't set javascript width/height with float values.
	    canvasJQuery.width(shouldSwapWidthAndHeight ? canvasHeight : canvasWidth);
	    canvasJQuery.height(shouldSwapWidthAndHeight ? canvasWidth : canvasHeight);

	    var canvas = canvasJQuery[0];
	    canvas.width = shouldSwapWidthAndHeight ? canvasHeight : canvasWidth;
	   	canvas.height = shouldSwapWidthAndHeight ? canvasWidth : canvasHeight;
	   	canvas.style.left = puzzleColumn*25 + "%";
	    canvas.style.top = puzzleRow*25 + "%";
	    canvas.style.position = "absolute";

		var ctx = canvas.getContext("2d");
	    ctx.clearRect(0, 0, canvas.width, canvas.height);
	    ctx.translate(canvas.width/2, canvas.height/2);
	    ctx.rotate(degrees*Math.PI/180);

	    var sourceWidth = image.width / totalColumns;
	    var sourceHeight = image.height / totalRows;
	    var coordRotated = rotateCoord(imageRow, imageColumn, degrees, totalRows, totalColumns);
	    var sourceX = sourceWidth * coordRotated.column;
	    var sourceY = sourceHeight * coordRotated.row;
	    var destX = shouldSwapWidthAndHeight ? -canvas.height/2 : -canvas.width/2;
	    var destY = shouldSwapWidthAndHeight ? -canvas.width/2 : -canvas.height/2;
	    var destWidth = shouldSwapWidthAndHeight ? canvas.height : canvas.width;
	    var destHeight = shouldSwapWidthAndHeight ? canvas.width : canvas.height;

		// drawImage(imageObj, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
		ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
		document.getElementById("grid").appendChild(canvas);
	}
});