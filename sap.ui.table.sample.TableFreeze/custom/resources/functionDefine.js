Date.prototype.format = function(f){
    if(!this.valueOf()) return '';
    var weekName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday' , 'Friday', 'Saturday'];
    var self = this;
    return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function(key){
        switch (key){
            case 'yyyy': return self.getFullYear();
            case 'yy': return _fnNumericConvert((self.getFullYear() % 1000), 2);
            case 'MM': return _fnNumericConvert((self.getMonth() + 1), 2);
            case 'dd': return _fnNumericConvert(self.getDate(), 2);
            case 'E': return weekName[self.getDay()];
            case 'HH': return _fnNumericConvert(self.getHours(), 2);
            case 'hh': return _fnNumericConvert(((h = self.getHours() % 12) ? h : 12), 2);
            case 'mm': return _fnNumericConvert(self.getMinutes(), 2);
            case 'ss': return _fnNumericConvert(self.getSeconds(), 2);
            case 'a/p': return self.getHours() < 12 ? 'AM' : 'PM';
            default: return key;
        }
    });
};

_findJSONData = function(obj, key, value, isLike){
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(this._findJSONData(obj[i], key, value, isLike));
        } else if (i === key && 
        		   ((isLike && obj[key] && value && obj[key].toLowerCase().indexOf(value.toLowerCase()) > -1) || 
        		   (!isLike && obj[key] && value && obj[key].toLowerCase() === value.toLowerCase()))) {
            objects.push(obj);
        }
    }
    return objects;
};

_sortJSONData = function (obj, key, asc, isNumeric){
	if(!jQuery.isArray(obj)) return;
	var valueA, valueB;
	if(isNumeric === undefined && obj[0] !== undefined && obj[0].hasOwnProperty(key)) isNumeric = jQuery.isNumeric(obj[0][key]);
	if(isNumeric){
		obj = obj.sort(function (a, b) {
			asc ?  (valueA = jQuery.type(a[key]) === 'string' ? a[key].replace(/,/gi,'') : a[key], valueB = jQuery.type(b[key]) === 'string' ? b[key].replace(/,/gi,'') : b[key]) 
					:  (valueA = jQuery.type(b[key]) === 'string' ? b[key].replace(/,/gi,'') : b[key], valueB = jQuery.type(a[key]) === 'string' ? a[key].replace(/,/gi,'') : a[key]);
			return (parseFloat(valueA) > parseFloat(valueB)) ? 1 : ((parseFloat(valueA) < parseFloat(valueB)) ? -1 : 0);
		});
	}else{
		obj = obj.sort(function (a, b) {
			asc ?  (valueA = a[key] || '', valueB = b[key]  || '') : (valueA = b[key]  || '', valueB = a[key]  || ''); 
			return (valueA.toLowerCase() > valueB.toLowerCase()) ? 1 : ((valueA.toLowerCase() < valueB.toLowerCase()) ? -1 : 0);
		});
	}
};

_fnDetermineParameter = function(elementName, s, o, oViewIntance){
	var returnValue = {
		id : undefined,
		options : undefined 
	};
	var bViewCreateId = true;
	
	if(jQuery.type(oViewIntance) === 'boolean'){
		bViewCreateId = !oViewIntance;
	}
	if(jQuery.type(o) !== 'undefined'){
		if(jQuery.isPlainObject(o)){
			returnValue.options = o; 
			returnValue.id = s;
		}else if(jQuery.type(o) === 'boolean'){
			bViewCreateId = !o;
		}else if(o instanceof sap.ui.core.mvc.View){
			oViewIntance = o;
		}
	}
	if(jQuery.type(s) !== 'undefined'){
		if(jQuery.isPlainObject(s)){
			returnValue.options = s;
		}else if(jQuery.type(s) === 'boolean'){
			bViewCreateId = !s;
		}else if(s instanceof sap.ui.core.mvc.View){
			oViewIntance = s;
		}else{
			returnValue.id = s;
		}
	}
	if(!returnValue.id && returnValue.options && returnValue.options.id) returnValue.id = returnValue.options.id;
	if(returnValue.options === undefined) returnValue.options = {};
	
	// var oView = oViewIntance || jQuery.core._oView || window._oView;
	// if(oView && !returnValue.id){
	// 	if(oView._bpfElementCount === undefined) oView._bpfElementCount = {};
	// 	oView._bpfElementCount[elementName] = oView._bpfElementCount[elementName] || 0; 
	// 	returnValue.id = jQuery.configuration.getUIDPrefix() + elementName + oView._bpfElementCount[elementName]++; 
	// }
	// if(oView && bViewCreateId) returnValue.id = oView.createId(returnValue.id);
	return returnValue;
};

