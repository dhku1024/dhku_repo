var MF = {};

MF.uitable = function(o) {
    var oTable = new custom.UITable(o);
    return oTable;
};

MF.toolbar = function(s, o){
    var op = _fnDetermineParameter('toolbar', s, o, arguments[2]);
    op.options =  jQuery.extend({
    }, op.options);
    return new sap.m.Toolbar(op.id, op.options); 
};

MF.toolbarSpacer = function(s, o){ //Toolbar에서 버튼 등을 Left, Right 조정할때 사용한다.
    var op = _fnDetermineParameter('toolbarspacer', s, o, arguments[2]);
    op.options =  jQuery.extend({
    }, op.options);
    return new sap.m.ToolbarSpacer(op.id, op.options);
};

MF.button = function(s, o){
    var op = _fnDetermineParameter('button', s, o, arguments[2]);
    op.options =  jQuery.extend({
    }, op.options);
    return new sap.m.Button(op.id, op.options); 
};
