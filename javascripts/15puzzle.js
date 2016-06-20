Array.prototype.swap = function (i, j)
{
	var tmp = this[i];
	this[i] = this[j];
	this[j] = tmp;
}

$(document).ready(function(){

	var num = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];
	var pos = [15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];


	//var num = [7, 12, 8, 2, 11, 1, 6, 3, 10, 5, 4, 0, 9, 13, 14, 15];
	//var pos = [11, 5, 3, 7, 10, 9, 6, 0, 2, 12, 8, 4, 1, 13, 14, 15];


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
		$('#grid').empty();
		var grid  = document.getElementById('grid');
		var tiles = "";

		for (var i = 0; i < 16; i++)
		{

			if (num[i] == 0)
				continue;

			tiles += '<div class="square" id = ' + num[i] + ' style="left:' + (i%4)*25 + '%; top:' + Math.floor(i/4)*25 + '%; color:' + Math.floor(Math.random()*16777215).toString(16) + '">';
		    tiles += '<div class="content">';
		    tiles += '<div class="table">';
		    tiles += '<div class="table-cell">';
		    tiles +=  num[i].toString();
		    tiles += '</div>';
		    tiles += '</div>';
		    tiles += '</div>';
			tiles += '</div>';
		}

		grid.innerHTML = tiles;
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