_fnCoreServiceRequest = function(url, data, async, fnSuccess, fnError){
	jQuery.ajax({
  		url		: '/bpfCore/' + url,
  		async	: async ? async : true,
  		dataType: 'json',
  		data	: data,
  		cache	: false,
  		type	: 'POST',
  		success	: fnSuccess,
		error	: fnError
	});
};

_fnGenModelData = function(oData, path){
	var dataObj;
	if(oData && path){
		dataObj = oData;
		jQuery.each(path.split('/'), function(index, path){
			if(path){
				if(!dataObj[path]) dataObj[path] = {};
				dataObj= dataObj[path];
			}
		});
	}
};

_fnSetOpacity = function($obj, cssName, opacity){
	if($obj.length > 0 && cssName){
		var rgba = _fnJsonforRGB($obj.css(cssName));
		if(rgba) $obj.css(cssName, 'rgba(' + rgba.red + ', ' + rgba.green + ', ' + rgba.blue + ', ' + opacity + ')');
	}
};

_fnJsonforRGB = function(rgb){
	var returnValue;
	if(rgb){
		returnValue = {
			red : undefined,
			green : undefined,
			blue : undefined,
			opacity : undefined
		};
		var _ColorList;
		if(rgb.indexOf('rgb(') > -1){
			_ColorList= rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
			if(_ColorList.length === 4){
				returnValue.red 	= Number(_ColorList[1]); 
				returnValue.green	= Number(_ColorList[2]);
				returnValue.blue	= Number(_ColorList[3]);
				returnValue.opacity	= 1;
			}
		}else if(rgb.indexOf('rgba(') > -1){
			_ColorList = rgb.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d?\.?\d*)\)$/);
			if(_ColorList.length === 5){
				returnValue.red 	= Number(_ColorList[1]); 
				returnValue.green	= Number(_ColorList[2]);
				returnValue.blue	= Number(_ColorList[3]);
				returnValue.opacity	= Number(_ColorList[4]);
			}
		}else{
			returnValue = undefined;
		}
	}
	return returnValue;
};

