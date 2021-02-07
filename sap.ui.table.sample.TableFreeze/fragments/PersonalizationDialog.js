sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
    "sap/ui/table/TableGrouping",
    "sap/ui/model/Sorter"
], function (jQuery, Controller, JSONModel, TableGrouping, Sorter) {
    "use strict";
    
    return Controller.extend("sap.ui.table.sample.TableFreeze.fragments.Personalization", {
        onInit: function(oDialog, oTable) {
            if(oTable && oTable instanceof sap.ui.table.Table) {
                var aColumn = oTable.getColumns(),
                    aColumnItem = [];
                
                aColumn.forEach(function(oColumn, iColumnIndex) {
                    var sColumnId = oColumn.getId(),
                        sColumnName = oColumn.getAggregation("label").getText(),
                        sColumnBindKey = oColumn.getAggregation("template").getBindingPath("text"),
                        sColumnWidth = oColumn.getWidth(),
                        sColumnHAlign = oColumn.getHAlign(),
                        bColumnVisible = oColumn.getVisible();
                    
                    aColumnItem.push({
                        columnId: sColumnId,
                        text: sColumnName,
                        columnKey: sColumnBindKey,
                        sortProperty: sColumnBindKey,
                        filterProperty: sColumnBindKey,
                        index: iColumnIndex,
                        width: sColumnWidth,
                        hAlign: sColumnHAlign,
                        visible: bColumnVisible,
                        targetColumn: oColumn
                    });
                });

                this._oInitPersoData = {
                    aColumnItem: aColumnItem,
                    aSortItem: [],
                    aFilterItem: [],
                    aGroupItem: []
                }

                oDialog.setModel(new JSONModel($.extend(true, {}, this._oInitPersoData)), "persoModel");
            }

            this._oDialog = oDialog;
            this._oTable = oTable;

            oDialog.addStyleClass(sap.ui.Device.system.desktop ? "sapUiSizeCompact" : "sapUiSizeCozy");
        },

        onChangeColumnsItems: function(oEvent) {
            var oPersoModel = this._oDialog.getModel("persoModel"),
                oParameters = oEvent.getParameters(),
                aNewColumnItem = [];

            oParameters.existingItems.forEach(function(oColumnItem, itemIndex) {
                var sColumnId = oColumnItem.data("columnId"),
                    sColumnName = oColumnItem.data("columnName"),
                    sColumnBindKey = oColumnItem.getColumnKey(),
                    iColumnIndex = oColumnItem.getIndex(),
                    sColumnWidth = oColumnItem.getWidth(),
                    sColumnHAlign = oColumnItem.data("columnHAlign"),
                    bColumnVisible = oColumnItem.getVisible(),
                    oTargetColumn = oColumnItem.getBindingContext("persoModel").getObject().targetColumn;
                
                aNewColumnItem.push({
                    id: sColumnId,
                    text: sColumnName,
                    columnKey: sColumnBindKey,
                    sortProperty: sColumnBindKey,
                    filterProperty: sColumnBindKey,
                    index: iColumnIndex,
                    width: sColumnWidth,
                    hAlign: sColumnHAlign,
                    visible: bColumnVisible,
                    targetColumn: oTargetColumn
                });
            });

            oPersoModel.setProperty("/aColumnItem", aNewColumnItem);
        },

        onChangeSortItem: function(oEvent) {
            var sEventId = oEvent.getId(),
                oPersoModel = this._oDialog.getModel("persoModel"),
                aSortItem = oPersoModel.getProperty("/aSortItem"),
                oSortItemData = oEvent.getParameter("sortItemData"),
                iIndex = oEvent.getParameter("index"),
                sColumnKey,
                sOperation;

            if(oSortItemData && sEventId === "addSortItem" || sEventId === "updateSortItem") {
                console.log(sEventId);
                sColumnKey = oSortItemData.getColumnKey();
                sOperation = oSortItemData.getOperation();

                if(aSortItem.length > 0) {
                    aSortItem[iIndex] = {
                        columnKey: sColumnKey,
                        operation: sOperation
                    };
                } else {
                    aSortItem.push({
                        columnKey: sColumnKey,
                        operation: sOperation
                    });
                }
            } else {
                aSortItem.splice(iIndex, 1);
            }

            oPersoModel.refresh(false);
            console.log(oPersoModel.getProperty("/aSortItem"));
        },

        onChangeGroupItem: function(oEvent) {
            var sEventId = oEvent.getId(),
                oPersoModel = this._oDialog.getModel("persoModel"),
                aGroupItem = oPersoModel.getProperty("/aGroupItem"),
                oGroupItemData = oEvent.getParameter("groupItemData"),
                sColumnKey,
                sOperation,
                bShowIfGrouped;

            if(oGroupItemData && sEventId === "addGroupItem" || sEventId === "updateGroupItem") {
                sColumnKey = oGroupItemData.getColumnKey();
                sOperation = oGroupItemData.getOperation();
                bShowIfGrouped = oGroupItemData.getShowIfGrouped();

                if(aGroupItem.length > 0) {
                    aGroupItem.splice(0, 1, {
                        columnKey: sColumnKey,
                        operation: sOperation,
                        showIfGrouped: bShowIfGrouped
                    });
                } else {
                    aGroupItem.push({
                        columnKey: sColumnKey,
                        operation: sOperation,
                        showIfGrouped: bShowIfGrouped
                    });
                }
            } else {
                aGroupItem.splice(0, 1);
            }

            oPersoModel.refresh(false);
        },

        onOK: function(oEvent) {
            var oPersoModel = this._oDialog.getModel("persoModel"),
                oPersoData = oPersoModel.getProperty("/"),
                aColumnItem = oPersoData.aColumnItem,
                aSortItem = oPersoData.aSortItem,
                aGroupItem = oPersoData.aGroupItem,
                oTable = this._oTable,
                oTargetColumn;

            // Column
            oTable.removeAllColumns();
            aColumnItem.forEach(function(oColumnItem) {
                var oTargetColumn = oColumnItem.targetColumn;

                oTargetColumn.setVisible(oColumnItem.visible);
                oTable.addColumn(oTargetColumn);
            });

            // Sort
            if(aSortItem.length > 0) {
                aSortItem.forEach(function(oSortItem, iIndex) {
                    aColumnItem.some(function(oColumnItem) {
                        if(oColumnItem.columnKey === oSortItem.columnKey) {
                            oTargetColumn = oColumnItem.targetColumn;
                            return true;
                        }
                    });

                    if(iIndex > 0) {
                        oTable.sort(oTargetColumn, oSortItem.operation, true);
                    } else {
                        oTable.sort(oTargetColumn, oSortItem.operation, false);
                    }
                });
            } else {
                oTable.getBinding("rows").sort(null);
                aColumnItem.forEach(function(oColumnItem) {
                    oColumnItem.targetColumn.setSorted(false);
                });
            }

            // Grouping
            if(aGroupItem.length > 0) {
                aColumnItem.some(function(oColumnItem) {
                    if(oColumnItem.columnKey === aGroupItem[0].columnKey) {
                        oTargetColumn = oColumnItem.targetColumn;
                        return true;
                    }
                });
                oTable.setGroupBy(oTargetColumn);
            } else {
                var oBinding = oTable.getBinding("rows"),
                    oBindingInfo = oTable.getBindingInfo("rows");
                
                if(sap.ui.getCore().byId(oTable.getGroupBy())) {
                    sap.ui.getCore().byId(oTable.getGroupBy()).setGrouped(false);
                }
                if(oBinding && oBinding._modified) {
                    TableGrouping.clearMode(oTable);
                    oTable.bindRows(oBindingInfo);
                }
            }

            this._oDialog.close();
        },
        
        onClose: function(oEvent) {
        	var oPopup = this.oPopup;
        	
        	oPopup.close();
        	oPopup.destroy();
        }
    });
});