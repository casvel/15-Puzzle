Array.prototype.swap = function (i, j)
{
	var tmp = this[i];
	this[i] = this[j];
	this[j] = tmp;
}

var totalRows = 4, totalColumns = 4;
var num = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];
var pos = [15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
var degrees = 0;

// var num = [7, 12, 8, 2, 11, 1, 6, 3, 10, 5, 4, 0, 9, 13, 14, 15];
// var pos = [11, 5, 3, 7, 10, 9, 6, 0, 2, 12, 8, 4, 1, 13, 14, 15];

var totalWidth = 0, totalHeight = 0;

function rotateCoord(r, c, degrees) {
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

// Degrees should be only 90 or 270
function draw(image, degrees, imageRow, imageColumn, puzzleRow, puzzleColumn) {
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
   	canvas.style.left = (true ? puzzleColumn : puzzleRow)*25 + "%";
    canvas.style.top = (true ? puzzleRow : puzzleColumn)*25 + "%";
    canvas.style.position = "absolute";

	var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate(degrees*Math.PI/180);

    var sourceWidth = image.width / totalColumns;
    var sourceHeight = image.height / totalRows;
    var coordRotated = rotateCoord(imageRow, imageColumn, degrees);
    var sourceX = sourceWidth * coordRotated.column;
    var sourceY = sourceHeight * coordRotated.row;
    var destX = shouldSwapWidthAndHeight ? -canvas.height/2 : -canvas.width/2;
    var destY = shouldSwapWidthAndHeight ? -canvas.width/2 : -canvas.height/2;
    var destWidth = shouldSwapWidthAndHeight ? canvas.height : canvas.width;
    var destHeight = shouldSwapWidthAndHeight ? canvas.width : canvas.height;

	// drawImage(imageObj, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
	ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
	document.getElementById('grid').appendChild(canvas);
}

$(document).ready(function(){

	Init();

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
		while (true)
		{
			var used = new Array(16);
			for(var i = 0; i < 16; i++)
				used[i] = false;
			
			for (var i = 0; i < 16; i++)
			{
				var index;
				while (true)
				{
					index = Math.floor(Math.random()*16);
					if (!used[index])
						break;
				}
				used[index] = true;
				num[index] = i;
				pos[i] = index;
			}

			if (isPossible(num))
				break;
		}

		Init();
	});

	$('#rotate').click(function() {
		degrees = (degrees + 90) % 360;
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
			for (var i = 0; i < 16; ++i) {
				var positionInImage = (num[i] == 0 ? 15 : num[i]-1);
				var imageColumn = positionInImage % 4;
				var imageRow = Math.floor(positionInImage/4);
				var puzzleColumn = true ? pos[num[i]] % 4 :  Math.floor(i/4);
				var puzzleRow = true ? Math.floor(pos[num[i]]/4) : i % 4;
				draw(img, degrees, imageRow, imageColumn, puzzleRow, puzzleColumn);
			}

			$("#grid").width(totalWidth);
			$("#grid").height(totalHeight);
		}
		img.src = "images/image.jpg"
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


});