Array.prototype.swap = function (i, j)
{
	var tmp = this[i];
	this[i] = this[j];
	this[j] = tmp;
}

var num = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];
var pos = [15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

// var num = [7, 12, 8, 2, 11, 1, 6, 3, 10, 5, 4, 0, 9, 13, 14, 15];
// var pos = [11, 5, 3, 7, 10, 9, 6, 0, 2, 12, 8, 4, 1, 13, 14, 15];

var totalWidth = 0, totalHeight = 0;

// Degrees should be only 90 or 270
function draw(image, degrees, imageRow, imageColumn, totalRows, totalColumns, puzzleRow, puzzleColumn, tileId) {
    var canvasJQuery = $(document.createElement("canvas"));
    var canvas = canvasJQuery[0];
    var ctx = canvas.getContext("2d");

    var maxTotalWidth = 648;
	var canvasWidth = image.width > maxTotalWidth ? maxTotalWidth : image.width;
	var aspectRatio = canvasWidth / image.width;
	var canvasHeight = image.height * aspectRatio;
	canvasWidth /= totalColumns;
	canvasHeight /= totalRows;

    // always swap width and height
    canvas.width = canvasHeight;
    canvas.height = canvasWidth;

    totalWidth += canvasHeight / totalColumns;
    totalHeight += canvasWidth / totalRows;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate(degrees*Math.PI/180);

    // drawImage(imageObj, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
    var sourceWidth = image.width / totalColumns;
    var sourceHeight = image.height / totalRows;
    var sourceX = sourceWidth * (totalRows - imageRow - 1);
    var sourceY = sourceHeight * imageColumn;

    var tileId = imageRow * totalColumns + imageColumn;
    if (tileId != 15) {
    	ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, -canvas.height/2, -canvas.width/2, canvas.height, canvas.width);
    	document.getElementById('grid').appendChild(canvas);
    }

    canvas.style.left = puzzleColumn*25 + "%";
    canvas.style.top = puzzleRow*25 + "%";
    canvas.style.position = "absolute";

    // Don't know why you can't set javascript width/height with float values.
    canvasJQuery.width(canvasHeight);
    canvasJQuery.height(canvasWidth);
    canvasJQuery.addClass("square");
    canvasJQuery.attr("id", tileId+1);
}

$(document).ready(function(){

	console.log("num:", num);
	console.log("pos:", pos);

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
		totalWidth = 0;
		totalHeight = 0;
		$('#grid').empty();
		var img = new Image();
		img.onload = function() {
			// for (var i = 0; i < 4; ++i)
			// 	for (var j = 0; j < 4; ++j)
			// 		draw(img, 270, i, j, 4, 4, i == 3 && j == 3);
			for (var i = 0; i < 16; ++i) {
				var positionInImage = (num[i] == 0 ? 15 : num[i]-1);
				var imageColumn = positionInImage % 4;
				var imageRow = Math.floor(positionInImage/4);
				var puzzleColumn = i % 4;
				var puzzleRow = Math.floor(i/4);
				draw(img, 270, imageRow, imageColumn, 4, 4, puzzleRow, puzzleColumn, num[i]);
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