_fnHexToRgb = function(hex){
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

_fnNumericConvert = function(value, length){
	var returnValue = '';
	if(value !== undefined && value !== null){
		value = String(value);
		for(var i = value.length; i < length; i++){
			returnValue += '0';
		}
		returnValue += value;
	}
	return returnValue;
};

_fnNumericComma = function(value, addComma){
	var returnValue;
	if(value === undefined || value === null) return;
	if(!isNaN(value) && addComma){
		if(value.toString().indexOf('.') > -1){
			var _SplitValue = value.toString().split('.');
			returnValue = _SplitValue[0].replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,') + '.' + _SplitValue[1];
		}else{
			returnValue = value.toString().replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,'); 
		}
	}else{
		returnValue = addComma ? value : value.toString().replace(/,/gi,'');
	}
	return returnValue;
};

_fnStringExtract = function(value){
	var returnValue;
	if(value !== undefined && value !== null) returnValue = value.replace(/[^a-zA-Z]/g, '');
	return returnValue;
};

_fnNumericExtract = function(value){
	var returnValue;
	if(value !== undefined && value !== null) returnValue = Number(value.replace(/[^0-9]/g, ''));
	return returnValue;
};

_fnNumericOnlyToKeydown = function(oEvent){
	if(oEvent.altKey || oEvent.ctrlKey) oEvent.preventDefault();
	var key = oEvent.which ? oEvent.which : event.keyCode;
	var allowDecimal = !(this.data && this.data('decimalPoint') === 0);
	var isShift = oEvent.shiftKey;
	//	←(백스패이스) = 8
	//	TAB = 9
	//  ENTER = 13
	//	END = 35
	//	HOME =36 
	//	← = 37
	//	→  = 39
	//	INSERT = 45
	//	DELETE = 46
	//	NUMLOCK = 144
	//	. 190, 110
	//	- = 109, 189
	if(!((!isShift && key === 8) || (!isShift && key === 9) || (!isShift && key === 13) || key === 35 || key === 36 || key === 37 || key === 39 || 
		 (!isShift && key === 45) || (!isShift && key === 46) || (!isShift && key === 144) || 
		 (!isShift && key >= 48 && key <= 57) || (!isShift && key >= 96 && key <= 105) || 
		 (!isShift && key === 190 && allowDecimal) || (!isShift && key === 110 && allowDecimal) || (!isShift && key === 109) || (!isShift && key === 189))){
		oEvent.preventDefault();
	}
};

_fnGenerateScrollbarBtn = function(oTable, type){
	var returnValue = [];
	switch(type){
		case 'F' : {//First
			returnValue.push(
				'<td class=\"sbiScrollBtn\" style=\"text-align:center;font-size:10px;\" onClick=\"_fnScrollbarBtnClick(\'' + oTable.getId() + '\',\'' + type + '\');\">',
					'<a class=\"first\"></a>',
				'</td>'
			);
		}break;
		case 'P' : {//Previous
			returnValue.push(
				'<td class=\"sbiScrollBtn\" style=\"text-align:center;font-size:10px;\" onClick=\"_fnScrollbarBtnClick(\'' + oTable.getId() + '\',\'' + type + '\');\">',
					'<a class=\"previous\"></a>',
				'</td>'
			);
		}break;
		case 'N' : {//Next
			returnValue.push(
				'<td class=\"sbiScrollBtn\" style=\"text-align:center;font-size:10px;\" onClick=\"_fnScrollbarBtnClick(\'' + oTable.getId() + '\',\'' + type + '\');\">',
					'<a class=\"next\"></a>',
				'</td>'
			);
		}break;
		case 'L' : {//Last
			returnValue.push(
				'<td class=\"sbiScrollBtn\" style=\"text-align:center;font-size:10px;\" onClick=\"_fnScrollbarBtnClick(\'' + oTable.getId() + '\',\'' + type + '\');\">',
					'<a class=\"last\"></a>',
				'</td>'
			);
		}break;
	}
	return returnValue.join('');
};

_fnScrollbarBtnClick = function(tableId, type){
	if(!tableId || !type) return;
	var oTable = jQuery.id(tableId); 
	var firstVisibleRow = oTable.getFirstVisibleRow();
	switch(type){
		case 'F' : {//First
			if(firstVisibleRow > 0) oTable.setFirstVisibleRow(0);
		}break;
		case 'P' : {//Previous
			if(firstVisibleRow - 1 > 0) oTable.setFirstVisibleRow(firstVisibleRow - 1);
		}break;
		case 'N' : {//Next
			oTable.setFirstVisibleRow(firstVisibleRow + 1);
		}break;
		case 'L' : {//Last
			oTable.setFirstVisibleRow(oTable.getBinding('rows').iLength);
		}break;
	}
};

_fnNumericToMeasure = function(value){
	if(!value) return '0';
	var measures  = ['', '만', '억', '조', '경', '해', '자', '양', '구', '간', '정'], returnValue = '';
	value = (value + '').replace(/,/g, '');
    var pattern = /(-?[0-9]+)([0-9]{4})/;
    while(pattern.test(value)) {                   
    	value = value.replace(pattern, '$1,$2');
    }
    var measureCnt = value.split(',').length - 1;
    for(var ii=0; ii<value.split(',').length; ii++) {
    	if(measures[measureCnt] === undefined) {
    		break;
        }
    	var tmpValue = 0;
    	for(i=0;i<value.split(',')[ii].length;i++){
    		var num = value.split(',')[ii].substring(i,i+1);
    		tmpValue = tmpValue + Number(num);
    	}
    	if(tmpValue > 0){
    		returnValue += Number(value.split(',')[ii]) + measures[measureCnt]; //55억0000만0000원 이런 형태 방지 0000 다 짤라 버린다
    	}
    	measureCnt--;
    }
    return returnValue;
};

_fnIsNumber = function(value) {
	value += '';
	value = value.replace(/^\s*|\s*$/g, '');
	if (value== '' || isNaN(value)) return false;
	return true;
};