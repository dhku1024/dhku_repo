sap.ui.define([
    'jquery.sap.global',
    'sap/ui/table/Table',
    'sap/ui/table/TableRenderer',
    'sap/ui/table/TableUtils',
    'sap/ui/table/Column',
    'sap/ui/model/json/JSONModel',
    'sap/m/P13nDialog',
    'sap/m/P13nColumnsPanel',
    'sap/m/P13nSortPanel',
    'sap/m/P13nFilterPanel',
    'sap/m/P13nGroupPanel',
    'sap/m/P13nItem',
    'sap/m/P13nColumnsItem',
    'sap/m/P13nSortItem',
    'sap/m/P13nFilterItem',
    'sap/m/P13nGroupItem',
    'sap/ui/table/SortOrder',
    'sap/ui/core/Fragment'
], function(jQuery, Table, TableRenderer, TableUtils, Column, JSONModel, P13nDialog, P13nColumnsPanel, P13nSortPanel, P13nFilterPanel, P13nGroupPanel, P13nItem, P13nColumnsItem, P13nSortItem, P13nFilterItem, P13nGroupItem, SortOrder, Fragment) {
    var oTable = Table.extend('custom.UITable', {
        metadata: {
            properties: {
 				usePersoController	: {type : 'boolean', 	group : 'Personalize',	defaultValue : false},							//개인화 설정 사용 여부
				persoData			: {type : 'object', 	group : 'Personalize',	defaultValue : null},							//저장된 개인화 데이터를 초기설정 할때사용 (JSON Data, 또는 JSON Data를 리턴할 Function)
				persoIcon			: {type : 'string',		group : 'Personalize',	defaultValue : 'sap-icon://action-settings'},	//사용하고자 하는 옵션 설정
				persoText			: {type : 'string',		group : 'Personalize',	defaultValue : undefined},						//사용하고자 하는 옵션 설정
				useExportExcel		: {type : 'boolean', 	group : 'ExportExcel',	defaultValue : false},							//엑셀 익스포트 사용 여부
				exportExcelIcon		: {type : 'string',		group : 'ExportExcel',	defaultValue : 'sap-icon://download'},			//엑셀 익스포트 아이콘
				exportExcelText		: {type : 'string', 	group : 'ExportExcel',	defaultValue : undefined},						//엑셀 익스포트 텍스트
				exportExcelOptions	: {type : 'object', 	group : 'ExportExcel',	defaultValue : undefined}						//엑셀 익스포트 옵션
            },

            events : {
				savePersoData : {
					parameters : {
						persoData : {type: 'object'}
					}
				}
			}
        },
        constructor: function() {
            Table.apply(this, arguments);
            var oToolbar = this.getToolbar();

            // 테이블 툴바 설정
            if ( this.getUseExportExcel() ) {
                var oButton = MF.button({
                    icon : this.getExportExcelIcon(),
                    text : this.getExportExcelText(),
                    press : function(oEvent){
                       
                    }
                });

                if ( oToolbar ) {
                    var bExistToolbarspacer = false;
                    jQuery.each(oToolbar.getContent(), function(index, oControl){
                        if ( oControl instanceof sap.m.ToolbarSpacer ) bExistToolbarspacer = true; 
                    });
                    if ( !bExistToolbarspacer ) oToolbar.addContent(MF.toolbarSpacer());
                    oToolbar.addContent(oButton);
                } else {
                    oToolbar = MF.toolbar({
                        content : [
                               MF.toolbarSpacer(),
                               oButton
                        ]
                    })
                }
            }

            if ( this.getUsePersoController() ) {
                var oButton = MF.button({
                    icon : this.getPersoIcon(),
                    text : this.getPersoText(),
                    press : function(oEvent){
                        this._oPersoDialog.open();
                    }.bind(this)
                });

                if ( oToolbar ) {
                    var bExistToolbarspacer = false;
                    jQuery.each(oToolbar.getContent(), function(index, oControl){
                        if ( oControl instanceof sap.m.ToolbarSpacer ) bExistToolbarspacer = true; 
                    });
                    if ( !bExistToolbarspacer ) oToolbar.addContent(MF.toolbarSpacer());
                    oToolbar.addContent(oButton);
                } else {
                    oToolbar = MF.toolbar({
                        content : [
                            MF.toolbarSpacer(),
                            oButton
                        ]
                    })
                }

                //this._oPersoDialog = this._createPersoDialog();
                //this.addDependent(this._oPersoDialog);
                sap.ui.require([
                    "sap/ui/table/sample/TableFreeze/fragments/PersonalizationDialog"
                ], function(oController) {
                    var oDialogController = new oController();
                    
                    Fragment.load({
                        name : "sap.ui.table.sample.TableFreeze.fragments.PersonalizationDialog", 
                        controller : oDialogController
                    }).then(function(oDialog) {
                        oDialogController.onInit(oDialog, this);
                        this.addDependent(oDialog);
                        this._oPersoDialog = oDialog;
                    }.bind(this));
                }.bind(this));
            }

            this.setToolbar(oToolbar);
        },
        renderer: TableRenderer,

        _oPersoDialog: undefined,
        _initPersoData: undefined
    });

    oTable.prototype._createPersoDialog = function() {
        var self = this,
            oColumns = this.getColumns(),
            columnsItems = [],
            persoData = self.getPersoData();

        if ( persoData ) {
            columnsItems = persoData.columnsItems;
            self.removeAllColumns();
            persoData.columnsItems.forEach(function(column) {
                self.addColumn(new sap.ui.table.Column({
                    visible: column.visible,
                    label: new sap.m.Label({ text: column.text }),
                    template: new sap.m.Text({ text: '{' + column.columnKey + '}' }),
                    sortProperty: column.columnKey,
                    filterProperty: column.columnKey,
                    width: column.width,
                    hAlign: column.hAlign
                }));
            });
        } else {
            oColumns.forEach(function(oColumn, oColumnIndex) {
                var columnName = oColumn.getAggregation('label').getText(),
                    columnBindKey = oColumn.getAggregation('template').getBindingPath('text'),
                    columnWidth = oColumn.getWidth(),
                    columnHAlign = oColumn.getHAlign(),
                    columnVisible = oColumn.getVisible();
                
                columnsItems.push({
                    text: columnName,
                    columnKey: columnBindKey,
                    sortProperty: columnBindKey,
                    filterProperty: columnBindKey,
                    index: oColumnIndex,
                    width: columnWidth,
                    hAlign: columnHAlign,
                    visible: columnVisible
                });
            });
        }

        self._initPersoData = {
            columnsItems: columnsItems,
            sortItems: [],
            filterItems: [],
            groupItems: []
        };
        self.setModel(new JSONModel(JSON.parse(JSON.stringify(columnsItems))), 'columnsModel');
        self.setModel(new JSONModel($.extend(true, {}, self._initPersoData)), 'persoModel');

        return new P13nDialog({
        	showReset: true,
        	showResetEnabled: true,
        	ok: function(oEvent) {
                var columnsModel = self.getModel('columnsModel'),
                    persoModel = self.getModel('persoModel'),
                    sortItems = persoModel.getProperty('/sortItems'),
                    filterItems = persoModel.getProperty('/filterItems'),
                    groupItems = persoModel.getProperty('/groupItems'),
                    oColumns,
                    oTargetColumn;

                self.removeAllColumns();
                columnsModel.getData().forEach(function(column) {
                    self.addColumn(new sap.ui.table.Column({
                        visible: column.visible,
                        label: new sap.m.Label({ text: column.text }),
                        template: new sap.m.Text({ text: '{' + column.columnKey + '}' }),
                        sortProperty: column.columnKey,
                        filterProperty: column.columnKey,
                        width: column.width,
                        hAlign: column.hAlign
                    }));
                });
                // self.bindColumns('columnsModel>/', function(sId, contextObject) {
                //     var a = contextObject.getObject();

                //     return new sap.ui.table.Column({
                //         visible: a.visible,
                //         label: new sap.m.Label({ text: a.text }),
                //         template: new sap.m.Text({ text: '{' + a.columnKey + '}' }),
                //         sortProperty: a.sortProperty,
                //         filterProperty: a.filterProperty,
                //         width: a.width,
                //         hAlign: a.hAlign
                //     });
                // });
                // self.refreshAggregation('columns');

                oColumns = self.getColumns();

                if ( sortItems.length > 0 ) {
                    sortItems.forEach(function(sortItem) {
                        oColumns.some(function(oColumn) {
                            var bindKey = oColumn.getAggregation('template').getBindingPath('text');
                            if ( bindKey === sortItem.columnKey ) {
                                oTargetColumn = oColumn;
                                return true;
                            }
                        });

                        self.sort(oTargetColumn, sortItem.operation, true);
                    });
                } else {
                    self.getBinding("rows").sort(null);
                }

                if ( filterItems.length > 0 ) {
                    console.log('filterItems', filterItems);
                }

                if ( groupItems.length > 0 ) {
                    oColumns.some(function(oColumn) {
                        var bindKey = oColumn.getAggregation('template').getBindingPath('text');
                        if ( bindKey === groupItems[0].columnKey ) {
                            oTargetColumn = oColumn;
                            return true;
                        }
                    });

                    self.setGroupBy(oTargetColumn);
                } else {
                    if ( sap.ui.getCore().byId(self.getGroupBy()) ) sap.ui.getCore().byId(self.getGroupBy()).setGrouped(false);
                    TableUtils.Grouping.resetExperimentalGrouping(self);
                }

                self.fireSavePersoData({
                    persoData: {
                        columnsItems: columnsModel.getData()
                    }
                })

                self._oPersoDialog.close();
        	},
        	cancel: function(oEvent) {
                self._oPersoDialog.close();
        	},
            reset: function(oEvent) {
                var columnsModel = self.getModel('columnsModel'),
                    persoModel = self.getModel('persoModel'),
                    resetColumnsItems = [];

                self._initPersoData.columnsItems.forEach(function(columnItem, itemIndex) {
                    var columnName = columnItem.text,
                        columnBindKey = columnItem.columnKey,
                        columnIndex = itemIndex,
                        columnWidth = columnItem.width,
                        columnHAlign = columnItem.hAlign,
                        columnVisible = columnItem.visible;
                    resetColumnsItems.push({
                        text: columnName,
                        columnKey: columnBindKey,
                        sortProperty: columnBindKey,
                        filterProperty: columnBindKey,
                        index: columnIndex,
                        width: columnWidth,
                        hAlign: columnHAlign,
                        visible: columnVisible
                    });
                });
                columnsModel.setProperty('/', resetColumnsItems);
                persoModel.setProperty('/', self._initPersoData);
            },
        	panels: [
                new P13nColumnsPanel({
                    items: {
                        path: 'persoModel>/columnsItems',
                        template: new P13nItem({
                            columnKey: '{persoModel>columnKey}',
                            text: '{persoModel>text}'
                        })
                    },
                    columnsItems: {
                        path: 'persoModel>/columnsItems',
                        template: new P13nColumnsItem({
                            columnKey: '{persoModel>columnKey}',
                            index: '{persoModel>index}',
                            visible: '{persoModel>visible}',
                            customData: [
                                new sap.ui.core.CustomData({
                                    key: 'columnName',
                                    value: '{persoModel>text}'
                                }),
                                new sap.ui.core.CustomData({
                                    key: 'columnWidth',
                                    value: '{persoModel>width}'
                                }),
                                new sap.ui.core.CustomData({
                                    key: 'columnHAlign',
                                    value: '{persoModel>hAlign}'
                                })
                            ]
                        })
                    },
                    changeColumnsItems: function(oEvent) {
                        var oParameters = oEvent.getParameters(),
                            columnsModel = self.getModel('columnsModel'),
                            newColumnsItems = [];

                        oParameters.existingItems.forEach(function(existingItem, itemIndex) {
                            var columnName = existingItem.data('columnName'),
                                columnBindKey = existingItem.getColumnKey(),
                                columnIndex = itemIndex,
                                columnWidth = existingItem.data('columnWidth'),
                                columnHAlign = existingItem.data('columnHAlign'),
                                columnVisible = existingItem.getVisible();
                            newColumnsItems.push({
                                text: columnName,
                                columnKey: columnBindKey,
                                sortProperty: columnBindKey,
                                filterProperty: columnBindKey,
                                index: columnIndex,
                                width: columnWidth,
                                hAlign: columnHAlign,
                                visible: columnVisible
                            });
                        });
                        columnsModel.setProperty('/', newColumnsItems);
                    }
                }),
                new P13nSortPanel({
                    items: {
                        path: 'persoModel>/columnsItems',
                        template: new P13nItem({
                            columnKey: '{persoModel>columnKey}',
                            text: '{persoModel>text}'
                        })
                    },
                    sortItems: {
                        path: 'persoModel>/sortItems',
                        template: new P13nSortItem({
                            columnKey: '{persoModel>columnKey}',
                            operation: '{persoModel>operation}'
                        })
                    },
                    addSortItem: function(oEvent) {
                        var oParameters = oEvent.getParameters(),
                            persoModel = self.getModel('persoModel'), 
                            sortItems = persoModel.getProperty('/sortItems'),
                            columnKey = oParameters.sortItemData.getColumnKey(),
                            operation = oParameters.sortItemData.getOperation();
                        
                        if ( oParameters.index > -1 ) {
                            sortItems.splice(oParameters.index, 0, {
                                columnKey: columnKey,
                                operation: operation
                            })
                        } else {
                            sortItems.push({
                                columnKey: columnKey,
                                operation: operation
                            });
                        }

                        persoModel.setProperty('/sortItems', sortItems);
                    },
                    removeSortItem: function(oEvent){
                        var oParameters = oEvent.getParameters(),
                            persoModel = self.getModel('persoModel'),
                            sortItems = persoModel.getProperty('/sortItems');
                        
                        sortItems.splice(oParameters.index, 1);
                    }
                }),
                new P13nFilterPanel({
                    items: {
                        path: 'persoModel>/columnsItems',
                        template: new P13nItem({
                            columnKey: '{persoModel>columnKey}',
                            text: '{persoModel>text}'
                        })
                    },
                    filterItems: {
                        path: 'persoModel>/filterItems',
                        template: new P13nFilterItem({
                            columnKey: '{persoModel>columnKey}',
                            exclude: '{persoModel>exclude}',
                            operation: '{persoModel>operation}',
                            value1: '{persoModel>value1}',
                            value2: '{persoModel>value2}'    
                        })
                    },
                    addFilterItem: function(oEvent) {
                        console.log('addFilter', oEvent.getParameters());
                        var oParameters = oEvent.getParameters(),
                            persoModel = self.getModel('persoModel'), 
                            filterItems = persoModel.getProperty('/filterItems'),
                            columnKey = oParameters.filterItemData.getColumnKey(),
                            exclude = oParameters.filterItemData.getExclude(),
                            operation = oParameters.filterItemData.getOperation(),
                            value1 = oParameters.filterItemData.getValue1(),
                            value2 = oParameters.filterItemData.getValue2();
                
                    if ( oParameters.index > -1 ) {
                        filterItems.splice(oParameters.index, 0, {
                            columnKey: columnKey,
                            exclude: exclude,
                            operation: operation,
                            value1: value1,
                            value2: value2
                        })
                    } else {
                        filterItems.push({
                            columnKey: columnKey,
                            exclude: exclude,
                            operation: operation,
                            value1: value1,
                            value2: value2
                        });
                    }

                    persoModel.setProperty('/filterItems', filterItems);
                    },
                    removeFilterItem: function(oEvent) {
                        console.log('removeFilter', oEvent.getParameters());
                    },
                    filterItemChanged: function(oEvent) {
                        console.log('changeFilter', oEvent.getParameters());
                        var index = oEvent.getParameter('index'),
                            reason = oEvent.getParameter('reason'),
                            itemData = oEvent.getParameter('itemData'),
                            columnKey = itemData.columnKey,
                            exclude = itemData.exclude,
                            operation = itemData.operation,
                            value1 = itemData.value1,
                            value2 = itemData.value2;

                        console.log('reason', reason);
                        console.log('index', index);    
                        console.log('itemData', itemData);
                    }
                }),
                new P13nGroupPanel({
                    maxGroups: 1,
                    items: {
                        path: 'persoModel>/columnsItems',
                        template: new P13nItem({
                            columnKey: '{persoModel>columnKey}',
                            text: '{persoModel>text}'
                        })
                    },
                    groupItems: {
                        path: 'persoModel>/groupItems',
                        template: new P13nGroupItem({
                            columnKey: '{persoModel>columnKey}',
                            operation: '{persoModel>operation}',
                            showIfGrouped: '{persoModel>showIfGrouped}'
                        })
                    },
                    addGroupItem: function(oEvent) {
                        var oParameters = oEvent.getParameters(),
                            persoModel = self.getModel('persoModel'), 
                            groupItems = persoModel.getProperty('/groupItems'),
                            columnKey = oParameters.groupItemData.getColumnKey(),
                            operation = oParameters.groupItemData.getOperation(),
                            showIfGrouped = oParameters.groupItemData.getShowIfGrouped();
                    
                        if ( oParameters.index > -1 ) {
                            groupItems.splice(oParameters.index, 0, {
                                columnKey: columnKey,
                                operation: operation,
                                showIfGrouped: showIfGrouped
                            })
                        } else {
                            groupItems.push({
                                columnKey: columnKey,
                                operation: operation,
                                showIfGrouped: showIfGrouped
                            });
                        }

                        persoModel.setProperty('/groupItems', groupItems);
                    },
                    removeGroupItem: function(oEvent) {
                        var oParameters = oEvent.getParameters(),
                            persoModel = self.getModel('persoModel'), 
                            groupItems = persoModel.getProperty('/groupItems');

                        groupItems.splice(oParameters.index, 1);
                    }
                })
            ]
        }).addStyleClass(sap.ui.Device.system.desktop ? 'sapUiSizeCompact' : 'sapUiSizeCozy');
    };

    return oTable;
}, true);